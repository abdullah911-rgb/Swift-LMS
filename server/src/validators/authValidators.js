const { body, param, query, validationResult } = require('express-validator');
const { sendError } = require('../utils/apiResponse');

/**
 * Middleware to check validation results and return errors
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((e) => ({ field: e.path, message: e.msg }));
    return sendError(res, 'Validation failed.', 422, formatted);
  }
  next();
};

/**
 * Auth validators
 */
const authValidators = {
  register: [
    body('name')
      .trim()
      .notEmpty().withMessage('Name is required.')
      .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters.'),
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required.')
      .isEmail().withMessage('Please enter a valid email address.')
      .normalizeEmail(),
    body('password')
      .notEmpty().withMessage('Password is required.')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number.'),
    body('role')
      .optional()
      .isIn(['STUDENT', 'INSTRUCTOR']).withMessage('Role must be STUDENT or INSTRUCTOR.'),
    validate,
  ],

  login: [
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required.')
      .isEmail().withMessage('Please enter a valid email address.')
      .normalizeEmail(),
    body('password')
      .notEmpty().withMessage('Password is required.'),
    validate,
  ],

  verifyEmail: [
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required.')
      .isEmail().withMessage('Invalid email address.')
      .normalizeEmail(),
    body('otp')
      .trim()
      .notEmpty().withMessage('OTP is required.')
      .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits.')
      .isNumeric().withMessage('OTP must contain only numbers.'),
    validate,
  ],

  forgotPassword: [
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required.')
      .isEmail().withMessage('Please enter a valid email address.')
      .normalizeEmail(),
    validate,
  ],

  resetPassword: [
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required.')
      .isEmail().withMessage('Invalid email address.')
      .normalizeEmail(),
    body('otp')
      .trim()
      .notEmpty().withMessage('OTP is required.')
      .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits.')
      .isNumeric().withMessage('OTP must contain only numbers.'),
    body('password')
      .notEmpty().withMessage('Password is required.')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain uppercase, lowercase, and a number.'),
    validate,
  ],

  changePassword: [
    body('currentPassword').notEmpty().withMessage('Current password is required.'),
    body('newPassword')
      .notEmpty().withMessage('New password is required.')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain uppercase, lowercase, and a number.'),
    validate,
  ],
};

module.exports = { authValidators, validate };
