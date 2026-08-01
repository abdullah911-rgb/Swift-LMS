import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { certificateService } from '../../services/portalService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IoCheckmarkCircleOutline,
  IoAlertCircleOutline,
  IoRibbonOutline,
  IoCalendarOutline,
  IoPersonOutline,
  IoSchoolOutline,
  IoSearchOutline,
  IoQrCodeOutline,
  IoCameraOutline,
  IoCloudUploadOutline,
  IoCloseOutline,
  IoDocumentTextOutline,
  IoShieldCheckmarkOutline,
  IoArrowBackOutline,
  IoTimeOutline
} from 'react-icons/io5';

// Dynamic load helper for jsQR
const loadJsQR = () => {
  return new Promise((resolve, reject) => {
    if (window.jsQR) return resolve(window.jsQR);
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
    script.async = true;
    script.onload = () => resolve(window.jsQR);
    script.onerror = () => reject(new Error('Failed to load QR scanner library'));
    document.head.appendChild(script);
  });
};

export default function VerifyCertificate() {
  const { code } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [cert, setCert] = useState(null);
  const [error, setError] = useState(null);
  const [searchId, setSearchId] = useState('');

  // Scanning tabs / controls
  const [activeTab, setActiveTab] = useState('ID'); // 'ID', 'QR'
  const [scanning, setScanning] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const scanningRef = useRef(false);

  // Sync scanning state ref to avoid closure issues in loops
  useEffect(() => {
    scanningRef.current = scanning;
  }, [scanning]);

  // Fetch certificate details if code parameter exists in URL
  const fetchVerification = async (verifyCode) => {
    setLoading(true);
    setError(null);
    try {
      const res = await certificateService.verifyCertificate(verifyCode);
      setCert(res.data?.data?.certificate || null);
    } catch (err) {
      setCert(null);
      setError(err.response?.data?.message || 'Certificate verification failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (code) {
      fetchVerification(code);
    } else {
      setCert(null);
      setError(null);
    }
    return () => {
      stopWebcam();
    };
  }, [code]);

  // Handle manual submit by ID
  const handleVerifySubmit = (e) => {
    e.preventDefault();
    if (!searchId.trim()) {
      toast.error('Please enter a Certificate ID or verification code.');
      return;
    }
    navigate(`/verify/${searchId.trim()}`);
  };

  // Extract verification code or Certificate ID from QR string
  const handleScannedData = (dataString) => {
    let parsedCode = dataString.trim();
    
    // Parse out verification code if it's a URL
    if (parsedCode.includes('/verify/')) {
      const parts = parsedCode.split('/verify/');
      parsedCode = parts[parts.length - 1];
    }
    
    if (parsedCode) {
      toast.success('QR Code detected! Retrieving registry details...');
      navigate(`/verify/${parsedCode}`);
    } else {
      toast.error('Scanned QR data appears to be invalid.');
    }
  };

  // Webcam scanning start/stop
  const startWebcam = async () => {
    setScanning(true);
    try {
      let stream;
      try {
        // Attempt back camera / rear camera on mobile
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
      } catch (envErr) {
        // Fallback to any available video feed
        stream = await navigator.mediaDevices.getUserMedia({
          video: true
        });
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('muted', 'true');
        videoRef.current.setAttribute('autoplay', 'true');
        
        // Mobile browsers require play() inside a promise catch to handle autoplay policy blocks
        videoRef.current.play().catch(e => {
          console.warn("Camera play start got suspended", e);
        });
        
        requestAnimationFrame(scanFrame);
      }
    } catch (err) {
      setScanning(false);
      toast.error('Unable to access webcam. Please verify device permissions.');
    }
  };


  const stopWebcam = () => {
    setScanning(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const scanFrame = async () => {
    if (!scanningRef.current) return;

    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const video = videoRef.current;
      const canvas = canvasRef.current || document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      try {
        const jsQR = await loadJsQR();
        const codeResult = jsQR(imageData.data, imageData.width, imageData.height);
        if (codeResult) {
          stopWebcam();
          handleScannedData(codeResult.data);
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }
    
    if (scanningRef.current) {
      requestAnimationFrame(scanFrame);
    }
  };

  // Image upload parsing helper
  const handleImageFile = async (file) => {
    if (!file) return;
    setUploadFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        try {
          const jsQR = await loadJsQR();
          const codeResult = jsQR(imageData.data, imageData.width, imageData.height);
          if (codeResult) {
            handleScannedData(codeResult.data);
          } else {
            toast.error('No valid QR code detected in this image. Please upload a clearer capture.');
            setUploadFileName('');
          }
        } catch (err) {
          toast.error('Failed to analyze verification image.');
          setUploadFileName('');
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-[85vh] bg-slate-50/50 py-12 px-4 sm:px-6 font-sans">
      <div className="max-w-xl mx-auto space-y-6">
        
        {/* Verification View Panel */}
        {code ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Card hover={false} className="bg-white border border-slate-100 p-6 sm:p-8 rounded-3xl shadow-xl space-y-6 relative overflow-hidden">
              
              {/* Back to main Verification portal button */}
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <Link
                  to="/verify-certificate"
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-primary-700 transition-colors"
                >
                  <IoArrowBackOutline size={16} />
                  <span>Verification Registry</span>
                </Link>
                <div className="flex items-center gap-1">
                  <img
                    src="/Logo1.jpeg"
                    alt="SWIFT logo"
                    className="h-8 object-contain bg-white rounded p-0.5"
                  />
                  <span className="text-[10px] font-extrabold text-primary-900 tracking-wider uppercase">SWIFT</span>
                </div>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-4">
                  <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-primary-600"></div>
                  <p className="text-xs text-slate-400 font-semibold tracking-wider">Querying credentials registry...</p>
                </div>
              ) : error ? (
                <div className="text-center py-10 space-y-6">
                  <div className="h-14 w-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <IoAlertCircleOutline size={32} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-base font-extrabold text-slate-800">Verification Failure</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                      {error} Please confirm the Certificate ID or scan code matches a valid issued completion document.
                    </p>
                  </div>
                  <div className="pt-2">
                    <Link to="/verify-certificate">
                      <Button variant="primary" size="sm">Search Another Credential</Button>
                    </Link>
                  </div>
                </div>
              ) : cert ? (
                <div className="space-y-6">
                  {/* Verified Success Badge */}
                  <div className="bg-emerald-50/70 border border-emerald-100/80 rounded-2xl p-5 flex gap-4 text-emerald-950 items-start shadow-xs">
                    <div className="shrink-0 mt-0.5 p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                      <IoShieldCheckmarkOutline size={22} />
                    </div>
                    <div>
                      <p className="text-xs font-black tracking-wide uppercase text-emerald-800">Verified Authentic</p>
                      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed m-0 font-medium">
                        This completion certificate is officially issued by **SWIFT Institute of Safety & Technology**. The registry matches a validated graduate database record.
                      </p>
                    </div>
                  </div>

                  {/* Registry Details */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-50 m-0">
                      Graduate Credential Details
                    </h4>

                    <div className="grid grid-cols-3 gap-y-4 text-xs font-semibold">
                      <div className="col-span-1 text-slate-400 flex items-center gap-1.5">
                        <IoPersonOutline size={14} />
                        <span>Student:</span>
                      </div>
                      <div className="col-span-2 text-slate-800 font-extrabold">
                        {cert.studentName}
                      </div>

                      {cert.fatherName && (
                        <>
                          <div className="col-span-1 text-slate-400">Father's Name:</div>
                          <div className="col-span-2 text-slate-800 font-extrabold">
                            {cert.fatherName}
                          </div>
                        </>
                      )}

                      {cert.cnic && (
                        <>
                          <div className="col-span-1 text-slate-400">CNIC:</div>
                          <div className="col-span-2 text-slate-800 font-mono font-bold">
                            {cert.cnic}
                          </div>
                        </>
                      )}

                      <div className="col-span-1 text-slate-400 flex items-center gap-1.5">
                        <IoSchoolOutline size={14} />
                        <span>Course:</span>
                      </div>
                      <div className="col-span-2 text-slate-800 font-extrabold">
                        {cert.courseTitle}
                      </div>

                      <div className="col-span-1 text-slate-400">Instructor:</div>
                      <div className="col-span-2 text-slate-800 font-extrabold">
                        {cert.instructorName}
                      </div>

                      <div className="col-span-1 text-slate-400">Validity:</div>
                      <div className="col-span-2 text-slate-800 font-extrabold flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-emerald-700 uppercase tracking-wide">Valid / Authentic</span>
                      </div>

                      <div className="col-span-1 text-slate-400">Certificate ID:</div>
                      <div className="col-span-2 text-slate-900 font-mono font-bold tracking-wider text-sm select-all">
                        {cert.certificateId}
                      </div>


                      <div className="col-span-1 text-slate-400 flex items-center gap-1.5">
                        <IoCalendarOutline size={14} />
                        <span>Issued On:</span>
                      </div>
                      <div className="col-span-2 text-slate-800 font-extrabold">
                        {new Date(cert.issuedAt).toLocaleDateString('en-PK', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Evaluation Marks Breakdown */}
                  <div className="space-y-4 pt-2">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-50 m-0">
                      Performance Evaluation breakdown
                    </h4>

                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      <div className="p-3 border border-slate-100 bg-slate-50/50 rounded-2xl">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Attendance</span>
                        <span className="font-extrabold text-slate-700 block mt-1">
                          {cert.attendanceMarks.toFixed(1)}/20
                        </span>
                      </div>
                      <div className="p-3 border border-slate-100 bg-slate-50/50 rounded-2xl">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Assignments</span>
                        <span className="font-extrabold text-slate-700 block mt-1">
                          {cert.assignmentMarks.toFixed(1)}/20
                        </span>
                      </div>
                      <div className="p-3 border border-slate-100 bg-slate-50/50 rounded-2xl">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Final Quiz</span>
                        <span className="font-extrabold text-slate-700 block mt-1">
                          {cert.mcqMarks.toFixed(1)}/60
                        </span>
                      </div>
                      <div className="p-3 border border-primary-100 bg-primary-50/20 rounded-2xl">
                        <span className="text-[9px] font-bold text-primary-500 uppercase block">Final Score</span>
                        <span className="font-extrabold text-primary-700 block mt-1">
                          {cert.finalMarks.toFixed(1)}/100
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Registry Verification code */}
                  <div className="pt-6 border-t border-slate-100 text-center text-[10px] text-slate-400 font-medium space-y-1">
                    <p className="m-0 font-mono">Verification Code: {cert.verificationCode}</p>
                    <p className="m-0">Verified successfully via SWIFT Credential Authenticity Registry Node.</p>
                  </div>
                </div>
              ) : null}

              {/* Background Verification Seal Watermark */}
              {cert && !loading && (
                <div className="absolute right-[-15px] bottom-[-15px] text-emerald-500/5 rotate-[-25deg] select-none pointer-events-none">
                  <IoShieldCheckmarkOutline size={180} />
                </div>
              )}
            </Card>
          </motion.div>
        ) : (
          /* Main Form/Portal Search Screen */
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            {/* Header Description */}
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-primary-950 font-heading">
                Certificate Verification Portal
              </h1>
              <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">
                Verify credential authenticity, matching graduate registry profiles, and academic transcripts in real-time.
              </p>
            </div>

            <Card hover={false} className="bg-white border border-slate-100 p-6 sm:p-8 rounded-3xl shadow-xl space-y-6">
              {/* Tab Selector */}
              <div className="flex border border-slate-100 bg-slate-50 p-1.5 rounded-2xl">
                <button
                  onClick={() => { stopWebcam(); setActiveTab('ID'); }}
                  className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    activeTab === 'ID'
                      ? 'bg-white text-primary-950 shadow-sm font-black'
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  <IoSearchOutline size={16} />
                  <span>Verify by ID / Hash</span>
                </button>
                <button
                  onClick={() => { setActiveTab('QR'); }}
                  className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    activeTab === 'QR'
                      ? 'bg-white text-primary-950 shadow-sm font-black'
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  <IoQrCodeOutline size={16} />
                  <span>Scan QR Code</span>
                </button>
              </div>

              {/* Tab Content 1: ID Input Form */}
              {activeTab === 'ID' && (
                <form onSubmit={handleVerifySubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">
                      Certificate ID or Verification Code
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={searchId}
                        onChange={(e) => setSearchId(e.target.value)}
                        placeholder="e.g., SST-2026-00000001"
                        className="w-full pl-4 pr-11 py-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 focus:outline-none focus:border-primary-600 focus:bg-white text-sm font-medium transition-all"
                      />
                      <button
                        type="submit"
                        className="absolute right-2 top-1.5 p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-colors cursor-pointer"
                      >
                        <IoSearchOutline size={18} />
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-400 block font-medium">
                      Enter the unique identifier code or verification code string printed on the certificate document.
                    </span>
                  </div>
                </form>
              )}

              {/* Tab Content 2: QR Scanner / Upload Area */}
              {activeTab === 'QR' && (
                <div className="space-y-5">
                  {scanning ? (
                    /* Webcam Camera Viewport */
                    <div className="relative border border-slate-150 rounded-2xl bg-black overflow-hidden aspect-video flex items-center justify-center">
                      <video
                        ref={videoRef}
                        className="w-full h-full object-cover"
                        playsInline
                        autoPlay
                        muted
                      />

                      {/* Scanning overlay guidelines */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-40 h-40 border-2 border-dashed border-primary-500 rounded-2xl relative shadow-md">
                          <div className="absolute top-0 left-0 w-full h-0.5 bg-primary-500 animate-[bounce_2s_infinite]"></div>
                        </div>
                      </div>
                      
                      {/* Stop webcam button */}
                      <button
                        onClick={stopWebcam}
                        className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/85 text-white rounded-full transition-colors cursor-pointer"
                      >
                        <IoCloseOutline size={20} />
                      </button>

                      <div className="absolute bottom-3 left-0 right-0 text-center">
                        <span className="text-[10px] bg-black/75 px-3 py-1 text-white font-bold rounded-full tracking-wider uppercase">
                          Align QR inside scanner box
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* Scanner Menu option */
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* Open camera card */}
                      <button
                        onClick={startWebcam}
                        className="p-6 border border-slate-100 bg-slate-50/50 hover:bg-primary-50/30 hover:border-primary-200 rounded-2xl text-center space-y-3 transition-all flex flex-col items-center justify-center cursor-pointer group"
                      >
                        <div className="p-3 bg-white text-slate-600 group-hover:text-primary-600 rounded-xl shadow-xs transition-colors">
                          <IoCameraOutline size={22} />
                        </div>
                        <div className="text-left text-center">
                          <h4 className="text-xs font-extrabold text-slate-800">Scan via Camera</h4>
                          <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                            Use device camera to instantly scan verification QR code.
                          </p>
                        </div>
                      </button>

                      {/* File upload drag-and-drop Card */}
                      <div
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleImageFile(e.dataTransfer.files?.[0]); }}
                        className={`p-6 border-2 border-dashed rounded-2xl text-center space-y-3 transition-all flex flex-col items-center justify-center cursor-pointer relative ${
                          dragOver
                            ? 'border-primary-600 bg-primary-50/50'
                            : 'border-slate-150 bg-slate-50/50 hover:bg-primary-50/30 hover:border-primary-200'
                        }`}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          id="qr-file-upload"
                          className="hidden"
                          onChange={(e) => handleImageFile(e.target.files?.[0])}
                        />
                        <label
                          htmlFor="qr-file-upload"
                          className="absolute inset-0 w-full h-full cursor-pointer"
                        />
                        <div className="p-3 bg-white text-slate-600 rounded-xl shadow-xs">
                          <IoCloudUploadOutline size={22} />
                        </div>
                        <div>
                          <h4 className="text-xs font-extrabold text-slate-800 truncate px-2">
                            {uploadFileName ? uploadFileName : 'Upload Image / Capture'}
                          </h4>
                          <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                            Drag & drop screenshot or click to parse code.
                          </p>
                        </div>
                      </div>

                    </div>
                  )}

                  <div className="text-center pt-2">
                    <span className="text-[10px] text-slate-400 font-semibold tracking-wide block leading-relaxed">
                      Unique QR codes are generated bottom-right on every issued SWIFT certificate. Scan using camera or upload screenshot to verify graduation credentials instantly.
                    </span>
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
