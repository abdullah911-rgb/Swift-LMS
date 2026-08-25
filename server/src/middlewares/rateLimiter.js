const rateLimit = require('express-rate-limit');
const { sendError } = require('../utils/apiResponse');

const rateLimitMessage = (req, res) => {
  sendError(res, 'Too many requests. Please try again later.', 429);
};

/**
 * General API rate limiter — 500 requests per 15 minutes
 * (covers all /api/* routes including /me on every page load)
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitMessage,
  skipSuccessfulRequests: false,
});

/**
 * Auth rate limiter — 50 login attempts per 15 minutes per IP
 * Only failed requests count (skipSuccessfulRequests: true)
 * This still protects against brute-force while allowing normal use
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitMessage,
  skipSuccessfulRequests: true,
});

/**
 * OTP rate limiter — 20 attempts per 15 minutes
 */
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitMessage,
});

module.exports = { generalLimiter, authLimiter, otpLimiter };
