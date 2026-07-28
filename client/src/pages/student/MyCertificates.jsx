import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { certificateService } from '../../services/portalService';
import toast from 'react-hot-toast';
import { IoDownloadOutline, IoPrintOutline, IoCloseOutline } from 'react-icons/io5';

const CERT_TEMPLATE = '/Certificate.png';

function formatIssueDate(dateStr) {
  const d = new Date(dateStr);
  const day = d.getDate();
  const month = d.toLocaleString('en-US', { month: 'long' });
  const year = d.getFullYear();
  const suffix = (n) => {
    if (n > 3 && n < 21) return 'th';
    switch (n % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };
  return `Issued on this ${day}${suffix(day)} day of ${month}, ${year}.`;
}

function getCertFields(cert) {
  return {
    studentName: cert.student?.name || cert.studentName || 'Student',
    courseTitle: cert.course?.title || cert.courseTitle || 'Course',
    certificateId: cert.certificateId || 'SST-XXXX-00000000',
    issuedAt: cert.issuedAt,
    verificationCode: cert.verificationCode,
  };
}

/** Visual certificate using the approved template + dynamic overlays */
function CertificateDocument({ cert, id }) {
  const fields = getCertFields(cert);

  return (
    <div
      id={id}
      className="certificate-sheet relative w-full bg-white overflow-hidden select-none"
      style={{ aspectRatio: '1.414 / 1' }}
    >
      <img
        src={CERT_TEMPLATE}
        alt="Certificate template"
        className="absolute inset-0 w-full h-full object-fill pointer-events-none"
        draggable={false}
      />

      {/* Student Name — covers "Your Name Here" */}
      <div
        className="absolute left-[10%] right-[10%] text-center"
        style={{ top: '41.5%' }}
      >
        <div className="mx-auto bg-white/90 px-4 py-1 max-w-[80%]">
          <p
            className="font-serif italic font-bold text-[#0a2540] leading-tight truncate"
            style={{ fontSize: 'clamp(18px, 3.2vw, 36px)' }}
          >
            {fields.studentName}
          </p>
        </div>
      </div>

      {/* Course / Program Name — covers "[PROGRAM / COURSE NAME]" */}
      <div
        className="absolute left-[8%] right-[8%] text-center"
        style={{ top: '56%' }}
      >
        <div className="mx-auto bg-white/90 px-3 py-1 max-w-[90%]">
          <p
            className="font-serif font-bold uppercase tracking-wide text-[#0a2540] leading-snug"
            style={{ fontSize: 'clamp(12px, 1.8vw, 20px)' }}
          >
            {fields.courseTitle}
          </p>
        </div>
      </div>

      {/* Issue Date — covers date blanks */}
      <div
        className="absolute left-[15%] right-[15%] text-center"
        style={{ top: '63%' }}
      >
        <div className="mx-auto bg-white/90 px-3 py-0.5 inline-block">
          <p
            className="font-serif text-[#0a2540]"
            style={{ fontSize: 'clamp(10px, 1.2vw, 14px)' }}
          >
            {formatIssueDate(fields.issuedAt)}
          </p>
        </div>
      </div>

      {/* Certificate ID — bottom-left ribbon area */}
      <div
        className="absolute"
        style={{ left: '7.5%', bottom: '5.5%', width: '28%' }}
      >
        <p
          className="font-mono font-bold text-[#c9a227] tracking-wider"
          style={{ fontSize: 'clamp(9px, 1.1vw, 13px)', textShadow: '0 0 4px #0a2540' }}
        >
          {fields.certificateId}
        </p>
      </div>

      {/*
        QR Code placeholder — bottom-right.
        Content/destination will be configured later per institute requirements.
      */}
      <div
        className="absolute flex flex-col items-center justify-center bg-white border border-slate-300"
        style={{ right: '5.5%', bottom: '4.5%', width: '11%', aspectRatio: '1' }}
        title="QR code will be configured soon"
      >
        <span className="text-[7px] sm:text-[9px] font-semibold text-slate-400 text-center leading-tight px-1">
          QR
        </span>
      </div>
    </div>
  );
}

export default function MyCertificates() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCert, setActiveCert] = useState(null);
  const printRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await certificateService.getMyCertificates();
        setCertificates(res.data?.data?.certificates || []);
      } catch {
        toast.error('Failed to load certificates.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async (cert) => {
    try {
      const fields = getCertFields(cert);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = CERT_TEMPLATE;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      const w = canvas.width;
      const h = canvas.height;

      // Cover + draw student name
      const nameY = h * 0.445;
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.fillRect(w * 0.15, nameY - h * 0.04, w * 0.7, h * 0.07);
      ctx.fillStyle = '#0a2540';
      ctx.font = `italic bold ${Math.round(w * 0.045)}px Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.fillText(fields.studentName, w / 2, nameY, w * 0.7);

      // Course title
      const courseY = h * 0.58;
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.fillRect(w * 0.1, courseY - h * 0.03, w * 0.8, h * 0.055);
      ctx.fillStyle = '#0a2540';
      ctx.font = `bold ${Math.round(w * 0.028)}px Georgia, serif`;
      ctx.fillText(fields.courseTitle.toUpperCase(), w / 2, courseY, w * 0.8);

      // Date
      const dateY = h * 0.645;
      const dateText = formatIssueDate(fields.issuedAt);
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      const dateWidth = ctx.measureText(dateText).width + 40;
      ctx.fillRect(w / 2 - dateWidth / 2, dateY - h * 0.02, dateWidth, h * 0.035);
      ctx.fillStyle = '#0a2540';
      ctx.font = `${Math.round(w * 0.016)}px Georgia, serif`;
      ctx.fillText(dateText, w / 2, dateY);

      // Certificate ID (bottom-left)
      ctx.fillStyle = '#c9a227';
      ctx.font = `bold ${Math.round(w * 0.016)}px monospace`;
      ctx.textAlign = 'left';
      ctx.fillText(fields.certificateId, w * 0.08, h * 0.935);

      // QR placeholder (bottom-right) — content TBD
      const qrSize = w * 0.1;
      const qrX = w * 0.855;
      const qrY = h * 0.82;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(qrX, qrY, qrSize, qrSize);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.strokeRect(qrX, qrY, qrSize, qrSize);
      ctx.fillStyle = '#94a3b8';
      ctx.font = `${Math.round(w * 0.012)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('QR', qrX + qrSize / 2, qrY + qrSize / 2 + 4);

      canvas.toBlob((blob) => {
        if (!blob) {
          toast.error('Could not generate certificate image.');
          return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fields.certificateId}.png`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Certificate downloaded.');
      }, 'image/png');
    } catch {
      toast.error('Download failed. Try Print instead.');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-16 text-slate-400 font-sans">
        Loading your certificates…
      </div>
    );
  }

  return (
    <div className="font-sans max-w-4xl mx-auto">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .certificate-print-area, .certificate-print-area * { visibility: visible !important; }
          .certificate-print-area {
            position: fixed !important;
            inset: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
            z-index: 9999 !important;
          }
          .no-print { display: none !important; }
          .certificate-sheet { width: 100vw !important; height: 100vh !important; aspect-ratio: auto !important; }
        }
      `}</style>

      <div className="mb-7 no-print">
        <h1 className="text-2xl font-heading font-extrabold text-slate-900 m-0">My Certificates</h1>
        <p className="text-sm text-slate-500 mt-1">
          Official certificates issued upon course completion. View, download, or print anytime.
        </p>
      </div>

      {certificates.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200 no-print">
          <div className="text-4xl mb-3">🏅</div>
          <h3 className="text-slate-800 font-bold mb-2">No certificates yet</h3>
          <p className="text-sm text-slate-500 mb-5">
            Complete an eligible course to automatically receive your certificate.
          </p>
          <Link
            to="/student/my-courses"
            className="inline-block px-6 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors"
          >
            Continue Learning
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 no-print mb-10">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="rounded-xl overflow-hidden border border-slate-100 mb-4">
                <CertificateDocument cert={cert} />
              </div>
              <p className="font-bold text-slate-800 text-sm mb-0.5 line-clamp-1">{cert.course?.title}</p>
              <p className="text-xs text-slate-500 mb-1 font-mono">{cert.certificateId}</p>
              <p className="text-[11px] text-slate-400 mb-3">
                Issued {new Date(cert.issuedAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveCert(cert)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary-600 text-white text-xs font-bold hover:bg-primary-700 cursor-pointer"
                >
                  View
                </button>
                <button
                  onClick={() => handleDownload(cert)}
                  className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                  title="Download"
                >
                  <IoDownloadOutline size={15} />
                </button>
                <button
                  onClick={() => { setActiveCert(cert); setTimeout(() => window.print(), 300); }}
                  className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                  title="Print"
                >
                  <IoPrintOutline size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View / Print Modal */}
      {activeCert && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 certificate-print-area"
          onClick={() => setActiveCert(null)}
        >
          <div
            ref={printRef}
            className="w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <CertificateDocument cert={activeCert} id="printable-certificate" />
            <div className="flex justify-center gap-3 mt-4 no-print">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-bold hover:bg-primary-700 cursor-pointer"
              >
                <IoPrintOutline size={16} /> Print
              </button>
              <button
                onClick={() => handleDownload(activeCert)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-slate-700 text-sm font-bold border border-slate-200 hover:bg-slate-50 cursor-pointer"
              >
                <IoDownloadOutline size={16} /> Download
              </button>
              <button
                onClick={() => setActiveCert(null)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-slate-500 text-sm font-semibold border border-slate-200 hover:bg-slate-50 cursor-pointer"
              >
                <IoCloseOutline size={16} /> Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
