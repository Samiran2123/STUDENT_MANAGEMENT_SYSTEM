const { validationResult } = require('express-validator');
const StudentModel = require('../models/studentModel');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse, createdResponse, noContentResponse } = require('../utils/apiResponse');

/**
 * POST /api/students
 * Admin: Create student profile
 */
const createStudent = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, 422, 'Validation failed', errors.array());
  }

  // Attach photo path if uploaded
  if (req.file) {
    req.body.photo = req.file.filename;
  }

  const student = await StudentModel.create(req.body);
  return createdResponse(res, 'Student profile created successfully.', student);
});

/**
 * GET /api/students
 * Admin/Teacher: Get all students with filters
 */
const getAllStudents = asyncHandler(async (req, res) => {
  const { department, semester, status, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const filters = {
    department, semester: semester ? parseInt(semester) : undefined,
    status, limit: parseInt(limit), offset,
  };

  const [students, total] = await Promise.all([
    StudentModel.findAll(filters),
    StudentModel.count(filters),
  ]);

  return successResponse(res, 200, 'Students fetched successfully.', students, {
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total / parseInt(limit)),
  });
});

/**
 * GET /api/students/:id
 * Admin/Teacher/Student: Get student by ID
 * Students can only view their own profile
 */
const getStudentById = asyncHandler(async (req, res) => {
  const student = await StudentModel.findById(req.params.id);
  if (!student) {
    return errorResponse(res, 404, `Student with ID ${req.params.id} not found.`);
  }

  // Students can only view their own profile
  if (req.user.role === 'student' && student.user_id !== req.user.id) {
    return errorResponse(res, 403, 'You are not authorized to view this student profile.');
  }

  return successResponse(res, 200, 'Student fetched successfully.', student);
});

/**
 * GET /api/students/my-profile
 * Student: Get own student profile using logged-in user
 */
const getMyStudentProfile = asyncHandler(async (req, res) => {
  const student = await StudentModel.findByUserId(req.user.id);
  if (!student) {
    return errorResponse(res, 404, 'Student profile not found for your account.');
  }
  return successResponse(res, 200, 'Your student profile fetched successfully.', student);
});

/**
 * PUT /api/students/:id
 * Admin: Update student profile
 */
const updateStudent = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, 422, 'Validation failed', errors.array());
  }

  // Attach new photo if uploaded
  if (req.file) {
    req.body.photo = req.file.filename;
  }

  const student = await StudentModel.update(req.params.id, req.body);
  if (!student) {
    return errorResponse(res, 404, `Student with ID ${req.params.id} not found.`);
  }
  return successResponse(res, 200, 'Student profile updated successfully.', student);
});

/**
 * DELETE /api/students/:id
 * Admin: Delete student profile
 */
const deleteStudent = asyncHandler(async (req, res) => {
  const deleted = await StudentModel.delete(req.params.id);
  if (!deleted) {
    return errorResponse(res, 404, `Student with ID ${req.params.id} not found.`);
  }
  return noContentResponse(res);
});

module.exports = {
  createStudent,
  getAllStudents,
  getStudentById,
  getMyStudentProfile,
  updateStudent,
  deleteStudent,
};
