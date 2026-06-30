const rateLimit = require('express-rate-limit');
const { sendError } = require('../utils/apiResponse');

const rateLimitMessage = (req, res) => {
  sendError(res, 'Too many requests. Please try again later.', 429);
};

/**
 * General API rate limiter — 100 requests per 15 minutes
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitMessage,
});

/**
 * Auth rate limiter — 10 attempts per 15 minutes
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitMessage,
  skipSuccessfulRequests: true,
});

/**
 * OTP rate limiter — 5 attempts per 10 minutes
 */
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitMessage,
});

module.exports = { generalLimiter, authLimiter, otpLimiter };
