const { body, param } = require('express-validator');

const createTeacherValidator = [
  body('user_id')
    .notEmpty().withMessage('User ID is required')
    .isInt({ min: 1 }).withMessage('User ID must be a positive integer'),

  body('employee_id')
    .trim()
    .notEmpty().withMessage('Employee ID is required')
    .isLength({ max: 50 }).withMessage('Employee ID cannot exceed 50 characters'),

  body('department')
    .trim()
    .notEmpty().withMessage('Department is required')
    .isLength({ max: 100 }).withMessage('Department cannot exceed 100 characters'),

  body('designation')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Designation cannot exceed 100 characters'),

  body('qualification')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Qualification cannot exceed 200 characters'),

  body('experience')
    .optional()
    .isInt({ min: 0 }).withMessage('Experience must be a non-negative integer (years)'),

  body('status')
    .optional()
    .isIn(['active', 'inactive', 'pending']).withMessage('Status must be active, inactive, or pending'),
];

const updateTeacherValidator = [
  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Department cannot exceed 100 characters'),

  body('designation')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Designation cannot exceed 100 characters'),

  body('qualification')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Qualification cannot exceed 200 characters'),

  body('experience')
    .optional()
    .isInt({ min: 0 }).withMessage('Experience must be a non-negative integer (years)'),

  body('status')
    .optional()
    .isIn(['active', 'inactive', 'pending']).withMessage('Status must be active, inactive, or pending'),
];

const teacherIdValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('Teacher ID must be a positive integer'),
];

module.exports = { createTeacherValidator, updateTeacherValidator, teacherIdValidator };
