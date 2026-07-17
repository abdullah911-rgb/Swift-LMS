import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { AUTH_SESSION_EXPIRED } from '../services/api';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_URL, ROUTES } from '../constants';

const AuthContext = createContext(null);

function isTransientError(err) {
  return !err.response || err.code === 'ECONNABORTED' || err.message === 'Network Error';
}

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [postLoginRole, setPostLoginRole] = useState(null);

  const clearPostLoginRole = useCallback(() => setPostLoginRole(null), []);

  const logout = useCallback(async (showToast = true) => {
    setLoading(true);
    setPostLoginRole(null);

    // Clear client-side session immediately to ensure instant logout in the UI
    localStorage.removeItem('accessToken');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);

    try {
      // Notify backend to remove the database token and clear cookie
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout request failed:', err);
    }

    navigate(ROUTES.HOME, { replace: true, state: null });
    setLoading(false);
    if (showToast) {
      toast.success('Logged out successfully.');
    }
  }, [navigate]);

  // Load user profile on startup — retry refresh before clearing session
  // Also enforces that the current URL is consistent with the restored user's role.
  useEffect(() => {
    const PORTAL_PREFIXES = {
      ADMIN: '/admin',
      INSTRUCTOR: '/instructor',
      STUDENT: '/student',
    };
    const PORTAL_HOMES = {
      ADMIN: '/admin/dashboard',
      INSTRUCTOR: '/instructor/dashboard',
      STUDENT: '/student/dashboard',
    };

    const fetchUser = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get('/auth/me');
        const restoredUser = data.data.user;
        setUser(restoredUser);

        // After restoring the session, check if current path belongs to the right portal.
        // If not, silently redirect so the user always lands on their own portal.
        const currentPath = window.location.pathname;
        const ownPrefix = PORTAL_PREFIXES[restoredUser.role];
        const otherPrefixes = Object.entries(PORTAL_PREFIXES)
          .filter(([role]) => role !== restoredUser.role)
          .map(([, prefix]) => prefix);
        const isOnWrongPortal = otherPrefixes.some((p) => currentPath.startsWith(p));
        if (isOnWrongPortal && ownPrefix) {
          navigate(PORTAL_HOMES[restoredUser.role], { replace: true });
        }
      } catch (err) {
        const status = err.response?.status;

        if (isTransientError(err)) {
          console.warn('Transient error restoring session — keeping token:', err.message);
        } else if (status === 401) {
          try {
            const { data } = await axios.post(
              `${API_URL}/auth/refresh`,
              {},
              { withCredentials: true }
            );
            const newToken = data?.data?.accessToken;
            if (newToken) {
              localStorage.setItem('accessToken', newToken);
              const { data: meData } = await api.get('/auth/me');
              const restoredUser = meData.data.user;
              setUser(restoredUser);

              const currentPath = window.location.pathname;
              const ownPrefix = PORTAL_PREFIXES[restoredUser.role];
              const otherPrefixes = Object.entries(PORTAL_PREFIXES)
                .filter(([role]) => role !== restoredUser.role)
                .map(([, prefix]) => prefix);
              const isOnWrongPortal = otherPrefixes.some((p) => currentPath.startsWith(p));
              if (isOnWrongPortal && ownPrefix) {
                navigate(PORTAL_HOMES[restoredUser.role], { replace: true });
              }
              setLoading(false);
              return;
            }
          } catch (refreshErr) {
            if (!isTransientError(refreshErr)) {
              localStorage.removeItem('accessToken');
            }
          }
        } else if (status && status >= 400 && status < 500) {
          localStorage.removeItem('accessToken');
        } else {
          console.warn('Server error restoring session — keeping token:', err.message);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync React state when interceptor clears an expired session
  useEffect(() => {
    const onSessionExpired = () => {
      setUser(null);
      setPostLoginRole(null);
      navigate(ROUTES.LOGIN, { replace: true, state: { from: window.location.pathname } });
      toast.error('Your session has expired. Please log in again.');
    };
    window.addEventListener(AUTH_SESSION_EXPIRED, onSessionExpired);
    return () => window.removeEventListener(AUTH_SESSION_EXPIRED, onSessionExpired);
  }, [navigate]);

  const login = async (email, password) => {
    setLoading(true);
    setPostLoginRole(null);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      const { accessToken, user: loggedUser } = data.data;
      localStorage.setItem('accessToken', accessToken);
      setUser(loggedUser);
      setPostLoginRole(loggedUser.role);
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

  const verifyEmail = async (email, otp) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-email', { email, otp });
      toast.success(data.message || 'Email verified successfully!');
      // Verification alone should not log the visitor into the public site.
      if (data.data?.user && localStorage.getItem('accessToken')) {
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
    postLoginRole,
    clearPostLoginRole,
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
