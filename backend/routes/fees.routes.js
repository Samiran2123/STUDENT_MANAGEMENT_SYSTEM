const express = require('express');
const router = express.Router();
const {
  createFee, getAllFees, getFeeById,
  getFeeSummary, updateFee, deleteFee,
} = require('../controllers/feesController');
const { verifyToken } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { createFeeValidator, updateFeeValidator, feeIdValidator } = require('../utils/validators/fees.validator');

/**
 * @route   POST /api/fees
 * @desc    Create a fee record for a student
 * @access  Admin
 */
router.post('/', verifyToken, authorize('admin'), createFeeValidator, createFee);

/**
 * @route   GET /api/fees
 * @desc    Get all fees (Admin=all, Student=own)
 * @access  Admin, Student
 * @query   student_id (admin only), status, page, limit
 */
router.get('/', verifyToken, authorize('admin', 'student'), getAllFees);

/**
 * @route   GET /api/fees/summary/:studentId
 * @desc    Get fee summary (total, paid, pending, overdue) for a student
 * @access  Admin, Student (own only)
 */
router.get('/summary/:studentId', verifyToken, authorize('admin', 'student'), getFeeSummary);

/**
 * @route   GET /api/fees/:id
 * @desc    Get single fee record
 * @access  Admin, Student (own only)
 */
router.get('/:id', verifyToken, authorize('admin', 'student'), feeIdValidator, getFeeById);

/**
 * @route   PUT /api/fees/:id
 * @desc    Update fee (mark paid, update amount, etc.)
 * @access  Admin
 */
router.put('/:id', verifyToken, authorize('admin'), feeIdValidator, updateFeeValidator, updateFee);

/**
 * @route   DELETE /api/fees/:id
 * @desc    Delete fee record
 * @access  Admin
 */
router.delete('/:id', verifyToken, authorize('admin'), feeIdValidator, deleteFee);

module.exports = router;
