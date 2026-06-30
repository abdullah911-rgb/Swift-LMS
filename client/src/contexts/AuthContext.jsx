import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user profile on startup
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get('/auth/me');
        setUser(data.data.user);
      } catch (err) {
        console.error('Failed to restore auth session:', err);
        localStorage.removeItem('accessToken');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  // Login handler
  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      const { accessToken, user: loggedUser } = data.data;
      localStorage.setItem('accessToken', accessToken);
      setUser(loggedUser);
      toast.success(data.message || 'Login successful!');
      return loggedUser;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Login failed. Please check credentials.';
      toast.error(errMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Register handler
  const register = async (name, email, password, role) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', { name, email, password, role });
      toast.success(data.message || 'Registration successful! OTP sent.');
      return data.data;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Registration failed.';
      toast.error(errMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Verify Email (OTP) handler
  const verifyEmail = async (email, otp) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-email', { email, otp });
      toast.success(data.message || 'Email verified successfully!');
      if (data.data?.user) {
        // If login response isn't direct, prompt user to login
        setUser(data.data.user);
      }
      return data.data;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Verification failed.';
      toast.error(errMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP handler
  const resendOTP = async (email, purpose) => {
    try {
      const { data } = await api.post('/auth/resend-otp', { email, purpose });
      toast.success(data.message || 'OTP resent successfully!');
      return data;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to resend OTP.';
      toast.error(errMsg);
      throw err;
    }
  };

  // Logout handler
  const logout = async () => {
    setLoading(true);
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout request failed:', err);
    } finally {
      localStorage.removeItem('accessToken');
      setUser(null);
      setLoading(false);
      toast.success('Logged out successfully.');
    }
  };

  // Forgot password helper
  const forgotPassword = async (email) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      toast.success(data.message || 'Password reset OTP sent.');
      return data;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Error occurred.';
      toast.error(errMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Reset password helper
  const resetPassword = async (email, otp, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/reset-password', { email, otp, password });
      toast.success(data.message || 'Password reset successfully!');
      return data;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Reset password failed.';
      toast.error(errMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    verifyEmail,
    resendOTP,
    logout,
    forgotPassword,
    resetPassword,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
