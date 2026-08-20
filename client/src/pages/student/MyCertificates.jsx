import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { certificateService, enrollmentService } from '../../services/portalService';
import toast from 'react-hot-toast';
import { IoDownloadOutline, IoPrintOutline, IoCloseOutline } from 'react-icons/io5';
import QRCode from 'qrcode';

const CERT_TEMPLATE = '/Certificate.png';

/** Percentage-based layout coordinates relative to 1078 × 765 certificate image */
const CERT_LAYOUT = {
  name: {
    left: 0.150,
    top:  0.475,
    width: 0.700,
    height: 0.080,
  },
  course: {
    left: 0.148,
    top:  0.610,
    width: 0.706,
    height: 0.055,
  },
  dateLine: {
    left:  0.245,
    top:   0.676,
    width: 0.510,
    height: 0.038,
  },
  certificateId: {
    left:  0.073,
    top:   0.897,
    width: 0.162,
    height: 0.044,
  },
  qr: {
    right:  0.044,   // 47px from right
    bottom: 0.048,   // 37px from bottom
    width:  0.082,   // 88px wide - slightly bigger than before
  },
};

function getCertFields(cert) {
  return {
    studentName:     cert.student?.name     || cert.studentName    || 'Student Name',
    courseTitle:     cert.course?.title     || cert.courseTitle     || 'Course Title',
    certificateId:   cert.certificateId     || 'SST-XXXX-00000000',
    issuedAt:        cert.issuedAt          || new Date().toISOString(),
    verificationCode: cert.verificationCode || 'VERIFY-CODE',
    attendanceMarks: cert.attendanceMarks   || 0,
    assignmentMarks: cert.assignmentMarks   || 0,
    mcqMarks:        cert.mcqMarks          || 0,
    finalMarks:      cert.finalMarks        || 0,
  };
}

function getDateParts(issuedAt) {
  const d = new Date(issuedAt);
  const n = d.getDate();
  const sfx = n > 3 && n < 21 ? 'th' : ['th','st','nd','rd','th','th','th','th','th','th'][n % 10];
  return {
    dayText:   `${n}${sfx}`,
    monthName: d.toLocaleString('en-US', { month: 'long' }),
    yearShort: String(d.getFullYear()).slice(2),
  };
}

