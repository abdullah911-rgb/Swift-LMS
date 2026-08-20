import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { certificateService, enrollmentService } from '../../services/portalService';
import toast from 'react-hot-toast';
import { IoDownloadOutline, IoPrintOutline, IoCloseOutline } from 'react-icons/io5';
import QRCode from 'qrcode';

const CERT_TEMPLATE = '/Certificate.png';

/** Exact percentage layout relative to 1078 x 765 template image */
const CERT_LAYOUT = {
  baseWidth: 1078,
  baseHeight: 765,
  name: {
    left: 0.150,     // 162 / 1078
    top: 0.480,      // 367 / 765
    width: 0.700,    // 754 / 1078
    height: 0.075,   // 57 / 765
  },
  course: {
    left: 0.150,     // 162 / 1078
    top: 0.610,      // 467 / 765
    width: 0.700,    // 754 / 1078
    height: 0.052,   // 40 / 765
  },
  date: {
    top: 0.675,      // 516 / 765 (positioned neatly ABOVE baseline line)
    height: 0.035,   // 27 / 765
    day: { left: 0.392, width: 0.048 },    // 422px..474px (center ~448px)
    month: { left: 0.492, width: 0.076 },  // 530px..612px (center ~571px)
    year: { left: 0.596, width: 0.030 },   // 642px..674px (center ~658px)
  },
  summary: {
    left: 0.082,     // 88 / 1078 (compact width, clear of left gold border)
    top: 0.682,      // 522 / 765
    width: 0.195,    // 210 / 1078 (tight box wrapping summary text)
    height: 0.145,   // 110 / 765
  },
  certificateId: {
    left: 0.072,     // 78 / 1078
    top: 0.899,      // 688 / 765
    width: 0.162,    // 175 / 1078
    height: 0.042,   // 32 / 765
  },
  qr: {
    right: 0.058,    // 62 / 1078 (tight 64px box matching QR code size)
    bottom: 0.072,   // 55 / 765
    width: 0.059,    // 64 / 1078 (64px square container)
  },
};

function getCertFields(cert) {
  return {
    studentName: cert.student?.name || cert.studentName || 'Student Name',
    courseTitle: cert.course?.title || cert.courseTitle || 'Course Title',
    certificateId: cert.certificateId || 'SST-XXXX-00000000',
    issuedAt: cert.issuedAt || new Date().toISOString(),
    verificationCode: cert.verificationCode || 'VERIFY-CODE',
    attendanceMarks: cert.attendanceMarks || 0,
    assignmentMarks: cert.assignmentMarks || 0,
    mcqMarks: cert.mcqMarks || 0,
    finalMarks: cert.finalMarks || 0,
  };
}

