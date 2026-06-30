import React from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../constants';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const ForgotPasswordPage = () => {
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    try {
      await forgotPassword(data.email);
      // Navigate to reset page with email pre-filled
      navigate(`/reset-password?email=${encodeURIComponent(data.email)}`);
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
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 leading-tight">Recover Password</h1>
          <p className="text-xs sm:text-sm text-slate-500">Enter your email and we'll send a password recovery OTP code.</p>
        </div>

        {/* Card Form */}
        <Card hover={false} className="border border-slate-100 p-8 bg-white">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isSubmitting}
            >
              Send OTP Code
            </Button>
          </form>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500">
          Remember password?{' '}
          <Link to={ROUTES.LOGIN} className="text-primary-600 hover:text-primary-700 font-semibold">
            Sign In
          </Link>
        </p>

      </div>
    </div>
  );
};

export default ForgotPasswordPage;
