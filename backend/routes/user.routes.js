const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById, deleteUser } = require('../controllers/userController');
const { verifyToken } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { param } = require('express-validator');

const idValidator = [param('id').isInt({ min: 1 }).withMessage('ID must be a positive integer')];

/**
 * @route   GET /api/users
 * @desc    Get all users with optional role filter and pagination
 * @access  Admin
 * @query   role, page, limit
 */
router.get('/', verifyToken, authorize('admin'), getAllUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Admin
 */
router.get('/:id', verifyToken, authorize('admin'), idValidator, getUserById);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user by ID (cascades to student/teacher profile)
 * @access  Admin
 */
router.delete('/:id', verifyToken, authorize('admin'), idValidator, deleteUser);

module.exports = router;
