const { body, param } = require('express-validator');

const takeAttendanceValidator = [
  body('student_id')
    .notEmpty().withMessage('Student ID is required')
    .isInt({ min: 1 }).withMessage('Student ID must be a positive integer'),

  body('course_id')
    .notEmpty().withMessage('Course ID is required')
    .isInt({ min: 1 }).withMessage('Course ID must be a positive integer'),

  body('date')
    .notEmpty().withMessage('Date is required')
    .isDate().withMessage('Date must be a valid date (YYYY-MM-DD)'),

  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['present', 'absent', 'late', 'excused'])
    .withMessage('Status must be present, absent, late, or excused'),
];

const bulkAttendanceValidator = [
  body('course_id')
    .notEmpty().withMessage('Course ID is required')
    .isInt({ min: 1 }).withMessage('Course ID must be a positive integer'),

  body('date')
    .notEmpty().withMessage('Date is required')
    .isDate().withMessage('Date must be a valid date (YYYY-MM-DD)'),

  body('records')
    .isArray({ min: 1 }).withMessage('Records must be a non-empty array'),

  body('records.*.student_id')
    .isInt({ min: 1 }).withMessage('Each record must have a valid student_id'),

  body('records.*.status')
    .isIn(['present', 'absent', 'late', 'excused'])
    .withMessage('Each record status must be present, absent, late, or excused'),
];

const updateAttendanceValidator = [
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['present', 'absent', 'late', 'excused'])
    .withMessage('Status must be present, absent, late, or excused'),
];

const attendanceIdValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('Attendance ID must be a positive integer'),
];

module.exports = {
  takeAttendanceValidator,
  bulkAttendanceValidator,
  updateAttendanceValidator,
  attendanceIdValidator,
};
