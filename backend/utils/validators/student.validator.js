const { body, param } = require('express-validator');

const createStudentValidator = [
  body('user_id')
    .notEmpty().withMessage('User ID is required')
    .isInt({ min: 1 }).withMessage('User ID must be a positive integer'),

  body('roll_number')
    .trim()
    .notEmpty().withMessage('Roll number is required')
    .isLength({ max: 50 }).withMessage('Roll number cannot exceed 50 characters'),

  body('department')
    .trim()
    .notEmpty().withMessage('Department is required')
    .isLength({ max: 100 }).withMessage('Department cannot exceed 100 characters'),

  body('semester')
    .notEmpty().withMessage('Semester is required')
    .isInt({ min: 1, max: 10 }).withMessage('Semester must be between 1 and 10'),

  body('year')
    .notEmpty().withMessage('Year is required')
    .isInt({ min: 2000, max: 2100 }).withMessage('Please provide a valid year'),

  body('gender')
    .optional()
    .isIn(['male', 'female', 'other']).withMessage('Gender must be male, female, or other'),

  body('dob')
    .optional()
    .isDate().withMessage('Date of birth must be a valid date (YYYY-MM-DD)'),

  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Address cannot exceed 500 characters'),

  body('guardian_name')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Guardian name cannot exceed 100 characters'),

  body('guardian_phone')
    .optional()
    .isMobilePhone().withMessage('Please provide a valid guardian phone number'),

  body('status')
    .optional()
    .isIn(['active', 'inactive', 'suspended']).withMessage('Status must be active, inactive, or suspended'),
];

const updateStudentValidator = [
  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Department cannot exceed 100 characters'),

  body('semester')
    .optional()
    .isInt({ min: 1, max: 10 }).withMessage('Semester must be between 1 and 10'),

  body('year')
    .optional()
    .isInt({ min: 2000, max: 2100 }).withMessage('Please provide a valid year'),

  body('gender')
    .optional()
    .isIn(['male', 'female', 'other']).withMessage('Gender must be male, female, or other'),

  body('dob')
    .optional()
    .isDate().withMessage('Date of birth must be a valid date (YYYY-MM-DD)'),

  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Address cannot exceed 500 characters'),

  body('guardian_name')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Guardian name cannot exceed 100 characters'),

  body('guardian_phone')
    .optional()
    .isMobilePhone().withMessage('Please provide a valid guardian phone number'),

  body('status')
    .optional()
    .isIn(['active', 'inactive', 'suspended']).withMessage('Status must be active, inactive, or suspended'),
];

const studentIdValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('Student ID must be a positive integer'),
];

module.exports = { createStudentValidator, updateStudentValidator, studentIdValidator };
