const { body, param } = require('express-validator');

const addMarksValidator = [
  body('student_id')
    .notEmpty().withMessage('Student ID is required')
    .isInt({ min: 1 }).withMessage('Student ID must be a positive integer'),

  body('course_id')
    .notEmpty().withMessage('Course ID is required')
    .isInt({ min: 1 }).withMessage('Course ID must be a positive integer'),

  body('exam_type')
    .notEmpty().withMessage('Exam type is required')
    .isIn(['midterm', 'final', 'quiz', 'assignment', 'practical'])
    .withMessage('Exam type must be midterm, final, quiz, assignment, or practical'),

  body('marks')
    .notEmpty().withMessage('Marks are required')
    .isFloat({ min: 0 }).withMessage('Marks must be a non-negative number'),

  body('total_marks')
    .notEmpty().withMessage('Total marks are required')
    .isFloat({ min: 1 }).withMessage('Total marks must be greater than 0')
    .custom((value, { req }) => {
      if (parseFloat(req.body.marks) > parseFloat(value)) {
        throw new Error('Marks cannot exceed total marks');
      }
      return true;
    }),
];

const updateMarksValidator = [
  body('marks')
    .optional()
    .isFloat({ min: 0 }).withMessage('Marks must be a non-negative number'),

  body('total_marks')
    .optional()
    .isFloat({ min: 1 }).withMessage('Total marks must be greater than 0'),

  body('exam_type')
    .optional()
    .isIn(['midterm', 'final', 'quiz', 'assignment', 'practical'])
    .withMessage('Exam type must be midterm, final, quiz, assignment, or practical'),
];

const marksIdValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('Mark ID must be a positive integer'),
];

module.exports = { addMarksValidator, updateMarksValidator, marksIdValidator };
