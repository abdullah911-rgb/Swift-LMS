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
  const [step, setStep] = useState(1); // 1 = Details, 2 = Verify Email
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const { 
    register, 
    handleSubmit, 
    watch, 
    formState: { errors, isSubmitting } 
  } = useForm({
    defaultValues: {
      role: 'STUDENT'
    }
  });

  const { 
    register: registerOtp, 
    handleSubmit: handleOtpSubmit, 
    formState: { errors: otpErrors, isSubmitting: isOtpSubmitting } 
  } = useForm();

  const onRegisterSubmit = async (data) => {
    try {
      await registerUser(data.name, data.email, data.password, data.role);
      setUserEmail(data.email);
      setStep(2);
    } catch (err) {
      // Handled by AuthContext toast notifications
    }
  };

  const onVerifySubmit = async (data) => {
    try {
      await verifyEmail(userEmail, data.otp);
      navigate(ROUTES.LOGIN);
    } catch (err) {
      // Handled by AuthContext
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      await resendOTP(userEmail, 'EMAIL_VERIFICATION');
    } catch (err) {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-16 sm:py-24 bg-slate-50/30 flex items-center justify-center font-sans px-4">
      <div className="w-full max-w-md space-y-6">
        
        {/* Logo and Intro */}
        <div className="text-center space-y-2">
          <Link to={ROUTES.HOME} className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary-600 to-primary-400 text-white font-heading font-bold text-2xl shadow-md shadow-primary-500/20">
            L
          </Link>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 leading-tight">
            {step === 1 ? 'Create Account' : 'Verify Your Email'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            {step === 1 
              ? 'Join our premium learning SaaS portal today.' 
              : `Enter the 6-digit OTP code sent to ${userEmail}`
            }
          </p>
        </div>

        {/* Step 1: Info Form */}
        {step === 1 && (
          <>
            <Card hover={false} className="border border-slate-100 p-8 bg-white">
              <form onSubmit={handleSubmit(onRegisterSubmit)} className="space-y-4">
                <Input
                  label="Full Name"
                  placeholder="John Smith"
                  required={true}
                  error={errors.name?.message}
                  {...register('name', { required: 'Name is required' })}
                />

                <Input
                  label="Email Address"
                  type="email"
                  placeholder="john@company.com"
                  required={true}
                  error={errors.email?.message}
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' }
                  })}
                />

                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  required={true}
                  error={errors.password?.message}
                  helperText="Minimum 8 characters with at least 1 uppercase letter and 1 number."
                  {...register('password', { 
                    required: 'Password is required',
                    minLength: { value: 8, message: 'Must be at least 8 characters' },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                      message: 'Password must contain uppercase, lowercase, and a number'
                    }
                  })}
                />

                {/* Role select */}
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="text-xs font-semibold text-slate-700 tracking-wide">Register As</label>
                  <select
                    className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 hover:border-slate-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 rounded-lg transition-all duration-200 outline-none text-slate-800 font-sans"
                    {...register('role')}
                  >
                    <option value="STUDENT">Student</option>
                    <option value="INSTRUCTOR">Instructor</option>
                  </select>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full pt-1"
                  isLoading={isSubmitting}
                >
                  Create Account
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

        {/* Step 2: Verification */}
        {step === 2 && (
          <>
            <Card hover={false} className="border border-slate-100 p-8 bg-white">
              <form onSubmit={handleOtpSubmit(onVerifySubmit)} className="space-y-5">
                <Input
                  label="Enter OTP Code"
                  placeholder="123456"
                  required={true}
                  error={otpErrors.otp?.message}
                  maxLength={6}
                  {...register('otp', { 
                    required: 'OTP is required',
                    minLength: { value: 6, message: 'OTP must be 6 digits' },
                    pattern: { value: /^[0-9]+$/, message: 'OTP must contain only numbers' }
                  })}
                />

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  isLoading={isOtpSubmitting}
                >
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
