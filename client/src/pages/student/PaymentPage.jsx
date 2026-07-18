import { getImageUrl } from '../../constants/index';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { paymentService } from '../../services/portalService';
import api from '../../services/api';
import toast from 'react-hot-toast';

const METHOD_ICONS = { BANK_TRANSFER: '🏦', EASYPAISA: '🟢', JAZZCASH: '🟠' };
const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : '');

export default function PaymentPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [methods, setMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [screenshot, setScreenshot] = useState(null);
  const [preview, setPreview] = useState(null);
  const [transactionRef, setTransactionRef] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [existing, setExisting] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [courseRes, methodsRes, myReqRes] = await Promise.all([
          api.get(`/courses/${courseId}`),
          paymentService.getMethods(),
          paymentService.getMyRequests().catch(() => ({ data: { data: { requests: [] } } })),
        ]);
        const c = courseRes.data?.data?.course || courseRes.data?.data;
        setCourse(c);
        const methodList = methodsRes.data?.data?.methods || [];
        setMethods(methodList);
        if (methodList.length > 0) setSelectedMethod(methodList[0]);

        const reqs = myReqRes.data?.data?.requests || [];
        const ex = reqs.find(r => r.courseId === courseId || r.course?.id === courseId);
        if (ex) setExisting(ex);
      } catch (e) {
        toast.error('Failed to load payment page.');
        navigate(-1);
      } finally {
        setLoading(false);
      }
    })();
  }, [courseId, navigate]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('File too large. Max 5MB.'); return; }
    setScreenshot(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMethod) return toast.error('Please select a payment method.');
    if (!screenshot) return toast.error('Please upload your payment screenshot.');
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('courseId', courseId);
      fd.append('screenshot', screenshot);
      if (transactionRef) fd.append('transactionRef', transactionRef);
      await paymentService.submitRequest(fd);
      toast.success('✅ Payment submitted! Admin will verify and enroll you shortly.');
      navigate('/student/my-courses');
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to submit payment.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 80, fontFamily: "'Inter',sans-serif", color: '#94a3b8' }}>Loading…</div>;

  // Already submitted state
  if (existing) {
    const isApproved = existing.status === 'APPROVED';
    const isPending = existing.status === 'PENDING';
    const isRejected = existing.status === 'REJECTED';
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter',sans-serif", padding: 24 }}>
        <div style={{ background: '#fff', borderRadius: 24, padding: 40, maxWidth: 480, width: '100%', textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>{isApproved ? '🎉' : isPending ? '⏳' : '❌'}</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
            {isApproved ? 'Payment Approved!' : isPending ? 'Payment Under Review' : 'Payment Rejected'}
          </h2>
          <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 20px' }}>
            {isApproved && 'You are now enrolled in this course. Head to your dashboard to start learning!'}
            {isPending && 'Your payment screenshot has been submitted. The admin will verify it and enroll you within 24 hours.'}
            {isRejected && `Your payment was rejected. ${existing.rejectedNote ? `Reason: ${existing.rejectedNote}` : ''} Please resubmit.`}
          </p>
          {isApproved && <Link to="/student/my-courses" style={{ display: 'inline-block', padding: '12px 28px', background: 'linear-gradient(135deg,#6366f1,#818cf8)', color: '#fff', borderRadius: 12, fontWeight: 700, textDecoration: 'none' }}>Go to My Courses</Link>}
          {isRejected && <button onClick={() => setExisting(null)} style={{ padding: '12px 28px', background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', borderRadius: 12, fontWeight: 700, border: 'none', cursor: 'pointer' }}>Resubmit Payment</button>}
          {isPending && <Link to="/student/dashboard" style={{ display: 'inline-block', padding: '12px 28px', background: '#f1f5f9', color: '#475569', borderRadius: 12, fontWeight: 600, textDecoration: 'none' }}>Go to Dashboard</Link>}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#f0f4ff 0%,#faf5ff 100%)', fontFamily: "'Inter',sans-serif", padding: '40px 16px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>Complete Your Enrollment</h1>
          <p style={{ color: '#64748b', fontSize: 15 }}>Send your payment and upload proof — admin will verify and enroll you.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>

          {/* LEFT — Payment methods & instructions */}
          <div>
            {/* Course summary */}
            <div style={{ background: '#fff', borderRadius: 20, padding: 20, marginBottom: 20, border: '1px solid #f1f5f9', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                {course?.thumbnail && (
                  <img src={course.thumbnail.startsWith('/') ? `${API_BASE}${course.thumbnail}` : course.thumbnail} alt={course.title} style={{ width: 70, height: 52, objectFit: 'cover', borderRadius: 10, flexShrink: 0 }} />
                )}
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{course?.title}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#6366f1', marginTop: 2 }}>PKR {Number(course?.price || 0).toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Select method */}
            <div style={{ background: '#fff', borderRadius: 20, padding: 20, marginBottom: 20, border: '1px solid #f1f5f9', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Step 1: Choose Payment Method</h3>
              {methods.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: 13 }}>No payment methods configured. Contact admin.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {methods.map(m => (
                    <div key={m.id} onClick={() => setSelectedMethod(m)} style={{
                      padding: '14px 16px', borderRadius: 12, cursor: 'pointer', transition: 'all 0.18s',
                      border: `2px solid ${selectedMethod?.id === m.id ? '#6366f1' : '#e2e8f0'}`,
                      background: selectedMethod?.id === m.id ? '#f0f4ff' : '#fafafa',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 22 }}>{METHOD_ICONS[m.type] || '💳'}</span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{m.title}</div>
                          <div style={{ fontSize: 12, color: '#64748b' }}>{m.accountName}</div>
                        </div>
                        {selectedMethod?.id === m.id && <span style={{ marginLeft: 'auto', color: '#6366f1', fontSize: 18 }}>✔</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment details */}
            {selectedMethod && (
              <div style={{ background: 'linear-gradient(135deg,#f0f4ff,#e0e7ff)', borderRadius: 20, padding: 20, border: '1px solid #c7d2fe', boxShadow: '0 2px 12px rgba(99,102,241,0.08)' }}>
                <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: '#3730a3' }}>Step 2: Send Payment</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <InfoRow label="Account Type" value={selectedMethod.type.replace('_', ' ')} />
                  <InfoRow label="Account Name" value={selectedMethod.accountName} />
                  <InfoRow label="Account / Number" value={selectedMethod.accountNumber} highlight />
                  <InfoRow label="Amount (PKR)" value={`PKR ${Number(course?.price || 0).toLocaleString()}`} highlight />
                </div>
                {selectedMethod.instructions && (
                  <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(255,255,255,0.7)', borderRadius: 10, fontSize: 13, color: '#4338ca', fontStyle: 'italic' }}>
                    ℹ️ {selectedMethod.instructions}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT — Upload form */}
          <div style={{ background: '#fff', borderRadius: 20, padding: 24, border: '1px solid #f1f5f9', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <h3 style={{ margin: '0 0 18px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Step 3: Upload Payment Proof</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* File upload zone */}
              <label htmlFor="screenshot-upload" style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                border: '2px dashed', borderColor: preview ? '#6366f1' : '#cbd5e1',
                borderRadius: 16, padding: '28px 16px', cursor: 'pointer', transition: 'all 0.2s',
                background: preview ? '#f0f4ff' : '#fafafa', minHeight: 180,
              }}>
                {preview ? (
                  <img src={preview} alt="Preview" style={{ maxHeight: 160, maxWidth: '100%', borderRadius: 10, objectFit: 'contain' }} />
                ) : (
                  <>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>📤</div>
                    <div style={{ fontWeight: 600, color: '#475569', fontSize: 14 }}>Click to upload screenshot</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>JPG, PNG, WEBP or PDF · Max 5MB</div>
                  </>
                )}
                <input id="screenshot-upload" type="file" accept="image/*,application/pdf" onChange={handleFileChange} style={{ display: 'none' }} />
              </label>
              {preview && (
                <button type="button" onClick={() => { setScreenshot(null); setPreview(null); }} style={{ fontSize: 12, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', alignSelf: 'center' }}>
                  ✕ Remove & re-upload
                </button>
              )}

              {/* Transaction ref */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
                  Transaction ID / Reference <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span>
                </label>
                <input
                  value={transactionRef}
                  onChange={e => setTransactionRef(e.target.value)}
                  placeholder="e.g. TXN123456789"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
              </div>

              {/* Notice */}
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '12px 14px', fontSize: 13, color: '#92400e' }}>
                ⚠️ Make sure the screenshot clearly shows the transaction amount, date, and the recipient's number. Unclear screenshots will be rejected.
              </div>

              <button type="submit" disabled={submitting || !screenshot || !selectedMethod} style={{
                padding: '14px', borderRadius: 12, border: 'none', cursor: submitting || !screenshot ? 'not-allowed' : 'pointer',
                background: screenshot && selectedMethod ? 'linear-gradient(135deg,#6366f1,#818cf8)' : '#e2e8f0',
                color: screenshot && selectedMethod ? '#fff' : '#94a3b8',
                fontSize: 15, fontWeight: 700, transition: 'all 0.2s', opacity: submitting ? 0.7 : 1,
              }}>
                {submitting ? 'Submitting…' : '📤 Submit Payment Proof'}
              </button>

              <p style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', margin: 0 }}>
                You will receive a notification once the admin verifies your payment.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, highlight }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 12, color: '#6366f1', fontWeight: 600 }}>{label}</span>
      <span style={{
        fontSize: highlight ? 15 : 13, fontWeight: highlight ? 800 : 600,
        color: highlight ? '#1e293b' : '#475569',
        fontFamily: highlight ? 'monospace' : 'inherit',
        background: highlight ? '#e0e7ff' : 'transparent',
        padding: highlight ? '3px 10px' : '0', borderRadius: 6,
        userSelect: 'all',
      }}>{value}</span>
    </div>
  );
}
