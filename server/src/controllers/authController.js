const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const authService = require('../services/authService');

const authController = {
  // POST /api/auth/register
  register: asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;
    const user = await authService.register({ name, email, password, role });
    sendSuccess(res, 'Registration successful. Please check your email for the verification OTP.', { user }, 201);
  }),

  // POST /api/auth/verify-email
  verifyEmail: asyncHandler(async (req, res) => {
    const { email, otp } = req.body;
    const user = await authService.verifyEmail({ email, otp });
    sendSuccess(res, 'Email verified successfully. Welcome aboard!', { user });
  }),

  // POST /api/auth/resend-otp
  resendOTP: asyncHandler(async (req, res) => {
    const { email, purpose } = req.body;
    await authService.resendOTP(email, purpose);
    sendSuccess(res, 'OTP sent. Please check your email.');
  }),

  // POST /api/auth/login
  login: asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const data = await authService.login({ email, password }, res);
    sendSuccess(res, 'Login successful.', data);
  }),

  // POST /api/auth/refresh
  refresh: asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.refreshToken;
    const data = await authService.refresh(refreshToken, res);
    sendSuccess(res, 'Token refreshed.', data);
  }),

  // POST /api/auth/logout
  logout: asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.refreshToken;
    await authService.logout(refreshToken, res);
    sendSuccess(res, 'Logged out successfully.');
  }),

  // POST /api/auth/forgot-password
  forgotPassword: asyncHandler(async (req, res) => {
    const { email } = req.body;
    await authService.forgotPassword(email);
    sendSuccess(res, 'If an account exists with that email, a password reset OTP has been sent.');
  }),

  // POST /api/auth/reset-password
  resetPassword: asyncHandler(async (req, res) => {
    const { email, otp, password } = req.body;
    await authService.resetPassword({ email, otp, password });
    sendSuccess(res, 'Password reset successfully. Please log in with your new password.');
  }),

  // GET /api/auth/me
  getMe: asyncHandler(async (req, res) => {
    sendSuccess(res, 'User profile fetched.', { user: req.user });
  }),
};

module.exports = authController;
