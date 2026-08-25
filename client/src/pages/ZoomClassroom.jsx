import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import ZoomMtgEmbeddedImport from '@zoom/meetingsdk/embedded';
import { useAuth } from '../contexts/AuthContext';
import { zoomService } from '../services/portalService';
import { API_URL } from '../constants';
import { getRoleHomePath } from '../utils/authRedirect';

// ── Global MediaStream Tracker ─────────────────────────────────────────────────
if (typeof window !== 'undefined' && !window.__lmsMediaTracked) {
  window.__lmsMediaTracked = true;
  window.__lmsActiveTracks = new Set();
  window.__lmsScreenTracks = new Set();
  window.__lmsScreenShareListeners = new Set();

  if (navigator?.mediaDevices?.getUserMedia) {
    const origGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = async (...args) => {
      const stream = await origGetUserMedia(...args);
      if (stream?.getTracks) {
        stream.getTracks().forEach((track) => {
          window.__lmsActiveTracks.add(track);
          track.addEventListener('ended', () => window.__lmsActiveTracks.delete(track));
        });
      }
      return stream;
    };
  }

  if (navigator?.mediaDevices?.getDisplayMedia) {
    const origGetDisplayMedia = navigator.mediaDevices.getDisplayMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getDisplayMedia = async (constraints = {}) => {
      // Break the most common infinity-mirror paths:
      // - exclude this classroom tab from the picker (Chrome 107+)
      // - never prefer the current tab as the share target
      const enhanced = {
        ...constraints,
        preferCurrentTab: false,
        selfBrowserSurface: 'exclude',
        surfaceSwitching: constraints?.surfaceSwitching ?? 'include',
        video:
          typeof constraints?.video === 'object' && constraints.video !== null
            ? { ...constraints.video }
            : (constraints?.video ?? true),
      };

      const stream = await origGetDisplayMedia(enhanced);
      if (stream?.getTracks) {
        stream.getTracks().forEach((track) => {
          window.__lmsScreenTracks.add(track);
          window.__lmsActiveTracks.add(track);
          window.__lmsScreenShareListeners.forEach((fn) => fn(true, stream));

          track.addEventListener('ended', () => {
            window.__lmsScreenTracks.delete(track);
            window.__lmsActiveTracks.delete(track);
            if (window.__lmsScreenTracks.size === 0) {
              window.__lmsScreenShareListeners.forEach((fn) => fn(false, null));
            }
          });
        });
      }
      return stream;
    };
  }
}

// ── Stop all camera/mic hardware tracks ───────────────────────────────────────
function stopMediaTracks() {
  try {
    if (window.__lmsScreenTracks) {
      window.__lmsScreenTracks.forEach((track) => {
        try { track.stop(); track.enabled = false; } catch (_) {}
      });
      window.__lmsScreenTracks.clear();
    }
  } catch (_) {}
  try {
    if (window.__lmsActiveTracks) {
      window.__lmsActiveTracks.forEach((track) => {
        try { track.stop(); track.enabled = false; } catch (_) {}
      });
      window.__lmsActiveTracks.clear();
    }
  } catch (_) {}
  try {
    document.querySelectorAll('video, audio').forEach((el) => {
      if (el.srcObject?.getTracks) {
        el.srcObject.getTracks().forEach((t) => { try { t.stop(); t.enabled = false; } catch (_) {} });
        el.srcObject = null;
      }
      try { el.pause(); } catch (_) {}
    });
  } catch (_) {}
}

// ── Fully destroy a Zoom embedded client and clear the container ───────────────
async function destroyZoomClient(clientRef, containerRef) {
  stopMediaTracks();
  const client = clientRef.current;
  if (client) {
    clientRef.current = null;
    try {
      if (typeof client.leaveMeeting === 'function') {
        await client.leaveMeeting();
      } else if (typeof client.leave === 'function') {
        await client.leave();
      }
    } catch (e) {
      console.warn('[Zoom] leave failed:', e);
    }
    // Brief wait so SDK WebSocket closes cleanly and server registers departure
    await new Promise((r) => setTimeout(r, 600));
    try {
      if (typeof client.destroy === 'function') client.destroy();
    } catch (_) {}
    // Extra wait after destroy so SDK singleton internal state resets
    await new Promise((r) => setTimeout(r, 400));
  }
  if (containerRef.current) {
    containerRef.current.innerHTML = '';
  }
}

