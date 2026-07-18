import { getImageUrl } from '../../constants/index';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { paymentService } from '../../services/portalService';
import toast from 'react-hot-toast';

const STATUS_STYLES = {
  PENDING:  { bg: '#fef9c3', text: '#854d0e', icon: '⏳', label: 'Pending Review' },
  APPROVED: { bg: '#dcfce7', text: '#166534', icon: '✅', label: 'Approved' },
  REJECTED: { bg: '#fee2e2', text: '#991b1b', icon: '❌', label: 'Rejected' },
};

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : '');

export default function StudentPayments() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await paymentService.getMyRequests();
        setRequests(res.data?.data?.requests || []);
      } catch { toast.error('Failed to load payment requests.'); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8', fontFamily: "'Inter',sans-serif" }}>Loading…</div>;

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0 }}>💳 My Payment Requests</h1>
        <p style={{ color: '#64748b', fontSize: 14, margin: '4px 0 0' }}>Track your submitted payment proofs and enrollment status.</p>
      </div>

      {requests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: '#fafafa', borderRadius: 20, border: '1px dashed #e2e8f0' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
          <h3 style={{ color: '#1e293b', margin: '0 0 6px' }}>No payments yet</h3>
          <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 20px' }}>Browse paid courses and submit your payment proof to get enrolled.</p>
          <Link to="/courses" style={{ display: 'inline-block', padding: '10px 22px', background: 'linear-gradient(135deg,#6366f1,#818cf8)', color: '#fff', borderRadius: 10, fontWeight: 600, textDecoration: 'none' }}>
            Browse Courses
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {requests.map(r => {
            const s = STATUS_STYLES[r.status] || STATUS_STYLES.PENDING;
            return (
              <div key={r.id} style={{ background: '#fff', borderRadius: 16, border: '1px solid #f1f5f9', padding: '20px 24px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                  {/* Course thumbnail */}
                  {r.course?.thumbnail ? (
                    <img src={r.course.thumbnail.startsWith('/') ? `${API_BASE}${r.course.thumbnail}` : r.course.thumbnail} alt={r.course?.title} style={{ width: 64, height: 48, objectFit: 'cover', borderRadius: 10, flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 64, height: 48, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#818cf8)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 18 }}>📚</div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: '#1e293b', fontSize: 15 }}>{r.course?.title}</div>
                    <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
                      PKR {Number(r.amount).toLocaleString()} · Submitted {new Date(r.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>

                  <span style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: s.bg, color: s.text }}>
                    {s.icon} {s.label}
                  </span>
                </div>

                {r.status === 'REJECTED' && (
                  <div style={{ marginTop: 12, padding: '10px 14px', background: '#fef2f2', borderRadius: 10, fontSize: 13, color: '#dc2626' }}>
                    <strong>Rejection reason:</strong> {r.rejectedNote || 'No reason provided.'}
                  </div>
                )}
                {r.status === 'REJECTED' && r.course?.id && (
                  <div style={{ marginTop: 10 }}>
                    <Link to={`/student/pay/${r.course.id}`} style={{ display: 'inline-block', padding: '8px 18px', background: 'linear-gradient(135deg,#6366f1,#818cf8)', color: '#fff', borderRadius: 10, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                      🔄 Resubmit Payment
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
