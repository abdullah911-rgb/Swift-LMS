import { getImageUrl } from '../../constants/index';
import React, { useState, useEffect, useCallback } from 'react';
import { paymentService } from '../../services/portalService';
import toast from 'react-hot-toast';

const METHOD_TYPES = [
  { value: 'BANK_TRANSFER', label: '🏦 Bank Transfer', color: '#3b82f6' },
  { value: 'EASYPAISA',    label: '🟢 Easypaisa',    color: '#22c55e' },
  { value: 'JAZZCASH',     label: '🟠 JazzCash',     color: '#f97316' },
];

const STATUS_COLORS = {
  PENDING:  { bg: '#fef9c3', text: '#854d0e', border: '#fde047' },
  APPROVED: { bg: '#dcfce7', text: '#166534', border: '#86efac' },
  REJECTED: { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
};

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : '');

// ─────────────────────────────────────────────────────────────────────────────

export default function AdminPayments() {
  const [tab, setTab] = useState('requests'); // 'requests' | 'methods'
  const [requests, setRequests] = useState([]);
  const [methods, setMethods] = useState([]);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [loading, setLoading] = useState(true);

  // Method form
  const [showMethodForm, setShowMethodForm] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [methodForm, setMethodForm] = useState({ type: 'BANK_TRANSFER', title: '', accountName: '', accountNumber: '', instructions: '' });

  // Reject dialog
  const [rejectDialog, setRejectDialog] = useState({ open: false, id: null, reason: '' });

  // View screenshot
  const [screenshotModal, setScreenshotModal] = useState(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await paymentService.adminGetRequests({ status: statusFilter || undefined });
      setRequests(res.data?.data?.requests || []);
    } catch { toast.error('Failed to load requests.'); }
    finally { setLoading(false); }
  }, [statusFilter]);

  const fetchMethods = useCallback(async () => {
    try {
      const res = await paymentService.adminGetMethods();
      setMethods(res.data?.data?.methods || []);
    } catch { toast.error('Failed to load payment methods.'); }
  }, []);

  useEffect(() => { if (tab === 'requests') fetchRequests(); }, [tab, fetchRequests]);
  useEffect(() => { if (tab === 'methods') fetchMethods(); }, [tab, fetchMethods]);

  const handleApprove = async (id) => {
    if (!window.confirm('Approve this payment and enroll the student?')) return;
    try {
      await paymentService.adminApproveRequest(id);
      toast.success('✅ Approved! Student has been enrolled.');
      fetchRequests();
    } catch (e) { toast.error(e?.response?.data?.message || 'Failed to approve.'); }
  };

  const handleReject = async () => {
    try {
      await paymentService.adminRejectRequest(rejectDialog.id, rejectDialog.reason);
      toast.success('Request rejected.');
      setRejectDialog({ open: false, id: null, reason: '' });
      fetchRequests();
    } catch (e) { toast.error(e?.response?.data?.message || 'Failed to reject.'); }
  };

  const handleMethodSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMethod) {
        await paymentService.adminUpdateMethod(editingMethod.id, methodForm);
        toast.success('Method updated.');
      } else {
        await paymentService.adminCreateMethod(methodForm);
        toast.success('Method created.');
      }
      setShowMethodForm(false);
      setEditingMethod(null);
      setMethodForm({ type: 'BANK_TRANSFER', title: '', accountName: '', accountNumber: '', instructions: '' });
      fetchMethods();
    } catch (e) { toast.error(e?.response?.data?.message || 'Failed to save method.'); }
  };

  const handleDeleteMethod = async (id) => {
    if (!window.confirm('Delete this payment method?')) return;
    try {
      await paymentService.adminDeleteMethod(id);
      toast.success('Deleted.');
      fetchMethods();
    } catch { toast.error('Delete failed.'); }
  };

  const openEditMethod = (m) => {
    setEditingMethod(m);
    setMethodForm({ type: m.type, title: m.title, accountName: m.accountName, accountNumber: m.accountNumber, instructions: m.instructions || '' });
    setShowMethodForm(true);
  };

  const toggleMethodActive = async (m) => {
    try {
      await paymentService.adminUpdateMethod(m.id, { ...m, isActive: !m.isActive });
      toast.success(`Method ${!m.isActive ? 'activated' : 'deactivated'}.`);
      fetchMethods();
    } catch { toast.error('Failed to update.'); }
  };

  const pending = requests.filter(r => r.status === 'PENDING').length;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: 0 }}>💰 Payment Management</h1>
        <p style={{ color: '#64748b', fontSize: 14, margin: '4px 0 0' }}>
          Review payment proofs, manage payment accounts, and approve student enrollments.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '2px solid #f1f5f9' }}>
        {[
          { key: 'requests', label: `Payment Requests ${pending > 0 ? `(${pending} pending)` : ''}` },
          { key: 'methods',  label: 'Payment Accounts' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: 14, color: tab === t.key ? '#6366f1' : '#64748b',
            borderBottom: tab === t.key ? '2px solid #6366f1' : '2px solid transparent',
            marginBottom: -2, transition: 'all 0.2s',
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── REQUESTS TAB ────────────────────────────────────────────────── */}
      {tab === 'requests' && (
        <>
          {/* Status filter */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {['', 'PENDING', 'APPROVED', 'REJECTED'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} style={{
                padding: '6px 16px', borderRadius: 20, border: '1.5px solid',
                borderColor: statusFilter === s ? '#6366f1' : '#e2e8f0',
                background: statusFilter === s ? '#6366f1' : '#fff',
                color: statusFilter === s ? '#fff' : '#475569',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>
                {s || 'All'}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>Loading…</div>
          ) : requests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, background: '#fafafa', borderRadius: 16, border: '1px dashed #e2e8f0' }}>
              <div style={{ fontSize: 40 }}>📭</div>
              <p style={{ color: '#64748b', margin: '8px 0 0' }}>No {statusFilter?.toLowerCase() || ''} payment requests found.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {requests.map(r => {
                const colors = STATUS_COLORS[r.status] || STATUS_COLORS.PENDING;
                const initials = r.student?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?';
                return (
                  <div key={r.id} style={{
                    background: '#fff', borderRadius: 16, border: '1px solid #f1f5f9',
                    padding: '20px 24px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                      {/* Student avatar */}
                      <div style={{
                        width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                        background: 'linear-gradient(135deg,#6366f1,#818cf8)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontWeight: 700, fontSize: 16,
                      }}>{initials}</div>

                      {/* Info */}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: '#1e293b', fontSize: 15 }}>{r.student?.name}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>{r.student?.email}</div>
                      </div>

                      {/* Course */}
                      <div style={{ flex: 2, minWidth: 180 }}>
                        <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 14 }}>{r.course?.title}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>PKR {Number(r.amount).toLocaleString()}</div>
                      </div>

                      {/* Status badge */}
                      <span style={{
                        padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                        background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`,
                      }}>{r.status}</span>

                      {/* Date */}
                      <div style={{ fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                        {new Date(r.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>

                    {/* Transaction ref & actions */}
                    <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      {r.transactionRef && (
                        <span style={{ fontSize: 12, color: '#64748b', background: '#f8fafc', padding: '3px 10px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                          TxRef: <strong>{r.transactionRef}</strong>
                        </span>
                      )}

                      {/* View screenshot */}
                      <button onClick={() => setScreenshotModal(`${API_BASE}${r.screenshotUrl}`)} style={{
                        padding: '6px 14px', borderRadius: 8, border: '1.5px solid #6366f1',
                        background: '#f0f4ff', color: '#6366f1', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      }}>📷 View Screenshot</button>

                      {r.status === 'PENDING' && (
                        <>
                          <button onClick={() => handleApprove(r.id)} style={{
                            padding: '6px 16px', borderRadius: 8, border: 'none',
                            background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: '#fff',
                            fontSize: 12, fontWeight: 700, cursor: 'pointer',
                          }}>✅ Approve</button>
                          <button onClick={() => setRejectDialog({ open: true, id: r.id, reason: '' })} style={{
                            padding: '6px 16px', borderRadius: 8, border: 'none',
                            background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff',
                            fontSize: 12, fontWeight: 700, cursor: 'pointer',
                          }}>❌ Reject</button>
                        </>
                      )}

                      {r.rejectedNote && (
                        <span style={{ fontSize: 12, color: '#dc2626', fontStyle: 'italic' }}>
                          Reason: {r.rejectedNote}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── METHODS TAB ─────────────────────────────────────────────────── */}
      {tab === 'methods' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
            <button onClick={() => { setEditingMethod(null); setMethodForm({ type: 'BANK_TRANSFER', title: '', accountName: '', accountNumber: '', instructions: '' }); setShowMethodForm(true); }} style={{
              padding: '10px 22px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg,#6366f1,#818cf8)', color: '#fff',
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}>+ Add Payment Account</button>
          </div>

          {methods.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, background: '#fafafa', borderRadius: 16, border: '1px dashed #e2e8f0' }}>
              <div style={{ fontSize: 36 }}>🏦</div>
              <p style={{ color: '#64748b' }}>No payment accounts configured yet.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {methods.map(m => {
                const typeInfo = METHOD_TYPES.find(t => t.value === m.type);
                return (
                  <div key={m.id} style={{
                    background: '#fff', borderRadius: 16, border: '1px solid #f1f5f9',
                    padding: 20, boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
                    opacity: m.isActive ? 1 : 0.6,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span style={{
                        fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                        background: typeInfo?.color + '20', color: typeInfo?.color, border: `1px solid ${typeInfo?.color}50`,
                      }}>{typeInfo?.label || m.type}</span>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                        background: m.isActive ? '#dcfce7' : '#f1f5f9', color: m.isActive ? '#166534' : '#64748b',
                      }}>{m.isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a', marginBottom: 4 }}>{m.title}</div>
                    <div style={{ fontSize: 13, color: '#475569' }}>{m.accountName}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#6366f1', marginTop: 4, fontFamily: 'monospace' }}>{m.accountNumber}</div>
                    {m.instructions && <div style={{ fontSize: 12, color: '#64748b', marginTop: 8, fontStyle: 'italic' }}>{m.instructions}</div>}

                    <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                      <button onClick={() => openEditMethod(m)} style={{ flex: 1, padding: '7px', borderRadius: 8, border: '1.5px solid #6366f1', background: '#f0f4ff', color: '#6366f1', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Edit</button>
                      <button onClick={() => toggleMethodActive(m)} style={{ flex: 1, padding: '7px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{m.isActive ? 'Deactivate' : 'Activate'}</button>
                      <button onClick={() => handleDeleteMethod(m.id)} style={{ padding: '7px 12px', borderRadius: 8, border: 'none', background: '#fee2e2', color: '#dc2626', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>🗑</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Screenshot modal */}
      {screenshotModal && (
        <div onClick={() => setScreenshotModal(null)} style={{
          position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div onClick={e => e.stopPropagation()} style={{ position: 'relative', maxWidth: 700, maxHeight: '90vh' }}>
            <img src={screenshotModal} alt="Payment proof" style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: 12, objectFit: 'contain' }} />
            <button onClick={() => setScreenshotModal(null)} style={{
              position: 'absolute', top: -12, right: -12, width: 32, height: 32, borderRadius: '50%',
              background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 16,
            }}>✕</button>
          </div>
        </div>
      )}

      {/* Reject dialog */}
      {rejectDialog.open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, maxWidth: 440, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700, color: '#0f172a' }}>❌ Reject Payment</h3>
            <p style={{ margin: '0 0 14px', fontSize: 13, color: '#64748b' }}>Provide a reason (optional). The student will see this message.</p>
            <textarea
              value={rejectDialog.reason}
              onChange={e => setRejectDialog(d => ({ ...d, reason: e.target.value }))}
              placeholder="e.g. Screenshot is unclear, wrong account number, amount mismatch…"
              rows={4}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button onClick={() => setRejectDialog({ open: false, id: null, reason: '' })} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#64748b', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleReject} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: '#ef4444', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Reject</button>
            </div>
          </div>
        </div>
      )}

      {/* Method form modal */}
      {showMethodForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, maxWidth: 480, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
              {editingMethod ? 'Edit Payment Account' : 'Add Payment Account'}
            </h3>
            <form onSubmit={handleMethodSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Account Type</label>
                <select value={methodForm.type} onChange={e => setMethodForm(f => ({ ...f, type: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, background: '#fff' }}>
                  {METHOD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              {[
                { key: 'title', label: 'Display Title', placeholder: 'e.g. Meezan Bank Account' },
                { key: 'accountName', label: 'Account / Owner Name', placeholder: 'e.g. Muhammad Abdullah' },
                { key: 'accountNumber', label: 'Account / Phone Number', placeholder: 'e.g. 03001234567 or IBAN' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>{f.label}</label>
                  <input
                    value={methodForm[f.key]}
                    onChange={e => setMethodForm(fm => ({ ...fm, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    required
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, boxSizing: 'border-box' }}
                  />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Instructions (optional)</label>
                <textarea value={methodForm.instructions} onChange={e => setMethodForm(f => ({ ...f, instructions: e.target.value }))} rows={2} placeholder="e.g. Send payment to this number and upload the screenshot" style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setShowMethodForm(false)} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#64748b', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ flex: 2, padding: '11px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#6366f1,#818cf8)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                  {editingMethod ? 'Save Changes' : 'Add Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