// ── Resolve Zoom embedded SDK (handles CJS/ESM module shapes) ─────────────────
function getZoomEmbedded() {
  const mod = ZoomMtgEmbeddedImport;
  if (typeof mod?.createClient === 'function') return mod;
  if (typeof mod?.default?.createClient === 'function') return mod.default;
  throw new Error('Zoom SDK could not be initialized. Please refresh and try again.');
}

function getBackPath(role, courseId) {
  if (courseId) {
    if (role === 'STUDENT') return `/student/course/${courseId}`;
    if (role === 'INSTRUCTOR') return `/instructor/courses/${courseId}/manage`;
    if (role === 'ADMIN') return `/admin/courses/${courseId}/manage`;
  }
  return getRoleHomePath(role);
}

// Zoom Component View sizes the video canvas to viewSizes, then stacks the
// mic/camera/share footer BELOW that canvas. If we pass the full container
// height, the toolbar is pushed off-screen and clipped by overflow:hidden.
const ZOOM_FOOTER_PX = 72;
// Zoom ribbon max width is 316px; ~300 gives a Meet/Zoom-style participant strip.
const ZOOM_RIBBON_W = 300;
const ZOOM_SHARE_GAP = 10;

/**
 * Compute gallery vs screen-share viewSizes.
 * - Gallery/speaker: default fills the stage.
 * - Screen share: main stage + narrow vertical ribbon (participants on the right).
 */
function measureZoomLayout(el, { sharing = false } = {}) {
  const width = Math.max(320, Math.floor(el?.offsetWidth || window.innerWidth));
  const available = Math.floor(el?.offsetHeight || Math.max(window.innerHeight - 44, 240));
  const height = Math.max(180, available - ZOOM_FOOTER_PX);

  if (sharing) {
    const ribbonW = Math.min(ZOOM_RIBBON_W, Math.max(240, Math.floor(width * 0.22)));
    const mainW = Math.max(480, width - ribbonW - ZOOM_SHARE_GAP);
    return {
      width: mainW,
      height,
      viewSizes: {
        default: { width: mainW, height },
        ribbon: { width: ribbonW, height },
      },
      ribbonW,
    };
  }

  return {
    width,
    height,
    viewSizes: {
      default: { width, height },
      // Keep a correct ribbon size ready for when share starts
      ribbon: { width: ZOOM_RIBBON_W, height },
    },
    ribbonW: ZOOM_RIBBON_W,
  };
}

function applyZoomViewSizes(client, el, sharing) {
  if (!client || typeof client.updateVideoOptions !== 'function' || !el) return;
  const { viewSizes } = measureZoomLayout(el, { sharing });
  try {
    client.updateVideoOptions({ viewSizes });
  } catch (_) {}
}