/* ---------- Visual certificate card (HTML/CSS render) ---------- */
function CertificateDocument({ cert, id }) {
  const fields   = getCertFields(cert);
  const verifyUrl = `${window.location.origin}/verify/${fields.verificationCode}`;
  const [qrUrl, setQrUrl] = useState('');

  useEffect(() => {
    QRCode.toDataURL(verifyUrl, { margin: 1, scale: 5 })
      .then(setQrUrl)
      .catch(console.error);
  }, [verifyUrl]);

  const { dayText, monthName, yearShort } = getDateParts(fields.issuedAt);

  return (
    <div
      id={id}
      className="certificate-sheet relative w-full overflow-hidden select-none"
      style={{ aspectRatio: '1078 / 765', fontFamily: 'inherit' }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap');`}</style>

      {/* ── Background template ── */}
      <img
        src={CERT_TEMPLATE}
        alt="Certificate"
        className="absolute inset-0 w-full h-full object-fill pointer-events-none"
        draggable={false}
      />

      {/* ── Student Name ── */}
      <div
        className="absolute flex items-center justify-center text-center"
        style={{
          left:   `${CERT_LAYOUT.name.left * 100}%`,
          top:    `${CERT_LAYOUT.name.top * 100}%`,
          width:  `${CERT_LAYOUT.name.width * 100}%`,
          height: `${CERT_LAYOUT.name.height * 100}%`,
        }}
      >
        <p style={{
          fontFamily: "'Great Vibes', cursive",
          fontSize:   'clamp(22px, 4vw, 46px)',
          color:      '#082447',
          margin: 0, padding: 0, lineHeight: 1,
          maxWidth: '100%', whiteSpace: 'nowrap',
        }}>
          {fields.studentName}
        </p>
      </div>

      {/* ── Course Title ── */}
      <div
        className="absolute flex items-center justify-center text-center px-2"
        style={{
          left:   `${CERT_LAYOUT.course.left * 100}%`,
          top:    `${CERT_LAYOUT.course.top * 100}%`,
          width:  `${CERT_LAYOUT.course.width * 100}%`,
          height: `${CERT_LAYOUT.course.height * 100}%`,
        }}
      >
        <p style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontWeight: 700,
          fontSize:   'clamp(10px, 1.8vw, 20px)',
          color:      '#082447',
          margin: 0, padding: 0, lineHeight: 1,
          maxWidth: '100%', whiteSpace: 'nowrap',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}>
          {fields.courseTitle}
        </p>
      </div>

      {/* ── Date line — "Issued on 20th day of August, 2026." ── */}
      <div
        className="absolute flex items-center justify-center whitespace-nowrap"
        style={{
          left:   `${CERT_LAYOUT.dateLine.left * 100}%`,
          top:    `${CERT_LAYOUT.dateLine.top * 100}%`,
          width:  `${CERT_LAYOUT.dateLine.width * 100}%`,
          height: `${CERT_LAYOUT.dateLine.height * 100}%`,
          color:  '#082447',
          fontSize: 'clamp(9px, 1.35vw, 14px)',
          fontFamily: "Georgia, 'Times New Roman', serif",
        }}
      >
        <span>Issued on&nbsp;</span>
        <span style={{ fontFamily: "'Great Vibes', cursive", fontSize: 'clamp(11px, 1.6vw, 17px)', borderBottom: '1px solid #082447', paddingBottom: 0 }}>{dayText}</span>
        <span>&nbsp;day of&nbsp;</span>
        <span style={{ fontFamily: "'Great Vibes', cursive", fontSize: 'clamp(11px, 1.6vw, 17px)', borderBottom: '1px solid #082447', paddingBottom: 0 }}>{monthName}</span>
        <span>,&nbsp;20</span>
        <span style={{ fontFamily: "'Great Vibes', cursive", fontSize: 'clamp(11px, 1.6vw, 17px)', borderBottom: '1px solid #082447', paddingBottom: 0 }}>{yearShort}</span>
        <span>.</span>
      </div>

      {/* ── Certificate ID (gold text on dark-blue badge strip) ── */}
      <div
        className="absolute flex items-center justify-center text-center"
        style={{
          left:   `${CERT_LAYOUT.certificateId.left * 100}%`,
          top:    `${CERT_LAYOUT.certificateId.top * 100}%`,
          width:  `${CERT_LAYOUT.certificateId.width * 100}%`,
          height: `${CERT_LAYOUT.certificateId.height * 100}%`,
        }}
      >
        <p style={{
          fontFamily: 'monospace',
          fontWeight: 700,
          color:      '#c9a227',
          fontSize:   'clamp(7px, 0.95vw, 11px)',
          letterSpacing: '0.06em',
          margin: 0, lineHeight: 1,
        }}>
          {fields.certificateId}
        </p>
      </div>

      {/* ── QR Code — NO background box, sits directly on certificate ── */}
      <div
        className="absolute"
        style={{
          right:  `${CERT_LAYOUT.qr.right * 100}%`,
          bottom: `${CERT_LAYOUT.qr.bottom * 100}%`,
          width:  `${CERT_LAYOUT.qr.width * 100}%`,
          aspectRatio: '1',
        }}
        title="Scan to verify"
      >
        {qrUrl
          ? <img src={qrUrl} alt="QR" className="w-full h-full object-contain" />
          : <div className="w-full h-full bg-slate-200/40 animate-pulse rounded" />
        }
      </div>
    </div>
  );
}

