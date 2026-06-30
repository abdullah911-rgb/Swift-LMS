import React from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../constants';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const ResetPasswordPage = () => {
  const { resetPassword, resendOTP } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get('email') || '';

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      email: emailParam
    }
  });

  const onSubmit = async (data) => {
    try {
      await resetPassword(data.email, data.otp, data.password);
      navigate(ROUTES.LOGIN);
    } catch (err) {
      // Handled
    }
  };

  const handleResend = async (email) => {
    if (!email) return;
    try {
      await resendOTP(email, 'PASSWORD_RESET');
    } catch (err) {
      // Handled
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
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 leading-tight">Reset Password</h1>
          <p className="text-xs sm:text-sm text-slate-500">Provide the OTP and choose a new password.</p>
        </div>

        {/* Card Form */}
        <Card hover={false} className="border border-slate-100 p-8 bg-white">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="name@company.com"
              required={true}
              error={errors.email?.message}
              {...register('email', { 
                required: 'Email is required',
                pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' }
              })}
            />

            <Input
              label="OTP Verification Code"
              placeholder="123456"
              required={true}
              maxLength={6}
              error={errors.otp?.message}
              {...register('otp', { 
                required: 'OTP is required',
                minLength: { value: 6, message: 'OTP must be 6 digits' }
              })}
            />

            <Input
              label="New Password"
              type="password"
              placeholder="••••••••"
              required={true}
              error={errors.password?.message}
              helperText="Min 8 chars, 1 uppercase, 1 lowercase and 1 number."
              {...register('password', { 
                required: 'Password is required',
                minLength: { value: 8, message: 'Must be at least 8 characters' },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                  message: 'Must contain uppercase, lowercase, and a number'
                }
              })}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isSubmitting}
            >
              Reset Password
            </Button>
          </form>

          <div className="text-center mt-5">
            <button
              type="button"
              onClick={() => handleResend(emailParam)}
              className="text-xs text-primary-600 hover:text-primary-700 font-semibold cursor-pointer"
            >
              Resend OTP Code
            </button>
          </div>
        </Card>

      </div>
    </div>
  );
};

export default ResetPasswordPage;
