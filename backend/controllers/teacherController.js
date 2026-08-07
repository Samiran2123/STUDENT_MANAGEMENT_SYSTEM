const { validationResult } = require('express-validator');
const TeacherModel = require('../models/teacherModel');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse, createdResponse, noContentResponse } = require('../utils/apiResponse');

/**
 * POST /api/teachers
 * Admin: Create teacher profile
 */
const createTeacher = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, 422, 'Validation failed', errors.array());
  }

  if (req.file) {
    req.body.photo = req.file.filename;
  }

  const teacher = await TeacherModel.create(req.body);
  return createdResponse(res, 'Teacher profile created successfully.', teacher);
});

/**
 * GET /api/teachers
 * Admin: Get all teachers with filters
 */
const getAllTeachers = asyncHandler(async (req, res) => {
  const { department, status, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const filters = { department, status, limit: parseInt(limit), offset };

  const [teachers, total] = await Promise.all([
    TeacherModel.findAll(filters),
    TeacherModel.count(filters),
  ]);

  return successResponse(res, 200, 'Teachers fetched successfully.', teachers, {
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total / parseInt(limit)),
  });
});

/**
 * GET /api/teachers/:id
 * Admin/Teacher: Get teacher by ID
 */
const getTeacherById = asyncHandler(async (req, res) => {
  const teacher = await TeacherModel.findById(req.params.id);
  if (!teacher) {
    return errorResponse(res, 404, `Teacher with ID ${req.params.id} not found.`);
  }

  // A teacher can only view their own profile (unless admin)
  if (req.user.role === 'teacher' && teacher.user_id !== req.user.id) {
    return errorResponse(res, 403, 'You are not authorized to view this teacher profile.');
  }

  return successResponse(res, 200, 'Teacher fetched successfully.', teacher);
});

/**
 * GET /api/teachers/my-profile
 * Teacher: Get own teacher profile
 */
const getMyTeacherProfile = asyncHandler(async (req, res) => {
  const teacher = await TeacherModel.findByUserId(req.user.id);
  if (!teacher) {
    return errorResponse(res, 404, 'Teacher profile not found for your account.');
  }
  return successResponse(res, 200, 'Your teacher profile fetched successfully.', teacher);
});

/**
 * PUT /api/teachers/:id
 * Admin: Update teacher profile
 */
const updateTeacher = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, 422, 'Validation failed', errors.array());
  }

  if (req.file) {
    req.body.photo = req.file.filename;
  }

  const teacher = await TeacherModel.update(req.params.id, req.body);
  if (!teacher) {
    return errorResponse(res, 404, `Teacher with ID ${req.params.id} not found.`);
  }
  return successResponse(res, 200, 'Teacher profile updated successfully.', teacher);
});

/**
 * PUT /api/teachers/:id/approve
 * Admin: Approve a pending teacher registration
 */
const approveTeacher = asyncHandler(async (req, res) => {
  const teacher = await TeacherModel.approve(req.params.id);
  if (!teacher) {
    return errorResponse(res, 404, `Teacher with ID ${req.params.id} not found.`);
  }
  return successResponse(res, 200, 'Teacher approved successfully.', teacher);
});

/**
 * DELETE /api/teachers/:id
 * Admin: Delete teacher profile
 */
const deleteTeacher = asyncHandler(async (req, res) => {
  const deleted = await TeacherModel.delete(req.params.id);
  if (!deleted) {
    return errorResponse(res, 404, `Teacher with ID ${req.params.id} not found.`);
  }
  return noContentResponse(res);
});

module.exports = {
  createTeacher,
  getAllTeachers,
  getTeacherById,
  getMyTeacherProfile,
  updateTeacher,
  approveTeacher,
  deleteTeacher,
};
