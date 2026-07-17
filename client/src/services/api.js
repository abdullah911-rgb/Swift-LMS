import axios from 'axios';
import { API_URL } from '../constants';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const AUTH_SESSION_EXPIRED = 'auth:session-expired';

function isAuthFailure(error) {
  const status = error.response?.status;
  return status === 401 || status === 403;
}

function isTransientError(error) {
  return !error.response || error.code === 'ECONNABORTED' || error.message === 'Network Error';
}

function clearSession() {
  localStorage.removeItem('accessToken');
  window.dispatchEvent(new CustomEvent(AUTH_SESSION_EXPIRED));
}

function ensureHeaders(config) {
  if (!config.headers) {
    config.headers = {};
  }
  return config.headers;
}

// Request interceptor to attach access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    const headers = ensureHeaders(config);
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    } else {
      delete headers.Authorization;
      delete api.defaults.headers.common['Authorization'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest?.url) {
      return Promise.reject(error);
    }

    if (
      originalRequest.url.includes('/auth/refresh') ||
      originalRequest.url.includes('/auth/login')
    ) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            const headers = ensureHeaders(originalRequest);
            headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const accessToken = data?.data?.accessToken;
        if (!accessToken) {
          throw new Error('Invalid refresh response');
        }

        localStorage.setItem('accessToken', accessToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        const headers = ensureHeaders(originalRequest);
        headers.Authorization = `Bearer ${accessToken}`;

        processQueue(null, accessToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        if (isAuthFailure(refreshError) && !isTransientError(refreshError)) {
          clearSession();
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
