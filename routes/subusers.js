const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const subUserController = require('../controllers/subUserController');
const authenticate = require('../middleware/authenticate');
const { isMainUser } = require('../middleware/authorize');

// Validation rules
const createSubUserValidation = [
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
  body('role')
    .optional()
    .isIn(['admin', 'manager', 'viewer', 'accountant'])
    .withMessage('Role must be one of: admin, manager, viewer, accountant'),
  body('permissions')
    .optional()
    .isObject()
    .withMessage('Permissions must be an object')
];

const updateSubUserValidation = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Full name must be at least 2 characters long'),
  body('role')
    .optional()
    .isIn(['admin', 'manager', 'viewer', 'accountant'])
    .withMessage('Role must be one of: admin, manager, viewer, accountant'),
  body('permissions')
    .optional()
    .isObject()
    .withMessage('Permissions must be an object'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

const updatePasswordValidation = [
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
];

// All routes require authentication and main user access
router.use(authenticate);
router.use(isMainUser);

// Routes
router.post('/', createSubUserValidation, subUserController.createSubUser);
router.get('/', subUserController.getSubUsers);
router.get('/:id', subUserController.getSubUserById);
router.put('/:id', updateSubUserValidation, subUserController.updateSubUser);
router.patch('/:id/password', updatePasswordValidation, subUserController.updateSubUserPassword);
router.delete('/:id', subUserController.deleteSubUser);

module.exports = router;

