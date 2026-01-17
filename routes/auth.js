const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const authenticate = require('../middleware/authenticate');
const { authLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');

// Validation rules
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Full name must be at least 2 characters long'),
  body('phone')
    .optional()
    .trim()
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
    .withMessage('Please provide a valid phone number')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  body('userType')
    .optional()
    .isIn(['main', 'sub'])
    .withMessage('User type must be either "main" or "sub"')
];

const passwordResetRequestValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('userType')
    .optional()
    .isIn(['main', 'sub'])
    .withMessage('User type must be either "main" or "sub"')
];

const passwordResetValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('userType')
    .optional()
    .isIn(['main', 'sub'])
    .withMessage('User type must be either "main" or "sub"')
];

const emailVerificationValidation = [
  body('token')
    .notEmpty()
    .withMessage('Verification token is required')
];

// Routes
router.post('/register', authLimiter, registerValidation, authController.register);
router.post('/login', authLimiter, loginValidation, authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);
router.get('/profile', authenticate, authController.getProfile);
router.post('/password-reset/request', passwordResetLimiter, passwordResetRequestValidation, authController.requestPasswordReset);
router.post('/password-reset', passwordResetLimiter, passwordResetValidation, authController.resetPassword);
// Email verification - supports both GET (web) and POST (mobile)
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/verify-email', emailVerificationValidation, authController.verifyEmail);

module.exports = router;

