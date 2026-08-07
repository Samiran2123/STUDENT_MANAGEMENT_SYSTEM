const { body, param } = require('express-validator');

const createAnnouncementValidator = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters'),

  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
];

const updateAnnouncementValidator = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
];

const announcementIdValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('Announcement ID must be a positive integer'),
];

module.exports = { createAnnouncementValidator, updateAnnouncementValidator, announcementIdValidator };
