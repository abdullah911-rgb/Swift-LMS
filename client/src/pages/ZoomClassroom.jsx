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
}

// ── Stop all camera/mic hardware tracks ───────────────────────────────────────
function stopMediaTracks() {
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
    try { await client.leave(); } catch (_) {}
    // Brief wait so SDK WebSocket closes cleanly
    await new Promise((r) => setTimeout(r, 400));
    try {
      if (typeof client.destroy === 'function') client.destroy();
    } catch (_) {}
    // Extra wait after destroy so SDK singleton internal state resets
    await new Promise((r) => setTimeout(r, 300));
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

  const isHost = user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN';

  // ── Go back to course/dashboard ────────────────────────────────────────────
  const goBack = useCallback(() => {
    stopMediaTracks();
    if (user?.role) {
      navigate(getBackPath(user.role, courseId));
    } else {
      navigate(-1);
    }
  }, [user?.role, courseId, navigate]);

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
            if (el && el.offsetWidth > 0) return resolve();
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

        // ── Step 6: Init SDK in the container ─────────────────────────────
        try {
          await client.init({
            zoomAppRoot: containerEl,
            language: 'en-US',
          });
        } catch (initErr) {
          console.error('[Zoom] client.init() failed:', initErr?.message || initErr);
          if (!isMounted) return;
          throw new Error('Zoom SDK could not initialize. Please refresh and try again.');
        }

        if (!isMounted) return;

        // ── Step 7: Register connection event listener ─────────────────────
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
      minHeight: '100vh', background: '#0f172a',
      display: 'flex', flexDirection: 'column',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
    }}>
      {/* ── Top bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 24px', background: '#1e293b',
        borderBottom: '1px solid #334155', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {status === 'live' && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#dc2626', color: '#fff', fontSize: 11,
              fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
              borderRadius: 6, padding: '3px 10px',
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: '#fff', animation: 'pulse 1.5s infinite',
              }} />
              LIVE
            </span>
          )}
          <span style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 15 }}>
            {status === 'loading' && 'Preparing Classroom…'}
            {status === 'joining' && 'Connecting to Live Class…'}
            {status === 'live' && 'Virtual Classroom'}
            {status === 'error' && 'Connection Error'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isHost && status === 'live' && (
            <button
              onClick={handleEndClassForHost}
              style={{
                background: '#991b1b', color: '#fff', border: '1px solid #dc2626',
                borderRadius: 8, padding: '8px 16px', fontWeight: 600,
                fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              ⏹ End Class (For All)
            </button>
          )}
          <button
            onClick={status === 'error' ? goBack : handleLeave}
            style={{
              background: '#dc2626', color: '#fff', border: 'none',
              borderRadius: 8, padding: '8px 18px', fontWeight: 600,
              fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            ✕ {status === 'error' ? 'Go Back' : 'Leave Class'}
          </button>
        </div>
      </div>

      {/* ── Spinner: loading / joining ── */}
      {(status === 'loading' || status === 'joining') && (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 16, color: '#94a3b8',
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

      {/* ── Error state ── */}
      {status === 'error' && (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24,
        }}>
          <div style={{ fontSize: 40 }}>⚠️</div>
          <h2 style={{ color: '#f87171', margin: 0, fontSize: 20 }}>Could Not Connect</h2>
          <p style={{ color: '#94a3b8', textAlign: 'center', maxWidth: 480, margin: 0 }}>
            {errorMsg}
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {joinUrl && (
              <a
                href={joinUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: '#2563eb', color: '#fff',
                  border: 'none', borderRadius: 8, padding: '10px 24px',
                  fontWeight: 600, cursor: 'pointer', fontSize: 14,
                  textDecoration: 'none', display: 'inline-block',
                }}
              >
                🔗 Join via Zoom App
              </a>
            )}
            <button
              onClick={goBack}
              style={{
                background: '#334155', color: '#e2e8f0',
                border: 'none', borderRadius: 8, padding: '10px 24px',
                fontWeight: 600, cursor: 'pointer', fontSize: 14,
              }}
            >
              Go Back
            </button>
          </div>
        </div>
      )}

      {/* ── Zoom SDK mount point ── */}
      <div
        ref={containerRef}
        id="meetingSDKElement"
        style={{
          flex: 1,
          display: status === 'error' ? 'none' : 'block',
          width: '100%',
          minHeight: 0,
        }}
      />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
