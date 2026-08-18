import React, { useState, useEffect } from 'react';
import { paymentService } from '../../services/portalService';
import toast from 'react-hot-toast';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function StatCard({ icon, label, value, sub, color = '#6366f1' }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: '22px 24px',
      border: '1px solid #f1f5f9', boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
      display: 'flex', alignItems: 'center', gap: 16,
    }}>
      <div style={{ width: 52, height: 52, borderRadius: 14, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>{value}</div>
        {sub && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function AdminRevenue() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await paymentService.adminGetRevenue();
        setData(res.data?.data);
      } catch { toast.error('Failed to load revenue data.'); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: 80, color: '#94a3b8', fontSize: 15 }}>Loading revenue data…</div>;
  if (!data) return null;

  const maxRevenue = Math.max(...(data.monthlyRevenue?.map(m => m.revenue) || [0]), 1);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: 0 }}>📊 Revenue Management</h1>
        <p style={{ color: '#64748b', fontSize: 14, margin: '4px 0 0' }}>Track platform revenue from approved student payments.</p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
        <StatCard icon="💵" label="Total Revenue" value={`PKR ${Number(data.totalRevenue || 0).toLocaleString()}`} sub="From approved payments" color="#22c55e" />
        <StatCard icon="✅" label="Approved Payments" value={data.totalApproved || 0} sub="Total successful enrollments" color="#3b82f6" />
        <StatCard icon="⏳" label="Pending Reviews" value={data.pendingCount || 0} sub="Awaiting admin approval" color="#f59e0b" />
        <StatCard icon="📚" label="Paying Courses" value={data.topCourses?.length || 0} sub="Courses generating revenue" color="#8b5cf6" />
      </div>

      {/* Monthly chart */}
      {data.monthlyRevenue?.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', padding: '24px 28px', marginBottom: 28, boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
          <h2 style={{ margin: '0 0 24px', fontSize: 17, fontWeight: 700, color: '#0f172a' }}>📈 Monthly Revenue (Last 6 Months)</h2>
          <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 220, minWidth: 500, paddingTop: 10 }}>
              {data.monthlyRevenue.map((m, i) => {
                const pct = maxRevenue > 0 ? (m.revenue / maxRevenue) * 100 : 0;
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 70 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', whiteSpace: 'nowrap' }}>PKR {Number(m.revenue || 0).toLocaleString()}</div>
                    <div style={{ width: '100%', height: '160px', display: 'flex', alignItems: 'flex-end' }}>
                      <div style={{
                        width: '100%', height: `${pct}%`, minHeight: 6,
                        background: 'linear-gradient(180deg, #818cf8, #6366f1)',
                        borderRadius: '6px 6px 0 0', transition: 'height 0.6s ease',
                      }} />
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, whiteSpace: 'nowrap' }}>{m.month}</div>
                    <div style={{ fontSize: 10, color: '#cbd5e1', whiteSpace: 'nowrap' }}>{m.count} payment{m.count !== 1 ? 's' : ''}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Top courses table */}
      {data.topCourses?.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', padding: '24px 28px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 17, fontWeight: 700, color: '#0f172a' }}>🏆 Top Revenue-Generating Courses</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                  {['#', 'Course', 'Enrollments', 'Revenue (PKR)'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.topCourses.map((c, i) => (
                  <tr key={c.course_id} style={{ borderBottom: '1px solid #f8fafc', transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = '#fafafa'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: i < 3 ? ['#f59e0b','#94a3b8','#cd7c2f'][i] : '#cbd5e1', fontSize: 15 }}>
                      {i < 3 ? ['🥇','🥈','🥉'][i] : i + 1}
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: '#1e293b' }}>{c.title}</td>
                    <td style={{ padding: '12px 14px', color: '#475569' }}>{c.enrollments}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#22c55e' }}>
                      {Number(c.revenue || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data.topCourses?.length === 0 && data.totalRevenue === 0 && (
        <div style={{ textAlign: 'center', padding: 60, background: '#fafafa', borderRadius: 20, border: '1px dashed #e2e8f0' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>📊</div>
          <p style={{ color: '#64748b' }}>No revenue data yet. Revenue will appear here once payments are approved.</p>
        </div>
      )}
    </div>
  );
}
