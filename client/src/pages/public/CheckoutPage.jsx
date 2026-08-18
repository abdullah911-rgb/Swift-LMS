import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { ROUTES } from '../../constants';
import { getImageUrl } from '../../constants/index';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  IoPersonOutline,
  IoCardOutline,
  IoCalendarOutline,
  IoHomeOutline,
  IoLockClosedOutline,
  IoArrowForwardOutline,
  IoArrowBackOutline,
  IoCheckmarkCircleOutline,
  IoSchoolOutline,
  IoTimeOutline,
  IoRibbonOutline,
  IoGlobeOutline,
  IoAlertCircleOutline,
} from 'react-icons/io5';

const inputBase =
  'w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-400 focus:bg-white transition-all duration-200';

const fieldVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, delay: i * 0.06, ease: 'easeOut' },
  }),
};

export default function CheckoutPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    fullName: user?.name || '',
    fatherName: '',
    cnic: '',
    dob: '',
    address: '',
    portalPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        // courseId may be a UUID (from handleEnroll) or a slug — try both
        const res = await api.get(`/courses/${courseId}`);
        setCourse(res.data?.data?.course || res.data?.data);
      } catch {
        toast.error('Could not load course details.');
        navigate(ROUTES.COURSES);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [courseId, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear error on change
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  // Format CNIC as 00000-0000000-0
  const handleCnicChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 13) val = val.slice(0, 13);
    let formatted = val;
    if (val.length > 5 && val.length <= 12) {
      formatted = `${val.slice(0, 5)}-${val.slice(5)}`;
    } else if (val.length === 13) {
      formatted = `${val.slice(0, 5)}-${val.slice(5, 12)}-${val.slice(12)}`;
    }
    setForm((prev) => ({ ...prev, cnic: formatted }));
    if (errors.cnic) setErrors((prev) => ({ ...prev, cnic: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = 'Full name is required.';
    if (!form.fatherName.trim()) errs.fatherName = "Father's name is required.";

    const rawCnic = form.cnic.replace(/-/g, '');
    if (!rawCnic || rawCnic.length !== 13) errs.cnic = 'Enter a valid 13-digit CNIC.';

    if (!form.dob) errs.dob = 'Date of birth is required.';

    if (!form.address.trim()) errs.address = 'Address is required.';
    else if (form.address.trim().length < 10) errs.address = 'Please enter a complete address.';

    if (!form.portalPassword) errs.portalPassword = 'Portal password is required.';
    else if (form.portalPassword.length < 6) errs.portalPassword = 'Password must be at least 6 characters.';

    if (!form.confirmPassword) errs.confirmPassword = 'Please confirm your password.';
    else if (form.portalPassword !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match.';

    return errs;
  };

  const handleProceed = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast.error('Please fix the errors in the form before proceeding.');
      return;
    }

    setSubmitting(true);
    try {
      // If user is not logged in, redirect to login with checkout as the return path
      if (!user) {
        toast('Please sign in to continue to payment.', { icon: 'ℹ️' });
        navigate(ROUTES.LOGIN, { state: { from: { pathname: `/checkout/${courseId}` } } });
        return;
      }

      // Store form data in sessionStorage so PaymentPage can optionally read it
      sessionStorage.setItem(
        `checkout_info_${courseId}`,
        JSON.stringify({
          fullName: form.fullName,
          fatherName: form.fatherName,
          cnic: form.cnic,
          dob: form.dob,
          address: form.address,
        })
      );

      toast.success('Information saved! Proceeding to payment…');
      navigate(`/student/pay/${courseId}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  const fields = [
    {
      id: 'fullName',
      label: 'Full Name',
      placeholder: 'Enter your full legal name',
      icon: <IoPersonOutline size={18} />,
      type: 'text',
      required: true,
      autoComplete: 'name',
    },
    {
      id: 'fatherName',
      label: "Father's Name",
      placeholder: "Enter your father's full name",
      icon: <IoPersonOutline size={18} />,
      type: 'text',
      required: true,
      autoComplete: 'off',
    },
    {
      id: 'dob',
      label: 'Date of Birth',
      placeholder: '',
      icon: <IoCalendarOutline size={18} />,
      type: 'date',
      required: true,
      autoComplete: 'bday',
    },
    {
      id: 'address',
      label: 'Complete Address',
      placeholder: 'House No., Street, City, Province',
      icon: <IoHomeOutline size={18} />,
      type: 'textarea',
      required: true,
      autoComplete: 'street-address',
    },
    {
      id: 'portalPassword',
      label: 'Portal Account Password',
      placeholder: 'Enter your portal password',
      icon: <IoLockClosedOutline size={18} />,
      type: 'password',
      required: true,
      autoComplete: 'current-password',
      hint: 'This confirms your identity. We do not store this separately.',
    },
    {
      id: 'confirmPassword',
      label: 'Confirm Password',
      placeholder: 'Re-enter your portal password',
      icon: <IoLockClosedOutline size={18} />,
      type: 'password',
      required: true,
      autoComplete: 'current-password',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50/30 to-slate-100 py-12 px-4 font-sans">
      <div className="max-w-5xl mx-auto">

        {/* Back Link */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary-700 font-semibold mb-8 transition-colors group"
        >
          <IoArrowBackOutline className="group-hover:-translate-x-1 transition-transform" size={18} />
          Back to Course
        </button>

        {/* Progress Breadcrumb */}
        <div className="flex items-center gap-2 mb-10">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary-600 text-white text-xs font-bold">
            <span className="h-5 w-5 rounded-full bg-white text-primary-700 flex items-center justify-center font-extrabold text-[10px]">1</span>
            Student Info
          </div>
          <div className="h-0.5 w-8 bg-slate-200 rounded-full" />
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 text-slate-400 text-xs font-bold">
            <span className="h-5 w-5 rounded-full bg-slate-300 text-white flex items-center justify-center font-extrabold text-[10px]">2</span>
            Payment
          </div>
          <div className="h-0.5 w-8 bg-slate-200 rounded-full" />
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 text-slate-400 text-xs font-bold">
            <span className="h-5 w-5 rounded-full bg-slate-300 text-white flex items-center justify-center font-extrabold text-[10px]">3</span>
            Confirmation
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT — Student Info Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-7"
          >
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              {/* Form Header */}
              <div className="bg-gradient-to-r from-primary-700 to-primary-800 px-8 py-6 text-white">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-white/15 flex items-center justify-center">
                    <IoSchoolOutline size={22} />
                  </div>
                  <div>
                    <h1 className="text-lg font-heading font-extrabold leading-tight">Student Information</h1>
                    <p className="text-primary-200 text-xs mt-0.5">Fill in your details to proceed to payment</p>
                  </div>
                </div>
              </div>

              {/* CNIC Field (separate due to custom formatting) */}
              <form onSubmit={handleProceed} className="p-8 space-y-5">
                {fields.map((field, i) => (
                  <motion.div
                    key={field.id}
                    custom={i}
                    initial="hidden"
                    animate="visible"
                    variants={fieldVariants}
                    className="space-y-1.5"
                  >
                    <label htmlFor={field.id} className="flex items-center gap-1.5 text-xs font-bold text-slate-700 tracking-wide">
                      <span className="text-slate-400">{field.icon}</span>
                      {field.label}
                      {field.required && <span className="text-red-500">*</span>}
                    </label>

                    {field.type === 'textarea' ? (
                      <textarea
                        id={field.id}
                        name={field.id}
                        rows={3}
                        placeholder={field.placeholder}
                        value={form[field.id]}
                        onChange={handleChange}
                        autoComplete={field.autoComplete}
                        className={`${inputBase} resize-none`}
                      />
                    ) : (
                      <input
                        id={field.id}
                        name={field.id}
                        type={field.type}
                        placeholder={field.placeholder}
                        value={form[field.id]}
                        onChange={handleChange}
                        autoComplete={field.autoComplete}
                        max={field.id === 'dob' ? new Date().toISOString().split('T')[0] : undefined}
                        className={inputBase}
                      />
                    )}

                    {field.hint && !errors[field.id] && (
                      <p className="text-[11px] text-slate-400 flex items-center gap-1">
                        <IoAlertCircleOutline size={12} /> {field.hint}
                      </p>
                    )}

                    {errors[field.id] && (
                      <p className="text-[11px] text-red-500 font-semibold flex items-center gap-1">
                        <IoAlertCircleOutline size={12} /> {errors[field.id]}
                      </p>
                    )}
                  </motion.div>
                ))}

                {/* CNIC Field */}
                <motion.div custom={fields.length} initial="hidden" animate="visible" variants={fieldVariants} className="space-y-1.5">
                  <label htmlFor="cnic" className="flex items-center gap-1.5 text-xs font-bold text-slate-700 tracking-wide">
                    <span className="text-slate-400"><IoCardOutline size={18} /></span>
                    CNIC Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="cnic"
                    name="cnic"
                    type="text"
                    placeholder="00000-0000000-0"
                    value={form.cnic}
                    onChange={handleCnicChange}
                    maxLength={15}
                    className={`${inputBase} font-mono tracking-widest`}
                    autoComplete="off"
                  />
                  {errors.cnic && (
                    <p className="text-[11px] text-red-500 font-semibold flex items-center gap-1">
                      <IoAlertCircleOutline size={12} /> {errors.cnic}
                    </p>
                  )}
                </motion.div>

                {/* Info note */}
                <div className="rounded-2xl bg-blue-50 border border-blue-100 px-5 py-4 flex items-start gap-3">
                  <IoAlertCircleOutline size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-700 leading-relaxed">
                    Your information is used to issue a personalised certificate and for enrollment verification only. It is stored securely and never shared with third parties.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-gradient-to-r from-primary-700 to-primary-600 hover:from-primary-800 hover:to-primary-700 text-white font-heading font-bold text-base shadow-lg shadow-primary-900/20 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                >
                  {submitting ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      Proceed to Payment
                      <IoArrowForwardOutline size={18} />
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>

          {/* RIGHT — Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-5 lg:sticky lg:top-24 space-y-5"
          >
            {/* Course Card */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="aspect-video w-full overflow-hidden bg-slate-100">
                {course?.thumbnail ? (
                  <img
                    src={getImageUrl(course.thumbnail)}
                    alt={course?.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-700 to-primary-500 text-white font-heading font-extrabold text-xl">
                    Swift
                  </div>
                )}
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <span className="text-[10px] font-bold text-primary-600 uppercase tracking-wider">
                    {course?.category?.name || 'Course'}
                  </span>
                  <h2 className="text-base font-heading font-extrabold text-slate-900 mt-0.5 leading-snug">
                    {course?.title}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
                    {course?.shortDescription || course?.description}
                  </p>
                </div>

                {/* Meta */}
                <div className="flex flex-wrap gap-3 text-xs text-slate-500 font-semibold border-t border-slate-50 pt-4">
                  <span className="flex items-center gap-1.5">
                    <IoTimeOutline size={14} />
                    {course?.durationInMonths ? `${course.durationInMonths} Months` : course?.duration ? `${Math.round(course.duration / 60)} Hrs` : '—'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <IoGlobeOutline size={14} />
                    {course?.language ? `${course.language} & Urdu` : 'English & Urdu'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <IoRibbonOutline size={14} />
                    {course?.certificate ? 'Certificate' : 'No Certificate'}
                  </span>
                </div>

                {/* Price */}
                <div className="rounded-2xl bg-gradient-to-br from-primary-800 to-primary-900 text-white p-5 text-center">
                  <p className="text-xs font-bold uppercase tracking-widest text-primary-300 mb-1">Total Amount</p>
                  <p className="text-3xl font-heading font-extrabold">
                    {course?.isFree ? 'Free' : `PKR ${Number(course?.price || 0).toLocaleString()}`}
                  </p>
                  <p className="text-xs text-primary-300 mt-1">One-time payment · Lifetime access</p>
                </div>
              </div>
            </div>

            {/* Checklist */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">What You Get</h3>
              {[
                'Full Lifetime Access',
                'Live Zoom Interactive Sessions',
                'Downloadable Course Materials',
                'Verified Certificate on Completion',
                'Priority Instructor Support',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <IoCheckmarkCircleOutline size={18} className="text-emerald-500 flex-shrink-0" />
                  <span className="text-xs text-slate-600 font-medium">{item}</span>
                </div>
              ))}
            </div>

            {/* Security badge */}
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400 font-medium">
              <IoLockClosedOutline size={14} />
              Secure Checkout · Your data is encrypted
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