function getDateParts(issuedAt) {
  const dateObj = new Date(issuedAt);
  const dayNum = dateObj.getDate();
  const monthName = dateObj.toLocaleString('en-US', { month: 'long' });
  const yearShort = String(dateObj.getFullYear()).substring(2);
  const getSuffix = (n) => {
    if (n > 3 && n < 21) return 'th';
    switch (n % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  return {
    dayText: `${dayNum}${getSuffix(dayNum)}`,
    monthName,
    yearShort,
  };
}

/** Visual certificate component with pixel-perfect background alignment */
function CertificateDocument({ cert, id }) {
  const fields = getCertFields(cert);
  const verifyUrl = `${window.location.origin}/verify/${fields.verificationCode}`;

  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');

  useEffect(() => {
    if (fields.verificationCode) {
      QRCode.toDataURL(verifyUrl, { margin: 1, scale: 4 })
        .then(url => setQrCodeDataUrl(url))
        .catch(err => console.error('QR code generation error:', err));
    }
  }, [verifyUrl]);

  const { dayText, monthName, yearShort } = getDateParts(fields.issuedAt);

  return (
    <div
      id={id}
      className="certificate-sheet relative w-full bg-white overflow-hidden select-none"
      style={{ aspectRatio: '1078 / 765' }}
    >
      {/* Import Great Vibes Handwriting Cursive font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap');
      `}</style>

      {/* Pristine Seamless Parchment Template Image */}
      <img
        src={CERT_TEMPLATE}
        alt="Certificate template"
        className="absolute inset-0 w-full h-full object-fill pointer-events-none"
        draggable={false}
      />

      {/* Student Name */}
      <div
        className="absolute text-center flex items-center justify-center bg-transparent"
        style={{
          left: `${CERT_LAYOUT.name.left * 100}%`,
          top: `${CERT_LAYOUT.name.top * 100}%`,
          width: `${CERT_LAYOUT.name.width * 100}%`,
          height: `${CERT_LAYOUT.name.height * 100}%`,
        }}
      >
        <p
          className="text-[#082447] leading-none whitespace-nowrap m-0 p-0"
          style={{ 
            fontFamily: "'Great Vibes', cursive", 
            fontSize: 'clamp(20px, 3.8vw, 44px)',
            fontWeight: 'normal',
            maxWidth: '100%',
          }}
        >
          {fields.studentName}
        </p>
      </div>

      {/* Course / Program Title */}
      <div
        className="absolute text-center flex items-center justify-center bg-transparent px-[1%]"
        style={{
          left: `${CERT_LAYOUT.course.left * 100}%`,
          top: `${CERT_LAYOUT.course.top * 100}%`,
          width: `${CERT_LAYOUT.course.width * 100}%`,
          height: `${CERT_LAYOUT.course.height * 100}%`,
        }}
      >
        <p
          className="font-serif font-bold uppercase tracking-wide text-[#082447] leading-none whitespace-nowrap m-0 p-0"
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: 'clamp(10px, 1.8vw, 20px)',
            maxWidth: '100%',
          }}
        >
          {fields.courseTitle}
        </p>
      </div>

      {/* Date Day - Positioned ABOVE baseline */}
      <div
        className="absolute text-center flex items-center justify-center bg-transparent"
        style={{
          left: `${CERT_LAYOUT.date.day.left * 100}%`,
          width: `${CERT_LAYOUT.date.day.width * 100}%`,
          top: `${CERT_LAYOUT.date.top * 100}%`,
          height: `${CERT_LAYOUT.date.height * 100}%`,
        }}
      >
        <span
          className="text-[#082447] leading-none font-bold"
          style={{ 
            fontFamily: "'Great Vibes', cursive",
            fontSize: 'clamp(7px, 1.1vw, 13px)',
          }}
        >
          {dayText}
        </span>
      </div>

      {/* Date Month - Positioned ABOVE baseline */}
      <div
        className="absolute text-center flex items-center justify-center bg-transparent"
        style={{
          left: `${CERT_LAYOUT.date.month.left * 100}%`,
          width: `${CERT_LAYOUT.date.month.width * 100}%`,
          top: `${CERT_LAYOUT.date.top * 100}%`,
          height: `${CERT_LAYOUT.date.height * 100}%`,
        }}
      >
        <span
          className="text-[#082447] leading-none font-bold"
          style={{ 
            fontFamily: "'Great Vibes', cursive",
            fontSize: 'clamp(7px, 1.1vw, 13px)',
          }}
        >
          {monthName}
        </span>
      </div>

      {/* Date Year - Positioned ABOVE baseline */}
      <div
        className="absolute text-center flex items-center justify-center bg-transparent"
        style={{
          left: `${CERT_LAYOUT.date.year.left * 100}%`,
          width: `${CERT_LAYOUT.date.year.width * 100}%`,
          top: `${CERT_LAYOUT.date.top * 100}%`,
          height: `${CERT_LAYOUT.date.height * 100}%`,
        }}
      >
        <span
          className="text-[#082447] leading-none font-bold"
          style={{ 
            fontFamily: "'Great Vibes', cursive",
            fontSize: 'clamp(7px, 1.1vw, 13px)',
          }}
        >
          {yearShort}
        </span>
      </div>

      {/* Compact Evaluation Summary Box - Box width reduced to fit content tightly */}
      <div
        className="absolute bg-white/95 backdrop-blur-xs border border-[#c9a227]/40 rounded-xl p-2.5 shadow-xs font-sans flex flex-col gap-0.5 text-[#082447]"
        style={{
          left: `${CERT_LAYOUT.summary.left * 100}%`,
          top: `${CERT_LAYOUT.summary.top * 100}%`,
          width: `${CERT_LAYOUT.summary.width * 100}%`,
          height: `${CERT_LAYOUT.summary.height * 100}%`,
        }}
      >
        <span className="text-[5.5px] sm:text-[8.5px] font-extrabold uppercase tracking-wide text-[#c9a227]">Evaluation Summary</span>
        <div className="grid grid-cols-2 gap-x-1.5 text-[5px] sm:text-[7.5px] font-medium border-t border-slate-100 pt-0.5 leading-tight">
          <span>Attendance:</span> <span className="font-bold text-right">{fields.attendanceMarks.toFixed(1)}/20</span>
          <span>Assignments:</span> <span className="font-bold text-right">{fields.assignmentMarks.toFixed(1)}/20</span>
          <span>Final MCQ:</span> <span className="font-bold text-right">{fields.mcqMarks.toFixed(1)}/60</span>
          <span className="font-bold text-[#c9a227] border-t border-slate-100 mt-0.5">Total Score:</span>
          <span className="font-extrabold text-[#c9a227] text-right border-t border-slate-100 mt-0.5">{fields.finalMarks.toFixed(1)}/100</span>
        </div>
      </div>

      {/* Certificate ID Banner (gold text on dark blue badge) */}
      <div
        className="absolute flex items-center justify-center bg-transparent px-1 text-center"
        style={{
          left: `${CERT_LAYOUT.certificateId.left * 100}%`,
          top: `${CERT_LAYOUT.certificateId.top * 100}%`,
          width: `${CERT_LAYOUT.certificateId.width * 100}%`,
          height: `${CERT_LAYOUT.certificateId.height * 100}%`,
        }}
      >
        <p
          className="font-mono font-bold text-[#c9a227] tracking-wider leading-none text-center w-full m-0"
          style={{ fontSize: 'clamp(7px, 1vw, 12px)' }}
        >
          {fields.certificateId}
        </p>
      </div>

      {/* Tight White Container Box around QR Code (Matching QR Code size) */}
      <div
        className="absolute flex items-center justify-center bg-white p-1 rounded-lg border border-slate-200/80 shadow-xs"
        style={{
          right: `${CERT_LAYOUT.qr.right * 100}%`,
          bottom: `${CERT_LAYOUT.qr.bottom * 100}%`,
          width: `${CERT_LAYOUT.qr.width * 100}%`,
          aspectRatio: '1',
        }}
        title="Scan to verify authenticity"
      >
        {qrCodeDataUrl ? (
          <img
            src={qrCodeDataUrl}
            alt="Verification QR"
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full bg-slate-100 animate-pulse" />
        )}
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
        const enrollRes = await enrollmentService.getMyEnrollments();
        const enrollments = enrollRes.data?.data?.enrollments || [];

        const eligibleCourseIds = enrollments
          .filter(e => e.progress >= 80 && e.course?.certificate)
          .map(e => e.courseId);

        if (eligibleCourseIds.length > 0) {
          await Promise.allSettled(
            eligibleCourseIds.map(id => certificateService.getCertificate(id))
          );
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

  const handlePrint = () => {
    window.print();
  };

  /** Pure Canvas Image download engine matching 1078 x 765 coordinates 100% */
  const handleDownload = async (cert) => {
    try {
      const fields = getCertFields(cert);
      const verifyUrl = `${window.location.origin}/verify/${fields.verificationCode}`;
      const { dayText, monthName, yearShort } = getDateParts(fields.issuedAt);

      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = CERT_TEMPLATE;
      });

      const canvas = document.createElement('canvas');
      canvas.width = 1078;
      canvas.height = 765;
      const ctx = canvas.getContext('2d');

      // Draw background template
      ctx.drawImage(img, 0, 0, 1078, 765);

      // 1. Student Name (centered at x=539, y=412)
      const nameFont = fields.studentName.length > 30 ? '30px' : fields.studentName.length > 20 ? '36px' : '44px';
      ctx.fillStyle = '#082447';
      ctx.font = `normal ${nameFont} 'Great Vibes', 'Brush Script MT', cursive`;
      ctx.textAlign = 'center';
      ctx.fillText(fields.studentName, 539, 412, 720);

      // 2. Course Title (centered at x=539, y=496)
      const courseFont = fields.courseTitle.length > 40 ? '14px' : fields.courseTitle.length > 28 ? '18px' : '20px';
      ctx.fillStyle = '#082447';
      ctx.font = `bold ${courseFont} Georgia, 'Times New Roman', serif`;
      ctx.textAlign = 'center';
      ctx.fillText(fields.courseTitle.toUpperCase(), 539, 496, 760);

      // 3. Compact Date Parts (positioned neatly ABOVE baseline line at y=530)
      ctx.fillStyle = '#082447';
      ctx.font = "bold 13px 'Great Vibes', 'Brush Script MT', cursive";
      ctx.textAlign = 'center';
      ctx.fillText(dayText, 448, 530);
      ctx.fillText(monthName, 571, 530);
      ctx.fillText(yearShort, 658, 530);

      // 4. Compact Evaluation Summary Box (left: 88, top: 522, width: 210, height: 110)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.strokeStyle = '#c9a227';
      ctx.lineWidth = 1.5;
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(88, 522, 210, 110, 8);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillRect(88, 522, 210, 110);
        ctx.strokeRect(88, 522, 210, 110);
      }

      ctx.fillStyle = '#c9a227';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('EVALUATION SUMMARY', 98, 541);

      ctx.fillStyle = '#082447';
      ctx.font = '10px sans-serif';
      const drawSummaryRow = (label, val, yOff) => {
        ctx.textAlign = 'left';
        ctx.fillText(label, 98, yOff);
        ctx.textAlign = 'right';
        ctx.fillText(val, 286, yOff);
      };

      drawSummaryRow('Attendance:', `${fields.attendanceMarks.toFixed(1)}/20`, 559);
      drawSummaryRow('Assignments:', `${fields.assignmentMarks.toFixed(1)}/20`, 576);
      drawSummaryRow('Final MCQ:', `${fields.mcqMarks.toFixed(1)}/60`, 593);

      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(98, 602);
      ctx.lineTo(286, 602);
      ctx.stroke();

      ctx.fillStyle = '#c9a227';
      ctx.font = 'bold 11px sans-serif';
      drawSummaryRow('Total Score:', `${fields.finalMarks.toFixed(1)} / 100`, 618);

      // 5. Certificate ID (gold text directly inside blue badge)
      ctx.fillStyle = '#c9a227';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(fields.certificateId, 165, 708);

      // 6. Tight White Box matching QR Code size (x: 944, y: 630, 64x64)
      const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, scale: 6 });
      const qrImg = new Image();
      await new Promise((resolve) => {
        qrImg.onload = resolve;
        qrImg.onerror = resolve;
        qrImg.src = qrDataUrl;
      });

      if (qrImg.complete && qrImg.naturalWidth > 0) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(944, 630, 64, 64);
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.strokeRect(944, 630, 64, 64);
        ctx.drawImage(qrImg, 946, 632, 60, 60);
      }

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
    } catch (e) {
      console.error(e);
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
      {/* Landscape Print CSS Engine */}
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 0;
          }
          body * { visibility: hidden !important; }
          .certificate-print-area, .certificate-print-area * { visibility: visible !important; }
          .certificate-print-area {
            position: fixed !important;
            inset: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
            z-index: 9999 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
          .no-print { display: none !important; }
          .certificate-sheet {
            width: 297mm !important;
            height: 210mm !important;
            max-width: 100vw !important;
            max-height: 100vh !important;
            aspect-ratio: 1078 / 765 !important;
          }
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
                <IoPrintOutline size={16} /> Print / Save PDF
              </button>
              <button
                onClick={() => handleDownload(activeCert)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-slate-700 text-sm font-bold border border-slate-200 hover:bg-slate-50 cursor-pointer"
              >
                <IoDownloadOutline size={16} /> Download PNG
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