export default function ZoomClassroom() {
  const { meetingId } = useParams();
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get('courseId');
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const containerRef = useRef(null);
  const clientRef = useRef(null);
  const attendanceRecorded = useRef(false);
  const hasJoinedRef = useRef(false);
  const isLeavingRef = useRef(false);
  const initInProgress = useRef(false);        // ← prevents double-init on StrictMode
  const [meetingDbId, setMeetingDbId] = useState(null);

  const [status, setStatus] = useState('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [joinUrl, setJoinUrl] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSharingMyScreen, setIsSharingMyScreen] = useState(false);
  // Anyone in the meeting is actively sharing (drives share+ribbon layout)
  const [isShareLayoutActive, setIsShareLayoutActive] = useState(false);
  // Tracks whether someone in the meeting is actively sharing their screen (student view)
  const [activeSharerName, setActiveSharerName] = useState(null);
  const isShareLayoutRef = useRef(false);
  const syncShareLayoutRef = useRef(null);

  const isHost = user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN';

  const syncShareLayout = useCallback((active) => {
    isShareLayoutRef.current = !!active;
    setIsShareLayoutActive(!!active);
    applyZoomViewSizes(clientRef.current, containerRef.current, !!active);
    // Give Zoom a beat to reflow share + ribbon, then re-apply sizes
    setTimeout(() => {
      applyZoomViewSizes(clientRef.current, containerRef.current, isShareLayoutRef.current);
      window.dispatchEvent(new Event('resize'));
    }, 120);
    setTimeout(() => {
      applyZoomViewSizes(clientRef.current, containerRef.current, isShareLayoutRef.current);
    }, 450);
  }, []);

  syncShareLayoutRef.current = syncShareLayout;

  // Let Zoom's UI use the full viewport; global html/body/#root overflow-x:hidden
  // otherwise clips the footer toolbar and blocks scrolling to it.
  useEffect(() => {
    document.body.classList.add('zoom-classroom-open');
    document.documentElement.classList.add('zoom-classroom-open');
    return () => {
      document.body.classList.remove('zoom-classroom-open');
      document.documentElement.classList.remove('zoom-classroom-open');
    };
  }, []);

  // ── Screen share tracking (instructor — own local share via getDisplayMedia) ──
  useEffect(() => {
    const onScreenShareChange = (isSharing) => {
      setIsSharingMyScreen(isSharing);
      if (isSharing) {
        // Local presenter: switch to share+ribbon and cover the recursive preview
        syncShareLayout(true);
      } else if (!activeSharerName) {
        syncShareLayout(false);
      }
    };
    window.__lmsScreenShareListeners?.add(onScreenShareChange);
    return () => {
      window.__lmsScreenShareListeners?.delete(onScreenShareChange);
    };
  }, [syncShareLayout, activeSharerName]);

  const stopMyScreenShare = useCallback(() => {
    try {
      if (window.__lmsScreenTracks) {
        window.__lmsScreenTracks.forEach((t) => {
          try { t.stop(); } catch (_) {}
        });
        window.__lmsScreenTracks.clear();
      }
    } catch (_) {}
    setIsSharingMyScreen(false);
    if (!activeSharerName) syncShareLayout(false);
  }, [activeSharerName, syncShareLayout]);

  // ── Fullscreen toggle ──────────────────────────────────────────────────────
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      // Give Zoom time to reflow, then fire resize so it re-renders to new dims
      setTimeout(() => window.dispatchEvent(new Event('resize')), 150);
      setTimeout(() => window.dispatchEvent(new Event('resize')), 500);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  // ── Keep Zoom video + footer toolbar inside the visible container ────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let resizeTimer;
    const applySize = () => {
      window.dispatchEvent(new Event('resize'));
      applyZoomViewSizes(clientRef.current, el, isShareLayoutRef.current);
    };
    const ro = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(applySize, 100);
    });
    ro.observe(el);
    window.addEventListener('resize', applySize);
    return () => {
      ro.disconnect();
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', applySize);
    };
  }, []);


  const goBack = useCallback(() => {
    stopMediaTracks();
    const dest = user?.role ? getBackPath(user.role, courseId) : '/';
    window.location.href = dest;
  }, [user?.role, courseId]);

  // ── Full teardown: destroy SDK client, reset all refs ─────────────────────
  const fullTeardown = useCallback(async () => {
    await destroyZoomClient(clientRef, containerRef);
    // Reset session refs so a fresh init works cleanly
    hasJoinedRef.current = false;
    attendanceRecorded.current = false;
    isLeavingRef.current = false;
    initInProgress.current = false;
  }, []);

  // ── Join failed ────────────────────────────────────────────────────────────
  const handleJoinFailure = useCallback(async (message) => {
    await fullTeardown();
    setStatus('error');
    setErrorMsg(message || 'Failed to join the meeting. Please try again.');
  }, [fullTeardown]);

  // ── Leave class (student / instructor pressing Leave) ──────────────────────
  const handleLeave = useCallback(async () => {
    if (isLeavingRef.current) return;
    isLeavingRef.current = true;
    if (attendanceRecorded.current) {
      try { await zoomService.leaveAttendance(meetingId); }
      catch (e) { console.warn('Leave attendance error:', e); }
    }
    await fullTeardown();
    goBack();
  }, [meetingId, fullTeardown, goBack]);

  // ── End class for host (ends it for all participants) ─────────────────────
  const handleEndClassForHost = useCallback(async () => {
    if (!window.confirm('Are you sure you want to end this live class for all participants?')) return;
    if (isLeavingRef.current) return;
    isLeavingRef.current = true;
    try { await zoomService.endClass(meetingDbId || meetingId); }
    catch (e) { console.warn('End class error:', e); }
    if (attendanceRecorded.current) {
      try { await zoomService.leaveAttendance(meetingId); } catch (_) {}
    }
    await fullTeardown();
    goBack();
  }, [meetingDbId, meetingId, fullTeardown, goBack]);

  // ── Heartbeat polling: Auto-leave students when teacher ends class ─────────
  useEffect(() => {
    if (status !== 'live' || isHost) return;
    let isCancelled = false;

    const interval = setInterval(async () => {
      try {
        const res = await zoomService.getStatus(meetingId);
        const meetingStatus = res.data?.data?.status;
        const dbStatus = res.data?.data?.dbStatus;

        if (meetingStatus === 'ENDED' || dbStatus === 'ENDED' || meetingStatus === 'CANCELLED' || dbStatus === 'CANCELLED') {
          if (!isCancelled && !isLeavingRef.current) {
            console.log('[Zoom Heartbeat] Live class was ended by instructor. Auto-leaving...');
            isLeavingRef.current = true;
            clearInterval(interval);
            alert('The instructor has ended this live class.');
            if (attendanceRecorded.current) {
              try { await zoomService.leaveAttendance(meetingId); } catch (_) {}
            }
            await fullTeardown();
            goBack();
          }
        }
      } catch (err) {
        console.warn('[Zoom Heartbeat] Status check warning:', err.message);
      }
    }, 3000);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [status, isHost, meetingId, fullTeardown, goBack]);

  // ── Main init / re-init effect ─────────────────────────────────────────────
  useEffect(() => {
    if (loading || !user) return;

    let isMounted = true;

    const init = async () => {
      // Prevent double-init (React StrictMode double-fires effects)
      if (initInProgress.current) return;
      initInProgress.current = true;

      try {
        setStatus('loading');
        setErrorMsg('');

        // ── Step 1: Fully destroy any prior SDK client before re-creating ──
        await destroyZoomClient(clientRef, containerRef);
        // Reset session refs for a clean slate
        hasJoinedRef.current = false;
        attendanceRecorded.current = false;
        isLeavingRef.current = false;

        if (!isMounted) return;

        // ── Step 2: Resolve SDK ────────────────────────────────────────────
        const ZoomMtgEmbedded = getZoomEmbedded();
        if (!isMounted) return;

        // ── Step 3: Wait for container to have real pixel dimensions ───────
        // (Zoom Embedded SDK requires the mount element to be visible & sized)
        await new Promise((resolve) => {
          let tries = 0;
          const check = () => {
            const el = containerRef.current;
            if (el && el.offsetWidth > 0 && el.offsetHeight > 120) return resolve();
            if (++tries > 60) return resolve(); // give up after 3s
            setTimeout(check, 50);
          };
          check();
        });
        if (!isMounted) return;

        setStatus('joining');

        // ── Step 4: Fetch signature ────────────────────────────────────────
        const sdkRole = (user.role === 'INSTRUCTOR' || user.role === 'ADMIN') ? 1 : 0;
        const { data: sigResp } = await zoomService.getSignature(meetingId, sdkRole);
        const payload = sigResp?.data;

        if (!payload?.signature || !payload?.sdkKey || !payload?.meetingNumber) {
          throw new Error(
            payload ? 'Incomplete signature data returned by server.' : 'Server did not return signature data.'
          );
        }

        const { signature, sdkKey, meetingNumber, password, zak, joinUrl: meetingJoinUrl, meetingDbId: dbId } = payload;
        if (meetingJoinUrl) setJoinUrl(meetingJoinUrl);
        if (dbId) setMeetingDbId(dbId);

        if (!isMounted) return;

        // ── Step 5: Create a fresh client ──────────────────────────────────
        const client = ZoomMtgEmbedded.createClient();
        clientRef.current = client;

        const containerEl = containerRef.current;
        if (!containerEl) throw new Error('Meeting container element not found.');

        // ── Step 6: Init SDK; leave room below the canvas for Zoom's footer ─
        await new Promise((r) => requestAnimationFrame(r));
        const { viewSizes: initialViewSizes } = measureZoomLayout(containerEl, { sharing: false });

        try {
          await client.init({
            zoomAppRoot: containerEl,
            language: 'en-US',
            patchJsMedia: true,
            leaveOnPageUnload: true,
            maximumVideosInGalleryView: 25,
            customize: {
              video: {
                isResizable: false,
                defaultViewType: 'gallery',
                viewSizes: initialViewSizes,
                popper: { disableDraggable: true },
              },
              sharing: {
                options: {
                  hideShareAudioOption: false,
                },
              },
            },
          });
        } catch (initErr) {
          console.error('[Zoom] client.init() failed:', initErr?.message || initErr);
          if (!isMounted) return;
          throw new Error('Zoom SDK could not initialize. Please refresh and try again.');
        }

        if (!isMounted) return;

        // ── Step 7: Register connection & meeting event listeners ────────
        client.on('connection-change', (ev) => {
          if (!isMounted) return;
          console.log('[Zoom] connection-change:', ev);
          if (ev?.state === 'Fail') {
            handleJoinFailure(ev.reason || ev.errorMessage || 'Connection failed. Please try again.');
          } else if (ev?.state === 'Closed' && hasJoinedRef.current && !isLeavingRef.current) {
            // SDK closed the connection (host ended the meeting, network issue, etc.)
            handleLeave();
          }
        });

        client.on('meeting-status', (data) => {
          if (!isMounted) return;
          console.log('[Zoom] meeting-status:', data);
          if (data?.status === 'ended' || data?.status === 'closed' || data?.meetingStatus === 3) {
            handleLeave();
          }
        });

        // ── Track active screen share → professional share + ribbon layout ──
        client.on('active-share-change', (ev) => {
          if (!isMounted) return;
          if (ev?.state === 'Active') {
            setActiveSharerName(ev?.displayName || 'the instructor');
            syncShareLayoutRef.current?.(true);
          } else {
            setActiveSharerName(null);
            // Keep share layout if we are still the local presenter
            if (!window.__lmsScreenTracks || window.__lmsScreenTracks.size === 0) {
              setIsSharingMyScreen(false);
              syncShareLayoutRef.current?.(false);
            }
          }
        });
        client.on('peer-share-state-change', (ev) => {
          if (!isMounted) return;
          if (ev?.action === 'Start') {
            setActiveSharerName(ev?.userName || ev?.displayName || 'the instructor');
            syncShareLayoutRef.current?.(true);
          } else if (ev?.action === 'Stop') {
            setActiveSharerName(null);
            if (!window.__lmsScreenTracks || window.__lmsScreenTracks.size === 0) {
              setIsSharingMyScreen(false);
              syncShareLayoutRef.current?.(false);
            }
          }
        });

        // ── Step 8: Join the meeting ───────────────────────────────────────
        const safeEmail = (user?.email?.includes('@')) ? user.email : 'student@lms.com';
        try {
          await client.join({
            signature,
            sdkKey,
            meetingNumber: String(meetingNumber),
            password: password || '',
            userName: user?.name || 'Guest User',
            userEmail: safeEmail,
            ...(zak && { zak }),
          });
        } catch (joinErr) {
          console.error('[Zoom] client.join() failed:', joinErr?.message || joinErr);
          if (!isMounted) return;
          throw new Error(
            joinErr?.message?.includes('Meeting is not started')
              ? 'The host has not started this meeting yet. Please wait and try again.'
              : 'Zoom embedded classroom could not connect. Use the button below to join via the Zoom app.'
          );
        }

        if (!isMounted) return;
        hasJoinedRef.current = true;
        setStatus('live');

        // Lock gallery sizing once the meeting is live (professional equal-tile view)
        requestAnimationFrame(() => {
          syncShareLayoutRef.current?.(false);
          try {
            if (typeof client.setViewType === 'function') {
              client.setViewType('gallery');
            }
          } catch (_) {}
        });

        // ── Step 9: Record attendance ──────────────────────────────────────
        try {
          await zoomService.joinAttendance(meetingId);
          attendanceRecorded.current = true;
        } catch (e) {
          console.warn('Join attendance error:', e);
        }

      } catch (err) {
        if (!isMounted) return;
        console.error('[Zoom] init error:', err);
        const msg =
          err?.response?.data?.message ||
          err?.reason ||
          err?.errorMessage ||
          err?.message ||
          'Failed to start the classroom. Please try again.';
        await handleJoinFailure(msg);
      } finally {
        if (isMounted) initInProgress.current = false;
      }
    };

    init();

    return () => {
      isMounted = false;
      // Async teardown on unmount — don't await here (React cleanup is sync)
      destroyZoomClient(clientRef, containerRef);
      initInProgress.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingId, user?.id, loading]);

  // ── Send leave beacon on page unload / tab close ───────────────────────────
  useEffect(() => {
    const onUnload = () => {
      stopMediaTracks();
      if (!attendanceRecorded.current) return;
      const token = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
      fetch(`${API_URL}/zoom/${meetingId}/attendance/leave`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        keepalive: true,
        credentials: 'include',
      }).catch(() => {});
    };
    window.addEventListener('beforeunload', onUnload);
    window.addEventListener('pagehide', onUnload);
    return () => {
      window.removeEventListener('beforeunload', onUnload);
      window.removeEventListener('pagehide', onUnload);
      stopMediaTracks();
    };
  }, [meetingId]);

  // ── Loading auth state ─────────────────────────────────────────────────────
  if (loading || !user) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0f172a',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 16, color: '#cbd5e1', fontFamily: "'Inter', sans-serif",
      }}>
        <div style={{
          width: 48, height: 48,
          border: '4px solid #334155', borderTop: '4px solid #3b82f6',
          borderRadius: '50%', animation: 'spin 0.9s linear infinite',
        }} />
        <p style={{ fontSize: 15, margin: 0 }}>Restoring classroom session...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{
      height: '100dvh',
      width: '100%',
      background: '#0f172a',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* ── Top bar ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 12px',
        background: '#1e293b',
        borderBottom: '1px solid #334155',
        flexShrink: 0,
        zIndex: 10,
        gap: 8,
        height: 44,
      }}>
        {/* Left: LIVE badge + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
          {status === 'live' && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: '#dc2626', color: '#fff', fontSize: 10,
              fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
              borderRadius: 5, padding: '2px 7px', flexShrink: 0, whiteSpace: 'nowrap',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', animation: 'pulse 1.5s infinite' }} />
              LIVE
            </span>
          )}
          <span style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {status === 'loading' && 'Preparing…'}
            {status === 'joining' && 'Connecting…'}
            {status === 'live' && 'Virtual Classroom'}
            {status === 'error' && 'Connection Error'}
          </span>
        </div>

        {/* Right: action buttons — always on ONE line */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {status === 'live' && (
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              style={{
                background: isFullscreen ? '#2563eb' : '#334155',
                color: '#f8fafc', border: '1px solid #475569',
                borderRadius: 7, padding: '5px 10px', fontWeight: 600,
                fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap', lineHeight: 1,
              }}
            >
              {isFullscreen ? '↙ Exit' : '⛶ Fullscreen'}
            </button>
          )}
          {isHost && status === 'live' && (
            <button
              onClick={handleEndClassForHost}
              title="Leave Class for All"
              style={{
                background: '#991b1b', color: '#fff', border: '1px solid #dc2626',
                borderRadius: 7, padding: '5px 10px', fontWeight: 600,
                fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap', lineHeight: 1,
              }}
            >
              ⏹ End for All
            </button>
          )}
          <button
            onClick={status === 'error' ? goBack : handleLeave}
            title={status === 'error' ? 'Go Back' : 'Leave Class'}
            style={{
              background: '#dc2626', color: '#fff', border: 'none',
              borderRadius: 7, padding: '5px 10px', fontWeight: 600,
              fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap', lineHeight: 1,
            }}
          >
            ✕ {status === 'error' ? 'Go Back' : 'Leave'}
          </button>
        </div>
      </div>

      {/* Overlay spinner/error so the Zoom mount always keeps full remaining height.
          Previously these were flex siblings and stole ~50% of the height during join,
          so Zoom sized itself too tall for the later full-size container. */}
      {(status === 'loading' || status === 'joining') && (
        <div style={{
          position: 'absolute', inset: 44, zIndex: 30,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 16, color: '#94a3b8',
          background: '#0f172a',
        }}>
          <div style={{
            width: 48, height: 48,
            border: '4px solid #334155', borderTop: '4px solid #3b82f6',
            borderRadius: '50%', animation: 'spin 0.9s linear infinite',
          }} />
          <p style={{ fontSize: 15, color: '#cbd5e1', margin: 0 }}>
            {status === 'loading' ? 'Loading Zoom classroom…' : 'Joining the live session…'}
          </p>
          <p style={{ fontSize: 12, color: '#475569', margin: 0 }}>
            Please allow camera and microphone access when prompted.
          </p>
        </div>
      )}

      {status === 'error' && (
        <div style={{
          position: 'absolute', inset: 44, zIndex: 30,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24,
          background: '#0f172a',
        }}>
          <div style={{ fontSize: 40 }}>⚠️</div>
          <h2 style={{ color: '#f87171', margin: 0, fontSize: 20 }}>Could Not Connect</h2>
          <p style={{ color: '#94a3b8', textAlign: 'center', maxWidth: 480, margin: 0 }}>
            {errorMsg}
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {joinUrl && (
              <a
                href={joinUrl} target="_blank" rel="noopener noreferrer"
                style={{
                  background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8,
                  padding: '10px 24px', fontWeight: 600, cursor: 'pointer', fontSize: 14,
                  textDecoration: 'none', display: 'inline-block',
                }}
              >
                🔗 Join via Zoom App
              </a>
            )}
            <button
              onClick={goBack}
              style={{
                background: '#334155', color: '#e2e8f0', border: 'none', borderRadius: 8,
                padding: '10px 24px', fontWeight: 600, cursor: 'pointer', fontSize: 14,
              }}
            >
              Go Back
            </button>
          </div>
        </div>
      )}

      {/* Zoom SDK mount — always occupies remaining height so init measurements are correct */}
      <div
        className={isShareLayoutActive ? 'lms-zoom-stage lms-zoom-sharing' : 'lms-zoom-stage'}
        style={{ flex: 1, position: 'relative', minHeight: 0, width: '100%', overflow: 'hidden' }}
      >
        {/* Local presenter: hide recursive share preview — show a clean "presenting" stage.
            Remote attendees still receive the real screen stream; this only changes YOUR view
            so entire-screen capture no longer nests the meeting UI into itself. */}
        {isSharingMyScreen && (
          <div
            className="lms-presenter-stage"
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              right: `calc(${ZOOM_RIBBON_W}px + 18px)`,
              bottom: ZOOM_FOOTER_PX + 8,
              zIndex: 36,
              borderRadius: 12,
              background:
                'radial-gradient(ellipse at 30% 20%, #1e3a5f 0%, #0f172a 55%, #020617 100%)',
              border: '1px solid rgba(148, 163, 184, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 14,
              boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
              pointerEvents: 'auto',
              padding: 24,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid rgba(34, 197, 94, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="2" y="3" width="20" height="14" rx="2" stroke="#4ade80" strokeWidth="1.8" />
                <path d="M8 21h8M12 17v4" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <div style={{ color: '#f8fafc', fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em' }}>
              You are presenting
            </div>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: 0, maxWidth: 360, lineHeight: 1.45 }}>
              Your screen is visible to the class. Participants appear on the right.
              Prefer sharing a <strong style={{ color: '#e2e8f0' }}>Window</strong> or{' '}
              <strong style={{ color: '#e2e8f0' }}>Chrome Tab</strong> for the cleanest view.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  color: '#4ade80',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: '#22c55e',
                    animation: 'pulse 1.5s infinite',
                  }}
                />
                Sharing live
              </span>
              <button
                onClick={stopMyScreenShare}
                style={{
                  background: '#dc2626',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 20,
                  padding: '8px 16px',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Stop sharing
              </button>
            </div>
          </div>
        )}

        {/* Compact status pill when presenting (mobile / narrow ribbon overlap fallback) */}
        {isSharingMyScreen && (
          <div
            style={{
              position: 'absolute',
              top: 10,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 40,
              background: 'rgba(15, 23, 42, 0.92)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(59, 130, 246, 0.5)',
              borderRadius: 30,
              padding: '5px 16px',
              display: 'none',
              alignItems: 'center',
              gap: 10,
              boxShadow: '0 4px 18px rgba(0, 0, 0, 0.5)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
              pointerEvents: 'auto',
            }}
            className="lms-presenter-pill-mobile"
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#4ade80' }}>
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: '#22c55e',
                  animation: 'pulse 1.5s infinite',
                }}
              />
              Sharing Your Screen
            </span>
            <button
              onClick={stopMyScreenShare}
              style={{
                background: '#dc2626',
                color: '#fff',
                border: 'none',
                borderRadius: 14,
                padding: '3px 10px',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Stop
            </button>
          </div>
        )}

        {/* Viewer tip when someone else is presenting */}
        {!isSharingMyScreen && activeSharerName && (
          <div
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              zIndex: 40,
              background: 'rgba(15, 23, 42, 0.88)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(59, 130, 246, 0.35)',
              borderRadius: 10,
              padding: '7px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
              color: '#e2e8f0',
              fontSize: 12,
              fontWeight: 500,
              maxWidth: 'min(420px, 70%)',
            }}
          >
            <span style={{ color: '#60a5fa', fontWeight: 700 }}>●</span>
            <span>
              <strong style={{ color: '#f8fafc' }}>{activeSharerName}</strong> is presenting
            </span>
          </div>
        )}

        <div
          ref={containerRef}
          id="meetingSDKElement"
          className={isSharingMyScreen ? 'lms-local-presenting' : undefined}
          style={{
            width: '100%',
            minHeight: '100%',
            height: '100%',
            background: '#000',
            display: status === 'error' ? 'none' : 'block',
          }}
        />
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        #meetingSDKElement {
          width: 100% !important;
          height: 100% !important;
          min-height: 100% !important;
          box-sizing: border-box !important;
          overflow: hidden !important;
        }

        /* Do NOT force height:100% on Zoom's root — that clips the footer toolbar. */
        #meetingSDKElement #zmmtg-root,
        #meetingSDKElement .meeting-app {
          width: 100% !important;
          height: auto !important;
          min-height: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          background: #0b1220 !important;
        }

        #meetingSDKElement > div {
          width: 100% !important;
          margin: 0 !important;
        }

        /* Gallery / speaker canvas — fill the stage cleanly */
        #meetingSDKElement .suspension-window,
        #meetingSDKElement .speaker-bar-container,
        #meetingSDKElement .gallery-video-container {
          border-radius: 12px !important;
          overflow: hidden !important;
        }

        /* Professional share layout: main stage + participant ribbon (do NOT force 100% width) */
        .lms-zoom-sharing #meetingSDKElement .sharee-container,
        .lms-zoom-sharing #meetingSDKElement .share-container,
        .lms-zoom-sharing #meetingSDKElement [class*="share-content"],
        .lms-zoom-sharing #meetingSDKElement [class*="ShareCanvas"],
        .lms-zoom-sharing #meetingSDKElement [class*="share-canvas"] {
          border-radius: 12px !important;
          overflow: hidden !important;
          max-width: calc(100% - ${ZOOM_RIBBON_W}px - 16px) !important;
        }

        .lms-zoom-sharing #meetingSDKElement .share-container canvas,
        .lms-zoom-sharing #meetingSDKElement .sharee-container canvas {
          object-fit: contain !important;
          background: #0b1220 !important;
        }

        /* Local presenter: blank the recursive share preview under our overlay */
        #meetingSDKElement.lms-local-presenting .share-container canvas,
        #meetingSDKElement.lms-local-presenting .sharee-container canvas,
        #meetingSDKElement.lms-local-presenting .share-container video,
        #meetingSDKElement.lms-local-presenting .sharee-container video,
        #meetingSDKElement.lms-local-presenting [class*="share-content"] canvas,
        #meetingSDKElement.lms-local-presenting [class*="share-content"] video {
          opacity: 0 !important;
          visibility: hidden !important;
        }

        #meetingSDKElement video,
        #meetingSDKElement canvas {
          max-width: none !important;
          max-height: none !important;
        }

        #meetingSDKElement video {
          object-fit: contain !important;
        }

        /* Participant tiles — rounded, consistent gaps */
        #meetingSDKElement .speaker-active-container,
        #meetingSDKElement .gallery-video-container > div,
        #meetingSDKElement [class*="video-avatar"],
        #meetingSDKElement [class*="participant-video"] {
          border-radius: 12px !important;
        }

        @media (max-width: 900px) {
          .lms-presenter-stage {
            right: 8px !important;
            bottom: ${ZOOM_FOOTER_PX + 56}px !important;
          }
          .lms-presenter-pill-mobile {
            display: flex !important;
          }
          .lms-presenter-stage {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
