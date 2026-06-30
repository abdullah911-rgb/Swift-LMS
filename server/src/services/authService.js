const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../config/db');
const config = require('../config/env');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
} = require('../utils/generateToken');
const { sendEmail, emailTemplates } = require('../utils/sendEmail');

/** Generate a 6-digit OTP */
const generateOTP = () => String(Math.floor(100000 + Math.random() * 900000));

/** OTP expiry — 10 minutes */
const OTP_TTL_MS = 10 * 60 * 1000;

const authService = {
  // ── Register ──────────────────────────────────────────────────────────────
  async register({ name, email, password, role = 'STUDENT' }) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      const err = new Error('An account with this email already exists.');
      err.statusCode = 409;
      throw err;
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role },
      select: { id: true, name: true, email: true, role: true },
    });

    // Generate and send OTP
    const otp = generateOTP();
    await prisma.oTPVerification.create({
      data: {
        email,
        otp,
        purpose: 'EMAIL_VERIFICATION',
        userId: user.id,
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    });

    const template = emailTemplates.verifyEmail(name, otp);
    await sendEmail({ to: email, ...template });

    return user;
  },

  // ── Verify Email ──────────────────────────────────────────────────────────
  async verifyEmail({ email, otp }) {
    const record = await prisma.oTPVerification.findFirst({
      where: { email, otp, purpose: 'EMAIL_VERIFICATION' },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      const err = new Error('Invalid OTP. Please check and try again.');
      err.statusCode = 400;
      throw err;
    }
    if (record.expiresAt < new Date()) {
      await prisma.oTPVerification.delete({ where: { id: record.id } });
      const err = new Error('OTP has expired. Please request a new one.');
      err.statusCode = 400;
      throw err;
    }

    const user = await prisma.user.update({
      where: { email },
      data: { isVerified: true },
      select: { id: true, name: true, email: true, role: true },
    });

    await prisma.oTPVerification.deleteMany({ where: { email, purpose: 'EMAIL_VERIFICATION' } });

    // Send welcome email
    const template = emailTemplates.welcomeEmail(user.name);
    await sendEmail({ to: email, ...template });

    return user;
  },

  // ── Resend OTP ────────────────────────────────────────────────────────────
  async resendOTP(email, purpose = 'EMAIL_VERIFICATION') {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const err = new Error('No account found with this email.');
      err.statusCode = 404;
      throw err;
    }
    if (purpose === 'EMAIL_VERIFICATION' && user.isVerified) {
      const err = new Error('Email is already verified.');
      err.statusCode = 400;
      throw err;
    }

    // Delete old OTPs
    await prisma.oTPVerification.deleteMany({ where: { email, purpose } });

    const otp = generateOTP();
    await prisma.oTPVerification.create({
      data: {
        email,
        otp,
        purpose,
        userId: user.id,
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    });

    const template =
      purpose === 'EMAIL_VERIFICATION'
        ? emailTemplates.verifyEmail(user.name, otp)
        : emailTemplates.resetPassword(user.name, otp);
    await sendEmail({ to: email, ...template });
  },

  // ── Login ─────────────────────────────────────────────────────────────────
  async login({ email, password }, res) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const err = new Error('Invalid email or password.');
      err.statusCode = 401;
      throw err;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const err = new Error('Invalid email or password.');
      err.statusCode = 401;
      throw err;
    }

    if (!user.isActive) {
      const err = new Error('Your account has been deactivated. Contact support.');
      err.statusCode = 403;
      throw err;
    }

    const accessToken = generateAccessToken({ id: user.id, email: user.email, role: user.role });
    const refreshToken = generateRefreshToken({ id: user.id });

    // Store refresh token in DB
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + config.jwt.refreshExpiresInMs),
      },
    });

    setRefreshTokenCookie(res, refreshToken);

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isVerified: user.isVerified,
      },
    };
  },

  // ── Refresh Token ─────────────────────────────────────────────────────────
  async refresh(refreshToken, res) {
    if (!refreshToken) {
      const err = new Error('No refresh token provided.');
      err.statusCode = 401;
      throw err;
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      const err = new Error('Invalid or expired refresh token.');
      err.statusCode = 401;
      throw err;
    }

    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored || stored.expiresAt < new Date()) {
      clearRefreshTokenCookie(res);
      const err = new Error('Refresh token is invalid or expired. Please log in again.');
      err.statusCode = 401;
      throw err;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      const err = new Error('User not found or deactivated.');
      err.statusCode = 401;
      throw err;
    }

    // Rotate refresh token
    const newRefreshToken = generateRefreshToken({ id: user.id });
    await prisma.refreshToken.update({
      where: { token: refreshToken },
      data: {
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + config.jwt.refreshExpiresInMs),
      },
    });

    setRefreshTokenCookie(res, newRefreshToken);

    const accessToken = generateAccessToken({ id: user.id, email: user.email, role: user.role });
    return { accessToken };
  },

  // ── Logout ────────────────────────────────────────────────────────────────
  async logout(refreshToken, res) {
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } }).catch(() => {});
    }
    clearRefreshTokenCookie(res);
  },

  // ── Forgot Password ───────────────────────────────────────────────────────
  async forgotPassword(email) {
    const user = await prisma.user.findUnique({ where: { email } });
    // Always respond the same way (security)
    if (!user) return;

    await prisma.oTPVerification.deleteMany({ where: { email, purpose: 'PASSWORD_RESET' } });

    const otp = generateOTP();
    await prisma.oTPVerification.create({
      data: {
        email,
        otp,
        purpose: 'PASSWORD_RESET',
        userId: user.id,
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    });

    const template = emailTemplates.resetPassword(user.name, otp);
    await sendEmail({ to: email, ...template });
  },

  // ── Reset Password ────────────────────────────────────────────────────────
  async resetPassword({ email, otp, password }) {
    const record = await prisma.oTPVerification.findFirst({
      where: { email, otp, purpose: 'PASSWORD_RESET' },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      const err = new Error('Invalid OTP. Please check and try again.');
      err.statusCode = 400;
      throw err;
    }
    if (record.expiresAt < new Date()) {
      await prisma.oTPVerification.delete({ where: { id: record.id } });
      const err = new Error('OTP has expired. Please request a new one.');
      err.statusCode = 400;
      throw err;
    }

    const hashed = await bcrypt.hash(password, 12);
    await prisma.user.update({ where: { email }, data: { password: hashed } });
    await prisma.oTPVerification.deleteMany({ where: { email, purpose: 'PASSWORD_RESET' } });
    // Invalidate all refresh tokens for security
    await prisma.refreshToken.deleteMany({
      where: { userId: record.userId },
    });
  },
};

module.exports = authService;
