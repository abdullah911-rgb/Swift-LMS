import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { certificateService, enrollmentService } from '../../services/portalService';
import toast from 'react-hot-toast';
import { IoDownloadOutline, IoPrintOutline, IoCloseOutline, IoRibbonOutline } from 'react-icons/io5';
import QRCode from 'qrcode';

const CERT_TEMPLATE = '/Certificate.png';

const CERT_LAYOUT = {
  name: {
    left: 0.195,
    top: 0.476,
    width: 0.61,
    height: 0.075,
    fontSize: 'clamp(22px, 4vw, 49px)',
    canvasFontScale: 0.05,
    textYOffset: 0.017,
  },
  course: {
    left: 0.255,
    top: 0.634,
    width: 0.49,
    height: 0.03,
    fontSize: 'clamp(11px, 1.7vw, 20px)',
    canvasFontScale: 0.023,
    textYOffset: 0.006,
  },
  date: {
    top: 0.672,
    height: 0.028,
    // Oversize masks to fully hide template handwriting placeholders
    day: { left: 0.413, width: 0.053 },
    month: { left: 0.497, width: 0.090 },
    year: { left: 0.625, width: 0.026 },
    fontSize: 'clamp(10px, 1.65vw, 20px)',
    canvasFontScale: 0.019,
  },
  summary: {
    left: 0.08,
    top: 0.73,
    width: 0.275,
    height: 0.15,
  },
  certificateId: {
    left: 0.075,
    top: 0.902,
    width: 0.165,
    height: 0.041,
    fontSize: 'clamp(7px, 0.95vw, 12px)',
    canvasFontScale: 0.0135,
  },
  qr: {
    right: 0.041,
    bottom: 0.028,
    width: 0.086,
  },
};

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

