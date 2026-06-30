const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authValidators } = require('../validators/authValidators');
const { requireAuth } = require('../middlewares/auth');
const { authLimiter, otpLimiter } = require('../middlewares/rateLimiter');

router.post('/register', authLimiter, authValidators.register, authController.register);
router.post('/verify-email', otpLimiter, authValidators.verifyEmail, authController.verifyEmail);
router.post('/resend-otp', otpLimiter, authController.resendOTP);
router.post('/login', authLimiter, authValidators.login, authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.post('/forgot-password', otpLimiter, authValidators.forgotPassword, authController.forgotPassword);
router.post('/reset-password', otpLimiter, authValidators.resetPassword, authController.resetPassword);
router.get('/me', requireAuth, authController.getMe);

module.exports = router;
