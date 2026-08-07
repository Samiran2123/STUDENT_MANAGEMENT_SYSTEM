const { validationResult } = require('express-validator');
const FeesModel = require('../models/feesModel');
const StudentModel = require('../models/studentModel');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse, createdResponse, noContentResponse } = require('../utils/apiResponse');

/**
 * POST /api/fees
 * Admin: Create fee record
 */
const createFee = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, 422, 'Validation failed', errors.array());
  }

  const fee = await FeesModel.create(req.body);
  return createdResponse(res, 'Fee record created successfully.', fee);
});

/**
 * GET /api/fees
 * Admin: Get all fees | Student: Get own fees
 */
const getAllFees = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const filters = { status, limit: parseInt(limit), offset };

  if (req.user.role === 'student') {
    const studentProfile = await StudentModel.findByUserId(req.user.id);
    if (!studentProfile) return errorResponse(res, 404, 'Student profile not found.');
    filters.student_id = studentProfile.id;
  } else {
    if (req.query.student_id) filters.student_id = parseInt(req.query.student_id);
  }

  const [fees, total] = await Promise.all([
    FeesModel.findAll(filters),
    FeesModel.count(filters),
  ]);

  return successResponse(res, 200, 'Fees fetched successfully.', fees, {
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total / parseInt(limit)),
  });
});

/**
 * GET /api/fees/:id
 * Admin/Student: Get fee by ID
 */
const getFeeById = asyncHandler(async (req, res) => {
  const fee = await FeesModel.findById(req.params.id);
  if (!fee) {
    return errorResponse(res, 404, `Fee record with ID ${req.params.id} not found.`);
  }

  // Student can only view their own fees
  if (req.user.role === 'student') {
    const studentProfile = await StudentModel.findByUserId(req.user.id);
    if (!studentProfile || fee.student_id !== studentProfile.id) {
      return errorResponse(res, 403, 'You are not authorized to view this fee record.');
    }
  }

  return successResponse(res, 200, 'Fee record fetched.', fee);
});

/**
 * GET /api/fees/summary/:studentId
 * Admin/Student: Get fee summary for a student
 */
const getFeeSummary = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  if (req.user.role === 'student') {
    const studentProfile = await StudentModel.findByUserId(req.user.id);
    if (!studentProfile || studentProfile.id !== parseInt(studentId)) {
      return errorResponse(res, 403, 'You can only view your own fee summary.');
    }
  }

  const summary = await FeesModel.getStudentSummary(studentId);
  return successResponse(res, 200, 'Fee summary fetched.', summary);
});

/**
 * PUT /api/fees/:id
 * Admin: Update fee record
 */
const updateFee = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, 422, 'Validation failed', errors.array());
  }

  const fee = await FeesModel.update(req.params.id, req.body);
  if (!fee) {
    return errorResponse(res, 404, `Fee record with ID ${req.params.id} not found.`);
  }
  return successResponse(res, 200, 'Fee record updated successfully.', fee);
});

/**
 * DELETE /api/fees/:id
 * Admin: Delete fee record
 */
const deleteFee = asyncHandler(async (req, res) => {
  const deleted = await FeesModel.delete(req.params.id);
  if (!deleted) {
    return errorResponse(res, 404, `Fee record with ID ${req.params.id} not found.`);
  }
  return noContentResponse(res);
});

module.exports = { createFee, getAllFees, getFeeById, getFeeSummary, updateFee, deleteFee };