/** Visual certificate using the approved template + dynamic overlays */
function CertificateDocument({ cert, id }) {
  const fields = getCertFields(cert);
  const verifyUrl = `${window.location.origin}/verify/${fields.verificationCode}`;

  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');

  // Generate QR code base64 URL client-side (no third-party API dependencies, 100% reliable)
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
      style={{ aspectRatio: '1.414 / 1' }}
    >
      {/* Import Great Vibes Handwriting Cursive font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap');
      `}</style>

      <img
        src={CERT_TEMPLATE}
        alt="Certificate template"
        className="absolute inset-0 w-full h-full object-fill pointer-events-none"
        draggable={false}
      />

      {/* Student name */}
      <div
        className="absolute text-center"
        style={{
          left: `${CERT_LAYOUT.name.left * 100}%`,
          top: `${CERT_LAYOUT.name.top * 100}%`,
          width: `${CERT_LAYOUT.name.width * 100}%`,
          height: `${CERT_LAYOUT.name.height * 100}%`,
        }}
      >
        <div className="w-full h-full bg-white flex items-center justify-center">
          <p
            className="text-[#0a2540] leading-none whitespace-nowrap"
            style={{ 
              fontFamily: "'Great Vibes', cursive", 
              fontSize: CERT_LAYOUT.name.fontSize,
              fontWeight: 'normal',
              maxWidth: '100%',
            }}
          >
            {fields.studentName}
          </p>
        </div>
      </div>

      {/* Course / program name */}
      <div
        className="absolute text-center"
        style={{
          left: `${CERT_LAYOUT.course.left * 100}%`,
          top: `${CERT_LAYOUT.course.top * 100}%`,
          width: `${CERT_LAYOUT.course.width * 100}%`,
          height: `${CERT_LAYOUT.course.height * 100}%`,
        }}
      >
        <div className="w-full h-full bg-white flex items-center justify-center px-[1%]">
          <p
            className="font-serif font-bold uppercase tracking-wide text-[#0a2540] leading-none whitespace-nowrap"
            style={{ fontSize: CERT_LAYOUT.course.fontSize, maxWidth: '100%' }}
          >
            {fields.courseTitle}
          </p>
        </div>
      </div>

      {/* Date day */}
      <div
        className="absolute text-center flex items-center justify-center"
        style={{
          left: `${CERT_LAYOUT.date.day.left * 100}%`,
          width: `${CERT_LAYOUT.date.day.width * 100}%`,
          top: `${CERT_LAYOUT.date.top * 100}%`,
          height: `${CERT_LAYOUT.date.height * 100}%`,
          backgroundColor: '#ffffff',
        }}
      >
        <span
          className="text-[#0a2540] leading-none font-bold"
          style={{ 
            fontFamily: "'Great Vibes', cursive",
            fontSize: CERT_LAYOUT.date.fontSize,
          }}
        >
          {dayText}
        </span>
      </div>

      {/* Date month */}
      <div
        className="absolute text-center flex items-center justify-center"
        style={{
          left: `${CERT_LAYOUT.date.month.left * 100}%`,
          width: `${CERT_LAYOUT.date.month.width * 100}%`,
          top: `${CERT_LAYOUT.date.top * 100}%`,
          height: `${CERT_LAYOUT.date.height * 100}%`,
          backgroundColor: '#ffffff',
        }}
      >
        <span
          className="text-[#0a2540] leading-none font-bold"
          style={{ 
            fontFamily: "'Great Vibes', cursive",
            fontSize: CERT_LAYOUT.date.fontSize,
          }}
        >
          {monthName}
        </span>
      </div>

      {/* Date year */}
      <div
        className="absolute text-center flex items-center justify-center"
        style={{
          left: `${CERT_LAYOUT.date.year.left * 100}%`,
          width: `${CERT_LAYOUT.date.year.width * 100}%`,
          top: `${CERT_LAYOUT.date.top * 100}%`,
          height: `${CERT_LAYOUT.date.height * 100}%`,
          backgroundColor: '#ffffff',
        }}
      >
        <span
          className="text-[#0a2540] leading-none font-bold"
          style={{ 
            fontFamily: "'Great Vibes', cursive",
            fontSize: CERT_LAYOUT.date.fontSize,
          }}
        >
          {yearShort}
        </span>
      </div>

      {/* Marks Breakdown Box — placed on left bottom overlay */}
      <div
        className="absolute bg-white/95 backdrop-blur-xs border border-[#c9a227]/30 rounded-lg p-2 shadow-xs font-sans flex flex-col gap-0.5 text-[#0a2540]"
        style={{
          left: `${CERT_LAYOUT.summary.left * 100}%`,
          top: `${CERT_LAYOUT.summary.top * 100}%`,
          width: `${CERT_LAYOUT.summary.width * 100}%`,
          height: `${CERT_LAYOUT.summary.height * 100}%`,
        }}
      >
        <span className="text-[6px] sm:text-[9px] font-extrabold uppercase tracking-wide text-[#c9a227]">Evaluation Summary</span>
        <div className="grid grid-cols-2 gap-x-2 text-[5px] sm:text-[8px] font-medium border-t border-slate-100 pt-0.5">
          <span>Attendance:</span> <span className="font-bold text-right">{fields.attendanceMarks.toFixed(1)}/20</span>
          <span>Assignments:</span> <span className="font-bold text-right">{fields.assignmentMarks.toFixed(1)}/20</span>
          <span>Final MCQ:</span> <span className="font-bold text-right">{fields.mcqMarks.toFixed(1)}/60</span>
          <span className="font-bold text-[#c9a227] border-t border-slate-100 mt-0.5">Total Score:</span>
          <span className="font-extrabold text-[#c9a227] text-right border-t border-slate-100 mt-0.5">{fields.finalMarks.toFixed(1)}/100</span>
        </div>
      </div>

      {/* Certificate ID — covers bottom-left template ID with matching solid dark blue cover */}
      <div
        className="absolute flex items-center justify-center bg-[#0a2540] px-1 text-center"
        style={{
          left: `${CERT_LAYOUT.certificateId.left * 100}%`,
          top: `${CERT_LAYOUT.certificateId.top * 100}%`,
          width: `${CERT_LAYOUT.certificateId.width * 100}%`,
          height: `${CERT_LAYOUT.certificateId.height * 100}%`,
        }}
      >
        <p
          className="font-mono font-bold text-[#c9a227] tracking-wider leading-none text-center w-full"
          style={{ fontSize: CERT_LAYOUT.certificateId.fontSize }}
        >
          {fields.certificateId}
        </p>
      </div>

      {/* Dynamic Verification QR Code — bottom-right, fits exactly on top of the template printed QR code */}
      <div
        className="absolute flex items-center justify-center bg-white p-0.5"
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
        // Step 1: Fetch all enrollments to find completed courses
        const enrollRes = await enrollmentService.getMyEnrollments();
        const enrollments = enrollRes.data?.data?.enrollments || [];

        // Step 2: Auto-issue certificates for eligible completed courses
        const eligibleCourseIds = enrollments
          .filter(e => e.progress >= 80 && e.course?.certificate)
          .map(e => e.courseId);

        if (eligibleCourseIds.length > 0) {
          await Promise.allSettled(
            eligibleCourseIds.map(id => certificateService.getCertificate(id))
          );
        }

        // Step 3: Now fetch the issued certificates list
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
      const verifyUrl = `${window.location.origin}/verify/${fields.verificationCode}`;
      const { dayText, monthName, yearShort } = getDateParts(fields.issuedAt);

      const img = new Image();
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

      // Student name
      const nameRectX = w * CERT_LAYOUT.name.left;
      const nameRectY = h * CERT_LAYOUT.name.top;
      const nameRectW = w * CERT_LAYOUT.name.width;
      const nameRectH = h * CERT_LAYOUT.name.height;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(nameRectX, nameRectY, nameRectW, nameRectH);
      ctx.fillStyle = '#0a2540';
      ctx.font = `normal ${Math.round(w * CERT_LAYOUT.name.canvasFontScale)}px 'Great Vibes', 'Brush Script MT', cursive`;
      ctx.textAlign = 'center';
      ctx.fillText(
        fields.studentName,
        nameRectX + nameRectW / 2,
        nameRectY + nameRectH / 2 + Math.round(w * CERT_LAYOUT.name.textYOffset),
        nameRectW * 0.96
      );

      // Course title
      const courseRectX = w * CERT_LAYOUT.course.left;
      const courseRectY = h * CERT_LAYOUT.course.top;
      const courseRectW = w * CERT_LAYOUT.course.width;
      const courseRectH = h * CERT_LAYOUT.course.height;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(courseRectX, courseRectY, courseRectW, courseRectH);
      ctx.fillStyle = '#0a2540';
      ctx.font = `bold ${Math.round(w * CERT_LAYOUT.course.canvasFontScale)}px Georgia, serif`;
      ctx.fillText(
        fields.courseTitle.toUpperCase(),
        courseRectX + courseRectW / 2,
        courseRectY + courseRectH / 2 + Math.round(w * CERT_LAYOUT.course.textYOffset),
        courseRectW * 0.96
      );

      // Date blanks (mask first, then draw text)
      const dateMaskTop = h * CERT_LAYOUT.date.top;
      const dateMaskH = h * CERT_LAYOUT.date.height;
      ctx.fillStyle = '#ffffff';

      // Day mask
      ctx.fillRect(
        w * CERT_LAYOUT.date.day.left,
        dateMaskTop,
        w * CERT_LAYOUT.date.day.width,
        dateMaskH
      );
      // Month mask
      ctx.fillRect(
        w * CERT_LAYOUT.date.month.left,
        dateMaskTop,
        w * CERT_LAYOUT.date.month.width,
        dateMaskH
      );
      // Year mask
      ctx.fillRect(
        w * CERT_LAYOUT.date.year.left,
        dateMaskTop,
        w * CERT_LAYOUT.date.year.width,
        dateMaskH
      );

      ctx.fillStyle = '#0a2540';
      ctx.font = `bold ${Math.round(w * CERT_LAYOUT.date.canvasFontScale)}px 'Great Vibes', 'Brush Script MT', cursive`;
      ctx.textAlign = 'center';
      const dateBaselineY = dateMaskTop + dateMaskH * 0.72;

      ctx.fillText(dayText, w * (CERT_LAYOUT.date.day.left + CERT_LAYOUT.date.day.width / 2), dateBaselineY);
      ctx.fillText(monthName, w * (CERT_LAYOUT.date.month.left + CERT_LAYOUT.date.month.width / 2), dateBaselineY);
      ctx.fillText(yearShort, w * (CERT_LAYOUT.date.year.left + CERT_LAYOUT.date.year.width / 2), dateBaselineY);

      // Draw Evaluation Summary Box on Canvas
      const boxW = w * CERT_LAYOUT.summary.width;
      const boxH = h * CERT_LAYOUT.summary.height;
      const boxX = w * CERT_LAYOUT.summary.left;
      const boxY = h * CERT_LAYOUT.summary.top;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
      ctx.strokeStyle = '#c9a227';
      ctx.lineWidth = Math.round(w * 0.0015);
      
      // Simple rect fallback if roundRect unsupported
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, 8);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.strokeRect(boxX, boxY, boxW, boxH);
      }

      ctx.fillStyle = '#c9a227';
      ctx.font = `bold ${Math.round(w * 0.012)}px sans-serif`;
      ctx.textAlign = 'left';
      ctx.fillText('EVALUATION BREAKDOWN', boxX + 15, boxY + 22);

      ctx.fillStyle = '#0a2540';
      ctx.font = `${Math.round(w * 0.010)}px sans-serif`;

      const drawRow = (label, val, yOffset) => {
        ctx.textAlign = 'left';
        ctx.fillText(label, boxX + 15, boxY + yOffset);
        ctx.textAlign = 'right';
        ctx.fillText(val, boxX + boxW - 15, boxY + yOffset);
      };

      drawRow('Attendance (20):', fields.attendanceMarks.toFixed(1), 45);
      drawRow('Assignments (20):', fields.assignmentMarks.toFixed(1), 65);
      drawRow('Final MCQ (60):', fields.mcqMarks.toFixed(1), 85);

      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(boxX + 15, boxY + 95);
      ctx.lineTo(boxX + boxW - 15, boxY + 95);
      ctx.stroke();

      ctx.fillStyle = '#c9a227';
      ctx.font = `bold ${Math.round(w * 0.011)}px sans-serif`;
      drawRow('Total Score:', `${fields.finalMarks.toFixed(1)} / 100`, 112);

      // Certificate ID (bottom-left) - solid dark blue cover matching ribbon to hide placeholder
      const certIdRectX = w * CERT_LAYOUT.certificateId.left;
      const certIdRectY = h * CERT_LAYOUT.certificateId.top;
      const certIdRectW = w * CERT_LAYOUT.certificateId.width;
      const certIdRectH = h * CERT_LAYOUT.certificateId.height;
      ctx.fillStyle = '#0a2540';
      ctx.fillRect(certIdRectX, certIdRectY, certIdRectW, certIdRectH);
      ctx.fillStyle = '#c9a227';
      ctx.font = `bold ${Math.round(w * CERT_LAYOUT.certificateId.canvasFontScale)}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(fields.certificateId, certIdRectX + certIdRectW / 2, certIdRectY + certIdRectH / 2 + Math.round(w * 0.005));

      // Generate and load QR code client-side using the local qrcode package
      const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, scale: 6 });
      const qrImg = new Image();
      await new Promise((resolve) => {
        qrImg.onload = resolve;
        qrImg.onerror = resolve;
        qrImg.src = qrDataUrl;
      });

      const qrSize = w * CERT_LAYOUT.qr.width;
      const qrX = w * (1 - CERT_LAYOUT.qr.right - CERT_LAYOUT.qr.width);
      const qrY = h * (1 - CERT_LAYOUT.qr.bottom) - qrSize;

      if (qrImg.complete && qrImg.naturalWidth > 0) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(qrX, qrY, qrSize, qrSize);
        ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
      } else {
        // Fallback placeholder
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(qrX, qrY, qrSize, qrSize);
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.strokeRect(qrX, qrY, qrSize, qrSize);
        ctx.fillStyle = '#94a3b8';
        ctx.font = `${Math.round(w * 0.012)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('QR', qrX + qrSize / 2, qrY + qrSize / 2 + 4);
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
