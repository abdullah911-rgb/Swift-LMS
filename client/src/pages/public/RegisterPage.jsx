import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../constants';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const RegisterPage = () => {
  const { register: registerUser, verifyEmail, resendOTP } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoError, setPhotoError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const {
    register: registerOtp,
    handleSubmit: handleOtpSubmit,
    formState: { errors: otpErrors, isSubmitting: isOtpSubmitting },
  } = useForm();

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    setPhotoError('');
    if (!file) {
      setPhotoFile(null);
      setPhotoPreview(null);
      return;
    }
    if (!file.type.startsWith('image/')) {
      setPhotoError('Please upload an image file (JPG, PNG, etc.).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Photo must be under 5MB.');
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const onRegisterSubmit = async (data) => {
    if (!photoFile) {
      setPhotoError('Profile photo is required.');
      return;
    }

    const formData = new FormData();
    formData.append('name', data.name.trim());
    formData.append('fatherName', data.fatherName.trim());
    formData.append('cnic', data.cnic.trim());
    formData.append('phone', data.phone.trim());
    formData.append('email', data.email.trim());
    formData.append('password', data.password);
    formData.append('dateOfBirth', data.dateOfBirth);
    formData.append('address', data.address.trim());
    formData.append('gender', data.gender);
    formData.append('qualification', data.qualification.trim());
    formData.append('profilePhoto', photoFile);

    try {
      await registerUser(formData);
      setUserEmail(data.email.trim());
      setStep(2);
    } catch {
      // Handled by AuthContext
    }
  };

  const onVerifySubmit = async (data) => {
    try {
      await verifyEmail(userEmail, data.otp);
      navigate(ROUTES.LOGIN);
    } catch {
      // Handled by AuthContext
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      await resendOTP(userEmail, 'EMAIL_VERIFICATION');
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  const selectClass =
    'w-full px-4 py-2.5 text-sm bg-white border border-slate-200 hover:border-slate-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 rounded-lg transition-all duration-200 outline-none text-slate-800 font-sans';

  return (
    <div className="py-12 sm:py-16 bg-slate-50/30 flex items-center justify-center font-sans px-4">
      <div className={`w-full space-y-6 ${step === 1 ? 'max-w-2xl' : 'max-w-md'}`}>

        <div className="text-center space-y-3">
          <Link to={ROUTES.HOME} className="inline-block">
            <img src="/Logo1.jpeg" alt="Swift Logo" className="h-16 w-16 mx-auto object-contain rounded-2xl" />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 leading-tight">
            {step === 1 ? 'Student Registration' : 'Verify Your Email'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            {step === 1
              ? 'Create your student account to enroll in courses at Swift Institute.'
              : `Enter the 6-digit OTP code sent to ${userEmail}`}
          </p>
        </div>

        {step === 1 && (
          <>
            <Card hover={false} className="border border-slate-100 p-6 sm:p-8 bg-white">
              <form onSubmit={handleSubmit(onRegisterSubmit)} className="space-y-4" encType="multipart/form-data">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    placeholder="Your full name"
                    required
                    error={errors.name?.message}
                    {...register('name', { required: 'Full name is required', minLength: { value: 2, message: 'Too short' } })}
                  />
                  <Input
                    label="Father's Name"
                    placeholder="Father's full name"
                    required
                    error={errors.fatherName?.message}
                    {...register('fatherName', { required: "Father's name is required", minLength: { value: 2, message: 'Too short' } })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="CNIC / National ID"
                    placeholder="12345-1234567-1"
                    required
                    error={errors.cnic?.message}
                    {...register('cnic', {
                      required: 'CNIC is required',
                      pattern: {
                        value: /^[0-9]{5}-?[0-9]{7}-?[0-9]{1}$|^[0-9]{13}$/,
                        message: 'Invalid CNIC format',
                      },
                    })}
                  />
                  <Input
                    label="Mobile Number"
                    type="tel"
                    placeholder="+92 300 0000000"
                    required
                    error={errors.phone?.message}
                    {...register('phone', {
                      required: 'Mobile number is required',
                      minLength: { value: 10, message: 'Enter a valid mobile number' },
                    })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="yourmail@email.com"
                    required
                    error={errors.email?.message}
                    {...register('email', {
                      required: 'Email is required',
                      pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' },
                    })}
                  />
                  <Input
                    label="Password"
                    type="password"
                    placeholder="••••••••"
                    required
                    error={errors.password?.message}
                    helperText="Min 8 chars, uppercase, lowercase & number."
                    {...register('password', {
                      required: 'Password is required',
                      minLength: { value: 8, message: 'Must be at least 8 characters' },
                      pattern: {
                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                        message: 'Must include uppercase, lowercase, and a number',
                      },
                    })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Date of Birth"
                    type="date"
                    required
                    error={errors.dateOfBirth?.message}
                    {...register('dateOfBirth', { required: 'Date of birth is required' })}
                  />
                  <div className="flex flex-col gap-1.5 w-full">
                    <label className="text-xs font-semibold text-slate-700 tracking-wide">
                      Gender <span className="text-red-500 ml-1">*</span>
                    </label>
                    <select
                      className={selectClass}
                      {...register('gender', { required: 'Gender is required' })}
                      defaultValue=""
                    >
                      <option value="" disabled>Select gender</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                    {errors.gender && <p className="text-xs text-red-500">{errors.gender.message}</p>}
                  </div>
                </div>

                <Input
                  label="Address"
                  placeholder="Full residential address"
                  required
                  error={errors.address?.message}
                  {...register('address', {
                    required: 'Address is required',
                    minLength: { value: 5, message: 'Please enter a complete address' },
                  })}
                />

                <Input
                  label="Qualification"
                  placeholder="e.g. Intermediate, Bachelor's, Diploma"
                  required
                  error={errors.qualification?.message}
                  {...register('qualification', { required: 'Qualification is required' })}
                />

                {/* Profile Photo */}
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="text-xs font-semibold text-slate-700 tracking-wide">
                    Profile Photo <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                      {photoPreview ? (
                        <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-[10px] text-slate-400 text-center px-1">No photo</span>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handlePhotoChange}
                      className="block w-fit text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"
                    />
                  </div>
                  {photoError && <p className="text-xs text-red-500">{photoError}</p>}
                </div>

                <Button type="submit" variant="primary" className="w-full mt-2" isLoading={isSubmitting}>
                  Create Student Account
                </Button>
              </form>
            </Card>

            <p className="text-center text-xs text-slate-500">
              Already have an account?{' '}
              <Link to={ROUTES.LOGIN} className="text-primary-600 hover:text-primary-700 font-semibold">
                Sign In
              </Link>
            </p>
          </>
        )}

        {step === 2 && (
          <>
            <Card hover={false} className="border border-slate-100 p-8 bg-white">
              <form onSubmit={handleOtpSubmit(onVerifySubmit)} className="space-y-5">
                <Input
                  label="Enter OTP Code"
                  placeholder="123456"
                  required
                  error={otpErrors.otp?.message}
                  maxLength={6}
                  {...registerOtp('otp', {
                    required: 'OTP is required',
                    minLength: { value: 6, message: 'OTP must be 6 digits' },
                    pattern: { value: /^[0-9]+$/, message: 'OTP must contain only numbers' },
                  })}
                />
                <Button type="submit" variant="primary" className="w-full" isLoading={isOtpSubmitting}>
                  Verify Account
                </Button>
              </form>
              <div className="text-center mt-6">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading}
                  className="text-xs text-primary-600 hover:text-primary-700 font-semibold cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Resend Verification Code'}
                </button>
              </div>
            </Card>
            <div className="text-center">
              <button
                onClick={() => setStep(1)}
                className="text-xs text-slate-500 hover:text-slate-700 font-medium cursor-pointer"
              >
                ← Back to Registration Details
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RegisterPage;
