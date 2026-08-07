const { validationResult } = require('express-validator');
const CourseModel = require('../models/courseModel');
const TeacherModel = require('../models/teacherModel');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse, createdResponse, noContentResponse } = require('../utils/apiResponse');

/**
 * POST /api/courses
 * Admin: Create a course
 */
const createCourse = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, 422, 'Validation failed', errors.array());
  }

  // Verify teacher exists if provided
  if (req.body.teacher_id) {
    const teacher = await TeacherModel.findById(req.body.teacher_id);
    if (!teacher) {
      return errorResponse(res, 404, `Teacher with ID ${req.body.teacher_id} not found.`);
    }
  }

  const course = await CourseModel.create(req.body);
  return createdResponse(res, 'Course created successfully.', course);
});

/**
 * GET /api/courses
 * All roles: Get all courses (teacher sees own courses only)
 */
const getAllCourses = asyncHandler(async (req, res) => {
  const { department, semester, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  let filters = { department, semester: semester ? parseInt(semester) : undefined, limit: parseInt(limit), offset };

  // If teacher, return only their courses
  if (req.user.role === 'teacher') {
    const teacher = await TeacherModel.findByUserId(req.user.id);
    if (!teacher) {
      return errorResponse(res, 404, 'Teacher profile not found for your account.');
    }
    filters.teacher_id = teacher.id;
  }

  const [courses, total] = await Promise.all([
    CourseModel.findAll(filters),
    CourseModel.count(filters),
  ]);

  return successResponse(res, 200, 'Courses fetched successfully.', courses, {
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total / parseInt(limit)),
  });
});

/**
 * GET /api/courses/:id
 * All roles: Get course by ID
 */
const getCourseById = asyncHandler(async (req, res) => {
  const course = await CourseModel.findById(req.params.id);
  if (!course) {
    return errorResponse(res, 404, `Course with ID ${req.params.id} not found.`);
  }

  // Teacher can only view their own courses
  if (req.user.role === 'teacher') {
    const teacher = await TeacherModel.findByUserId(req.user.id);
    if (!teacher || course.teacher_id !== teacher.id) {
      return errorResponse(res, 403, 'You are not authorized to view this course.');
    }
  }

  return successResponse(res, 200, 'Course fetched successfully.', course);
});

/**
 * PUT /api/courses/:id
 * Admin: Update course
 */
const updateCourse = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, 422, 'Validation failed', errors.array());
  }

  // Verify teacher if updating
  if (req.body.teacher_id) {
    const teacher = await TeacherModel.findById(req.body.teacher_id);
    if (!teacher) {
      return errorResponse(res, 404, `Teacher with ID ${req.body.teacher_id} not found.`);
    }
  }

  const course = await CourseModel.update(req.params.id, req.body);
  if (!course) {
    return errorResponse(res, 404, `Course with ID ${req.params.id} not found.`);
  }
  return successResponse(res, 200, 'Course updated successfully.', course);
});

/**
 * PUT /api/courses/:id/assign-teacher
 * Admin: Assign a teacher to a course
 */
const assignTeacher = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, 422, 'Validation failed', errors.array());
  }

  const { teacher_id } = req.body;

  const teacher = await TeacherModel.findById(teacher_id);
  if (!teacher) {
    return errorResponse(res, 404, `Teacher with ID ${teacher_id} not found.`);
  }

  const course = await CourseModel.assignTeacher(req.params.id, teacher_id);
  if (!course) {
    return errorResponse(res, 404, `Course with ID ${req.params.id} not found.`);
  }

  return successResponse(res, 200, 'Teacher assigned to course successfully.', course);
});

/**
 * DELETE /api/courses/:id
 * Admin: Delete course
 */
const deleteCourse = asyncHandler(async (req, res) => {
  const deleted = await CourseModel.delete(req.params.id);
  if (!deleted) {
    return errorResponse(res, 404, `Course with ID ${req.params.id} not found.`);
  }
  return noContentResponse(res);
});

module.exports = { createCourse, getAllCourses, getCourseById, updateCourse, assignTeacher, deleteCourse };
