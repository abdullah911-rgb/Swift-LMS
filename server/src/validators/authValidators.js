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
      .notEmpty().withMessage('Full name is required.')
      .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters.'),
    body('fatherName')
      .trim()
      .notEmpty().withMessage("Father's name is required.")
      .isLength({ min: 2, max: 100 }).withMessage("Father's name must be 2–100 characters."),
    body('cnic')
      .trim()
      .notEmpty().withMessage('CNIC / National ID is required.')
      .matches(/^[0-9]{5}-?[0-9]{7}-?[0-9]{1}$|^[0-9]{13}$/)
      .withMessage('Enter a valid CNIC (e.g. 12345-1234567-1).'),
    body('phone')
      .trim()
      .notEmpty().withMessage('Mobile number is required.')
      .isLength({ min: 10, max: 20 }).withMessage('Enter a valid mobile number.'),
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
    body('dateOfBirth')
      .notEmpty().withMessage('Date of birth is required.')
      .isISO8601({ strict: false }).withMessage('Enter a valid date of birth.'),
    body('address')
      .trim()
      .notEmpty().withMessage('Address is required.')
      .isLength({ min: 5, max: 500 }).withMessage('Address must be 5–500 characters.'),
    body('gender')
      .notEmpty().withMessage('Gender is required.')
      .isIn(['MALE', 'FEMALE', 'OTHER']).withMessage('Gender must be MALE, FEMALE, or OTHER.'),
    body('qualification')
      .trim()
      .notEmpty().withMessage('Qualification is required.')
      .isLength({ min: 2, max: 200 }).withMessage('Qualification must be 2–200 characters.'),
    (req, res, next) => {
      if (!req.file) {
        return sendError(res, 'Validation failed.', 422, [{ field: 'profilePhoto', message: 'Profile photo is required.' }]);
      }
      next();
    },
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
