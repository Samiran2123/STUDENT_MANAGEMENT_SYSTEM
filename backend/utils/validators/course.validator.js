const { body, param } = require('express-validator');

const createCourseValidator = [
  body('course_name')
    .trim()
    .notEmpty().withMessage('Course name is required')
    .isLength({ max: 150 }).withMessage('Course name cannot exceed 150 characters'),

  body('course_code')
    .trim()
    .notEmpty().withMessage('Course code is required')
    .isLength({ max: 50 }).withMessage('Course code cannot exceed 50 characters')
    .isAlphanumeric('en-US', { ignore: '-_' }).withMessage('Course code must be alphanumeric'),

  body('semester')
    .notEmpty().withMessage('Semester is required')
    .isInt({ min: 1, max: 10 }).withMessage('Semester must be between 1 and 10'),

  body('department')
    .trim()
    .notEmpty().withMessage('Department is required')
    .isLength({ max: 100 }).withMessage('Department cannot exceed 100 characters'),

  body('credits')
    .notEmpty().withMessage('Credits are required')
    .isInt({ min: 1 }).withMessage('Credits must be a positive integer'),

  body('teacher_id')
    .optional()
    .isInt({ min: 1 }).withMessage('Teacher ID must be a positive integer'),
];

const updateCourseValidator = [
  body('course_name')
    .optional()
    .trim()
    .isLength({ max: 150 }).withMessage('Course name cannot exceed 150 characters'),

  body('semester')
    .optional()
    .isInt({ min: 1, max: 10 }).withMessage('Semester must be between 1 and 10'),

  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Department cannot exceed 100 characters'),

  body('credits')
    .optional()
    .isInt({ min: 1 }).withMessage('Credits must be a positive integer'),

  body('teacher_id')
    .optional()
    .isInt({ min: 1 }).withMessage('Teacher ID must be a positive integer'),
];

const assignTeacherValidator = [
  body('teacher_id')
    .notEmpty().withMessage('Teacher ID is required')
    .isInt({ min: 1 }).withMessage('Teacher ID must be a positive integer'),
];

const courseIdValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('Course ID must be a positive integer'),
];

module.exports = { createCourseValidator, updateCourseValidator, assignTeacherValidator, courseIdValidator };
