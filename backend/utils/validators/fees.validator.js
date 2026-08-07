const { body, param } = require('express-validator');

const createFeeValidator = [
  body('student_id')
    .notEmpty().withMessage('Student ID is required')
    .isInt({ min: 1 }).withMessage('Student ID must be a positive integer'),

  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),

  body('status')
    .optional()
    .isIn(['pending', 'paid', 'overdue', 'waived'])
    .withMessage('Status must be pending, paid, overdue, or waived'),

  body('payment_date')
    .optional()
    .isDate().withMessage('Payment date must be a valid date (YYYY-MM-DD)'),

  body('payment_method')
    .optional()
    .isIn(['cash', 'online', 'cheque', 'bank_transfer'])
    .withMessage('Payment method must be cash, online, cheque, or bank_transfer'),
];

const updateFeeValidator = [
  body('amount')
    .optional()
    .isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),

  body('status')
    .optional()
    .isIn(['pending', 'paid', 'overdue', 'waived'])
    .withMessage('Status must be pending, paid, overdue, or waived'),

  body('payment_date')
    .optional()
    .isDate().withMessage('Payment date must be a valid date (YYYY-MM-DD)'),

  body('payment_method')
    .optional()
    .isIn(['cash', 'online', 'cheque', 'bank_transfer'])
    .withMessage('Payment method must be cash, online, cheque, or bank_transfer'),
];

const feeIdValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('Fee ID must be a positive integer'),
];

module.exports = { createFeeValidator, updateFeeValidator, feeIdValidator };
