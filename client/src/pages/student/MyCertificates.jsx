import { getImageUrl } from '../../constants/index';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { certificateService } from '../../services/portalService';
import toast from 'react-hot-toast';

const LEVEL_COLORS = { BEGINNER: '#22c55e', INTERMEDIATE: '#3b82f6', ADVANCED: '#f59e0b' };
const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : '');

export default function MyCertificates() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [printCert, setPrintCert] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await certificateService.getMyCertificates();
        setCertificates(res.data?.data?.certificates || []);
      } catch { toast.error('Failed to load certificates.'); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8', fontFamily: "'Inter',sans-serif" }}>Loading your certificates…</div>;

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0 }}>🎓 My Certificates</h1>
        <p style={{ color: '#64748b', fontSize: 14, margin: '4px 0 0' }}>Your earned course completion certificates.</p>
      </div>

      {/* Certificates grid */}
      {certificates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: '#fafafa', borderRadius: 20, border: '1px dashed #e2e8f0', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎓</div>
          <h3 style={{ color: '#1e293b', margin: '0 0 8px' }}>No certificates yet</h3>
          <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 20px' }}>Complete at least 80% of an eligible course to earn your certificate.</p>
          <Link to="/student/my-courses" style={{ display: 'inline-block', padding: '10px 24px', background: 'linear-gradient(135deg,#6366f1,#818cf8)', color: '#fff', borderRadius: 10, fontWeight: 600, textDecoration: 'none' }}>
            Continue Learning
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20, marginBottom: 40 }}>
          {certificates.map(cert => (
            <div key={cert.id} style={{
              background: 'linear-gradient(135deg, #fefce8 0%, #fffbeb 40%, #fef9c3 100%)',
              borderRadius: 20, border: '2px solid #fde68a',
              padding: 24, boxShadow: '0 4px 20px rgba(245,158,11,0.12)',
              position: 'relative', overflow: 'hidden',
            }}>
              {/* decorative corner */}
              <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(245,158,11,0.08)' }} />
              <div style={{ position: 'absolute', top: -10, right: -10, width: 60, height: 60, borderRadius: '50%', background: 'rgba(245,158,11,0.12)' }} />

              <div style={{ fontSize: 36, marginBottom: 12 }}>🏅</div>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#92400e', marginBottom: 4, lineHeight: 1.3 }}>{cert.course?.title}</div>
              <div style={{ fontSize: 12, color: '#b45309', marginBottom: 12 }}>
                Instructor: {cert.course?.instructor?.name || 'N/A'}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20,
                  background: LEVEL_COLORS[cert.course?.level] + '20',
                  color: LEVEL_COLORS[cert.course?.level],
                  border: `1px solid ${LEVEL_COLORS[cert.course?.level]}50`,
                }}>{cert.course?.level}</span>
                <span style={{ fontSize: 11, color: '#78350f' }}>
                  Issued: {new Date(cert.issuedAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setPrintCert(cert)} style={{
                  width: '100%', padding: '9px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#fff', fontWeight: 700, fontSize: 13,
                }}>
                  🖨️ View & Print Certificate
                </button>
              </div>
            </div>
          ))}
        </div>
      )}



      {/* Print certificate modal */}
      {printCert && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setPrintCert(null)}>
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: 700, width: '100%' }}>
            <CertificatePrint cert={printCert} />
            <div style={{ display: 'flex', gap: 10, marginTop: 12, justifyContent: 'center' }}>
              <button onClick={() => window.print()} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: '#6366f1', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>🖨️ Print</button>
              <button onClick={() => setPrintCert(null)} style={{ padding: '10px 24px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 600, cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CertificatePrint({ cert }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg,#fffbeb,#fef3c7,#fffbeb)',
      border: '4px solid #f59e0b',
      borderRadius: 20, padding: '48px 56px',
      fontFamily: "'Georgia', serif",
      textAlign: 'center', position: 'relative', overflow: 'hidden',
    }}>
      {/* decorative borders */}
      <div style={{ position: 'absolute', inset: 8, border: '2px solid #fde68a', borderRadius: 16, pointerEvents: 'none' }} />

      <div style={{ fontSize: 48, marginBottom: 8 }}>🏅</div>
      <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.15em', color: '#92400e', textTransform: 'uppercase', marginBottom: 4 }}>Certificate of Completion</div>
      <div style={{ width: 80, height: 2, background: '#f59e0b', margin: '0 auto 20px' }} />

      <div style={{ fontSize: 14, color: '#78350f', marginBottom: 8 }}>This is to certify that</div>
      <div style={{ fontSize: 30, fontWeight: 800, color: '#1e293b', marginBottom: 8, fontStyle: 'italic' }}>{cert.student?.name || 'Student Name'}</div>
      <div style={{ width: 120, height: 1, background: '#d97706', margin: '0 auto 16px' }} />

      <div style={{ fontSize: 14, color: '#78350f', marginBottom: 6 }}>has successfully completed the course</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#92400e', marginBottom: 4 }}>"{cert.course?.title}"</div>
      {cert.course?.instructor?.name && (
        <div style={{ fontSize: 13, color: '#b45309', marginBottom: 20 }}>taught by <strong>{cert.course.instructor.name}</strong></div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 28, paddingTop: 20, borderTop: '1px solid #fde68a' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#92400e', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Issue Date</div>
          <div style={{ fontSize: 13, color: '#1e293b', marginTop: 2 }}>{new Date(cert.issuedAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </div>
      </div>
    </div>
  );
}