/* ---------- Page component ---------- */
export default function MyCertificates() {
  const [certificates, setCertificates] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [activeCert,   setActiveCert]   = useState(null);
  const printRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const enrollRes  = await enrollmentService.getMyEnrollments();
        const enrollments = enrollRes.data?.data?.enrollments || [];

        const eligibleIds = enrollments
          .filter(e => e.progress >= 80 && e.course?.certificate)
          .map(e => e.courseId);

        if (eligibleIds.length > 0) {
          await Promise.allSettled(eligibleIds.map(id => certificateService.getCertificate(id)));
        }

        const res = await certificateService.getMyCertificates();
        setCertificates(res.data?.data?.certificates || []);
      } catch {
        toast.error('Failed to load certificates.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /** PNG canvas download */
  const handleDownload = async (cert) => {
    try {
      const fields     = getCertFields(cert);
      const verifyUrl  = `${window.location.origin}/verify/${fields.verificationCode}`;
      const { dayText, monthName, yearShort } = getDateParts(fields.issuedAt);

      const bgImg = new Image();
      await new Promise((res, rej) => { bgImg.onload = res; bgImg.onerror = rej; bgImg.src = CERT_TEMPLATE; });

      const canvas = document.createElement('canvas');
      canvas.width  = 1078;
      canvas.height = 765;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(bgImg, 0, 0, 1078, 765);

      // 1. Student name  – y baseline ~415
      ctx.fillStyle = '#082447';
      const nfs = fields.studentName.length > 28 ? '32px' : fields.studentName.length > 18 ? '38px' : '46px';
      ctx.font = `normal ${nfs} 'Great Vibes','Brush Script MT',cursive`;
      ctx.textAlign = 'center';
      ctx.fillText(fields.studentName, 539, 415, 720);

      // 2. Course title – y baseline ~497
      ctx.fillStyle = '#082447';
      const cfs = fields.courseTitle.length > 42 ? '13px' : fields.courseTitle.length > 28 ? '17px' : '20px';
      ctx.font = `bold ${cfs} Georgia,'Times New Roman',serif`;
      ctx.textAlign = 'center';
      ctx.fillText(fields.courseTitle.toUpperCase(), 539, 497, 755);

      // 3. Date line – "Issued on __day__ day of __month__, 20__year__."
      ctx.fillStyle = '#082447';
      const serif14 = "14px Georgia,'Times New Roman',serif";
      const cursive16 = "bold 16px 'Great Vibes','Brush Script MT',cursive";

      // measure to center the whole line around x=539
      ctx.font = serif14;
      const ioW  = ctx.measureText('Issued on ').width;
      const dofW = ctx.measureText(' day of ').width;
      const c20W = ctx.measureText(', 20').width;
      const dotW = ctx.measureText('.').width;
      ctx.font = cursive16;
      const dayW   = ctx.measureText(dayText).width;
      const monW   = ctx.measureText(monthName).width;
      const yrW    = ctx.measureText(yearShort).width;

      const totalW = ioW + dayW + dofW + monW + c20W + yrW + dotW;
      let cx = 539 - totalW / 2;
      const cy = 533;

      ctx.font = serif14; ctx.textAlign = 'left';
      ctx.fillText('Issued on ', cx, cy);  cx += ioW;

      ctx.font = cursive16;
      ctx.fillText(dayText, cx, cy);
      ctx.strokeStyle = '#082447'; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(cx, cy + 2); ctx.lineTo(cx + dayW, cy + 2); ctx.stroke();
      cx += dayW;

      ctx.font = serif14; ctx.fillText(' day of ', cx, cy); cx += dofW;

      ctx.font = cursive16;
      ctx.fillText(monthName, cx, cy);
      ctx.beginPath(); ctx.moveTo(cx, cy + 2); ctx.lineTo(cx + monW, cy + 2); ctx.stroke();
      cx += monW;

      ctx.font = serif14; ctx.fillText(', 20', cx, cy); cx += c20W;

      ctx.font = cursive16;
      ctx.fillText(yearShort, cx, cy);
      ctx.beginPath(); ctx.moveTo(cx, cy + 2); ctx.lineTo(cx + yrW, cy + 2); ctx.stroke();
      cx += yrW;

      ctx.font = serif14; ctx.fillText('.', cx, cy);

      // 4. Certificate ID
      ctx.fillStyle   = '#c9a227';
      ctx.font        = 'bold 12px monospace';
      ctx.textAlign   = 'center';
      ctx.fillText(fields.certificateId, 165, 708);

      // 5. QR code – no background box, drawn directly on certificate
      const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, scale: 6 });
      const qrImg = new Image();
      await new Promise(res => { qrImg.onload = res; qrImg.onerror = res; qrImg.src = qrDataUrl; });
      if (qrImg.naturalWidth > 0) {
        ctx.drawImage(qrImg, 931, 628, 88, 88);
      }

      canvas.toBlob(blob => {
        if (!blob) { toast.error('Download failed.'); return; }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${fields.certificateId}.png`; a.click();
        URL.revokeObjectURL(url);
        toast.success('Certificate downloaded!');
      }, 'image/png');

    } catch (e) {
      console.error(e);
      toast.error('Download failed. Try Print instead.');
    }
  };

  if (loading) {
    return <div className="text-center py-16 text-slate-400">Loading certificates…</div>;
  }

  return (
    <div className="font-sans max-w-4xl mx-auto">
      {/* Print styles */}
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 0; }
          body * { visibility: hidden !important; }
          .cert-print-area, .cert-print-area * { visibility: visible !important; }
          .cert-print-area {
            position: fixed !important; inset: 0 !important;
            padding: 0 !important; margin: 0 !important;
            background: white !important; z-index: 9999 !important;
            display: flex !important; align-items: center !important; justify-content: center !important;
          }
          .no-print { display: none !important; }
          .certificate-sheet { width: 297mm !important; height: 210mm !important; aspect-ratio: 1078/765 !important; }
        }
      `}</style>

      {/* Page header */}
      <div className="mb-7 no-print">
        <h1 className="text-2xl font-heading font-extrabold text-slate-900 m-0">My Certificates</h1>
        <p className="text-sm text-slate-500 mt-1">Official certificates issued upon course completion.</p>
      </div>

      {/* Empty state */}
      {certificates.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200 no-print">
          <div className="text-4xl mb-3">🏅</div>
          <h3 className="text-slate-800 font-bold mb-2">No certificates yet</h3>
          <p className="text-sm text-slate-500 mb-5">Complete an eligible course to earn your certificate.</p>
          <Link to="/student/my-courses"
            className="inline-block px-6 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors">
            Continue Learning
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 no-print mb-10">
          {certificates.map(cert => (
            <div key={cert.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">

              {/* Certificate preview */}
              <div className="rounded-xl overflow-hidden border border-slate-100 mb-4">
                <CertificateDocument cert={cert} />
              </div>

              {/* Info */}
              <p className="font-bold text-slate-800 text-sm mb-0.5 line-clamp-1">{cert.course?.title}</p>
              <p className="text-xs text-slate-500 mb-1 font-mono">{cert.certificateId}</p>
              <p className="text-[11px] text-slate-400 mb-4">
                Issued {new Date(cert.issuedAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveCert(cert)}
                  className="flex-1 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  View
                </button>
                <button
                  onClick={() => handleDownload(cert)}
                  title="Download PNG"
                  className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <IoDownloadOutline size={15} />
                  <span>PNG</span>
                </button>
                <button
                  onClick={() => { setActiveCert(cert); setTimeout(() => window.print(), 350); }}
                  title="Print / Save PDF"
                  className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <IoPrintOutline size={15} />
                  <span>PDF</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full-screen view / print modal */}
      {activeCert && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 cert-print-area"
          onClick={() => setActiveCert(null)}
        >
          <div
            ref={printRef}
            className="w-full max-w-4xl"
            onClick={e => e.stopPropagation()}
          >
            <CertificateDocument cert={activeCert} id="printable-certificate" />

            <div className="flex justify-center gap-3 mt-4 no-print">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors cursor-pointer"
              >
                <IoPrintOutline size={16} /> Print / Save PDF
              </button>
              <button
                onClick={() => handleDownload(activeCert)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold border border-slate-200 transition-colors cursor-pointer"
              >
                <IoDownloadOutline size={16} /> Download PNG
              </button>
              <button
                onClick={() => setActiveCert(null)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-500 text-sm font-semibold border border-slate-200 transition-colors cursor-pointer"
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
