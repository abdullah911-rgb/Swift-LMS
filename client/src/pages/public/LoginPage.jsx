import React from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../constants';
import { getPostLoginPath } from '../../utils/authRedirect';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const from = location.state?.from?.pathname || null;

  const onSubmit = async (data) => {
    try {
      const user = await login(data.email, data.password);
      const destination = getPostLoginPath(user.role, from);
      navigate(destination, { replace: true, state: null });
    } catch (err) {
      // Handled by AuthContext toast notification
    }
  };

  return (
    <div className="py-16 sm:py-24 bg-slate-50/30 flex items-center justify-center font-sans px-4">
      <div className="w-full max-w-md space-y-6">
        
        {/* Logo and Intro */}
        <div className="text-center space-y-3">
          <Link to={ROUTES.HOME} className="inline-block">
            <img src="/Logo1.jpeg" alt="Swift Logo" className="h-16 w-16 mx-auto object-contain rounded-2xl" />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 leading-tight">Welcome Back</h1>
          <p className="text-xs sm:text-sm text-slate-500">Sign in to resume tracking your progress modules.</p>
        </div>

        {/* Card Form */}
        <Card hover={false} className="border border-slate-100 p-8 bg-white">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Email Address"
              type="email"
              placeholder="yourmail@email.com"
              required={true}
              error={errors.email?.message}
              {...register('email', { 
                required: 'Email is required',
                pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' }
              })}
            />

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 tracking-wide">Password <span className="text-red-500">*</span></label>
                <Link to={ROUTES.FORGOT_PASSWORD} className="text-xs text-primary-600 hover:text-primary-700 font-semibold">
                  Forgot Password?
                </Link>
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                error={errors.password?.message}
                {...register('password', { required: 'Password is required' })}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isSubmitting}
            >
              Sign In
            </Button>
          </form>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500">
          Don't have an account?{' '}
          <Link to={ROUTES.REGISTER} className="text-primary-600 hover:text-primary-700 font-semibold">
            Create Account
          </Link>
        </p>

      </div>
    </div>
  );
};

export default LoginPage;
