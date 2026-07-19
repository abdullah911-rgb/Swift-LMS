import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import ZoomMtgEmbeddedImport from '@zoom/meetingsdk/embedded';
import { useAuth } from '../contexts/AuthContext';
import { zoomService } from '../services/portalService';
import { API_URL } from '../constants';
import { getRoleHomePath } from '../utils/authRedirect';

// ── Resolve the embedded SDK (handles both CJS and ESM module shapes) ─────────
function getZoomEmbedded() {
  const mod = ZoomMtgEmbeddedImport;
  if (typeof mod?.createClient === 'function') return mod;
  if (typeof mod?.default?.createClient === 'function') return mod.default;
  throw new Error('Zoom SDK could not be initialized. Please refresh and try again.');
}

function getBackPath(role, courseId) {
  if (courseId) {
    if (role === 'STUDENT') return `/student/course/${courseId}`;
    if (role === 'INSTRUCTOR' || role === 'ADMIN') return `/instructor/courses/${courseId}/edit`;
  }
  return getRoleHomePath(role);
}

export default function ZoomClassroom() {
  const { meetingId } = useParams();
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get('courseId');
  const navigate = useNavigate();
  const { user } = useAuth();

  const containerRef = useRef(null);
  const clientRef = useRef(null);
  const attendanceRecorded = useRef(false);
  const hasJoinedRef = useRef(false);
  const isLeavingRef = useRef(false);

  const [status, setStatus] = useState('loading');
  const [errorMsg, setErrorMsg] = useState('');

  const isHost = user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN';

  // ── Helpers ───────────────────────────────────────────────────────────────
  const cleanupClient = useCallback(async () => {
    if (clientRef.current) {
      try { await clientRef.current.leave(); } catch (_) { /* ignore */ }
      clientRef.current = null;
    }
  }, []);

  const goBack = useCallback(() => {
    if (user?.role) {
      navigate(getBackPath(user.role, courseId));
    } else {
      navigate(-1);
    }
  }, [user?.role, courseId, navigate]);

  const handleJoinFailure = useCallback(async (message) => {
    await cleanupClient();
    setStatus('error');
    setErrorMsg(message || 'Failed to join the meeting. Please try again.');
  }, [cleanupClient]);

  const handleLeave = useCallback(async () => {
    if (isLeavingRef.current) return;
    isLeavingRef.current = true;

    if (attendanceRecorded.current) {
      try { await zoomService.leaveAttendance(meetingId); }
      catch (e) { console.warn('Leave attendance error:', e); }
    }

    await cleanupClient();
    goBack();
  }, [meetingId, cleanupClient, goBack]);

  // ── Main init effect ──────────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        setStatus('loading');
        setErrorMsg('');
        hasJoinedRef.current = false;

        // 1. Resolve SDK
        const ZoomMtgEmbedded = getZoomEmbedded();
        if (!isMounted) return;

        // 2. Wait for container to have real dimensions (Zoom SDK needs this)
        await new Promise((resolve) => {
          let tries = 0;
          const check = () => {
            const el = containerRef.current;
            if (el && el.offsetWidth > 0) return resolve();
            if (++tries > 40) return resolve(); // give up after 2s
            setTimeout(check, 50);
          };
          check();
        });
        if (!isMounted) return;

        setStatus('joining');

        // 3. Fetch signature from backend
        //    role: 1 = host (instructor/admin), 0 = attendee (student)
        const sdkRole = isHost ? 1 : 0;
        const { data: sigResp } = await zoomService.getSignature(meetingId, sdkRole);
        const payload = sigResp?.data;

        if (!payload?.signature || !payload?.sdkKey || !payload?.meetingNumber) {
          throw new Error(
            payload
              ? 'Incomplete signature data returned by server.'
              : 'Server did not return signature data.'
          );
        }

        const { signature, sdkKey, meetingNumber, password, zak } = payload;

        if (!isMounted) return;

        // 4. Create client and register connection listener
        const client = ZoomMtgEmbedded.createClient();
        clientRef.current = client;

        client.on('connection-change', (ev) => {
          if (!isMounted) return;
          console.log('[Zoom] connection-change:', ev);
          if (ev?.state === 'Fail') {
            handleJoinFailure(
              ev.reason || ev.errorMessage || 'Connection failed. Signature may be invalid.'
            );
          } else if (ev?.state === 'Closed' && hasJoinedRef.current) {
            handleLeave();
          }
        });

        // 5. Init — wrap in try/catch to handle SDK-internal crashes
        const containerEl = containerRef.current;
        if (!containerEl) throw new Error('Meeting container element not found.');

        try {
          await client.init({
            zoomAppRoot: containerEl,
            language: 'en-US',
            customize: {
              video: {
                isResizable: true,
                viewSizes: {
                  default: { width: Math.max(containerEl.offsetWidth || 0, 800), height: 600 },
                },
              },
            },
          });
        } catch (initErr) {
          // Catch SDK-internal errors (e.g. "Cannot read properties of undefined (reading 'includes')")
          const msg = initErr?.message || String(initErr);
          console.error('[Zoom] client.init() failed:', msg);
          throw new Error(
            msg.includes("Cannot read properties") || msg.includes("undefined")
              ? 'Zoom SDK failed to initialize. Please try refreshing the page.'
              : msg
          );
        }

        if (!isMounted) return;

        // 6. Join — do NOT pass `role` here; it is already encoded in the signature
        await client.join({
          signature,
          sdkKey,
          meetingNumber: String(meetingNumber),
          password: password || '',
          userName: user?.name || 'Guest',
          userEmail: user?.email || '',
          ...(zak && { zak }), // Pass the ZAK token for hosts
        });

        if (!isMounted) return;
        hasJoinedRef.current = true;
        setStatus('live');

        // 7. Record attendance
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
          err?.reason ||
          err?.errorMessage ||
          err?.message ||
          'Failed to start the classroom. Please try again.';
        await handleJoinFailure(msg);
      }
    };

    init();

    return () => {
      isMounted = false;
      cleanupClient();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingId]);

  // ── Send leave beacon on page unload ────────────────────────────────────
  useEffect(() => {
    const onUnload = () => {
      if (!attendanceRecorded.current) return;
      const token = localStorage.getItem('accessToken');
      fetch(`${API_URL}/zoom/${meetingId}/attendance/leave`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        keepalive: true,
        credentials: 'include',
      }).catch(() => {});
    };
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, [meetingId]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0f172a',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 24px',
          background: '#1e293b',
          borderBottom: '1px solid #334155',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {status === 'live' && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: '#dc2626',
                color: '#fff',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                borderRadius: 6,
                padding: '3px 10px',
              }}
            >
              <span
                style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: '#fff', animation: 'pulse 1.5s infinite',
                }}
              />
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

      {/* Loading / Joining spinner */}
      {(status === 'loading' || status === 'joining') && (
        <div
          style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 16, color: '#94a3b8',
          }}
        >
          <div
            style={{
              width: 48, height: 48,
              border: '4px solid #334155', borderTop: '4px solid #3b82f6',
              borderRadius: '50%', animation: 'spin 0.9s linear infinite',
            }}
          />
          <p style={{ fontSize: 15, color: '#cbd5e1', margin: 0 }}>
            {status === 'loading' ? 'Loading Zoom classroom…' : 'Joining the live session…'}
          </p>
          <p style={{ fontSize: 12, color: '#475569', margin: 0 }}>
            Please allow camera and microphone access when prompted.
          </p>
        </div>
      )}

      {/* Error state */}
      {status === 'error' && (
        <div
          style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24,
          }}
        >
          <div style={{ fontSize: 40 }}>⚠️</div>
          <h2 style={{ color: '#f87171', margin: 0, fontSize: 20 }}>Could Not Connect</h2>
          <p style={{ color: '#94a3b8', textAlign: 'center', maxWidth: 480, margin: 0 }}>
            {errorMsg}
          </p>
          <button
            onClick={goBack}
            style={{
              marginTop: 8, background: '#3b82f6', color: '#fff',
              border: 'none', borderRadius: 8, padding: '10px 24px',
              fontWeight: 600, cursor: 'pointer', fontSize: 14,
            }}
          >
            Go Back
          </button>
        </div>
      )}

      {/* Zoom SDK mount point */}
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
