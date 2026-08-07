const { validationResult } = require('express-validator');
const MarksModel = require('../models/marksModel');
const TeacherModel = require('../models/teacherModel');
const StudentModel = require('../models/studentModel');
const CourseModel = require('../models/courseModel');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse, createdResponse, noContentResponse } = require('../utils/apiResponse');

/**
 * POST /api/marks
 * Admin/Teacher: Add marks
 */
const addMarks = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, 422, 'Validation failed', errors.array());
  }

  const { student_id, course_id, exam_type, marks, total_marks } = req.body;
  let teacher_id = req.body.teacher_id;

  if (req.user.role === 'teacher') {
    const teacher = await TeacherModel.findByUserId(req.user.id);
    if (!teacher) return errorResponse(res, 404, 'Teacher profile not found.');
    teacher_id = teacher.id;

    // Verify course belongs to teacher
    const course = await CourseModel.findById(course_id);
    if (!course || course.teacher_id !== teacher_id) {
      return errorResponse(res, 403, 'You are not authorized to add marks for this course.');
    }
  }

  const mark = await MarksModel.create({ student_id, course_id, teacher_id, exam_type, marks, total_marks });
  return createdResponse(res, 'Marks added successfully.', mark);
});

/**
 * GET /api/marks
 * All roles: Get marks with role-based filter
 */
const getAllMarks = asyncHandler(async (req, res) => {
  const { student_id, course_id, exam_type, page = 1, limit = 50 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const filters = { exam_type, limit: parseInt(limit), offset };

  if (req.user.role === 'student') {
    const studentProfile = await StudentModel.findByUserId(req.user.id);
    if (!studentProfile) return errorResponse(res, 404, 'Student profile not found.');
    filters.student_id = studentProfile.id;
  } else if (req.user.role === 'teacher') {
    const teacher = await TeacherModel.findByUserId(req.user.id);
    if (!teacher) return errorResponse(res, 404, 'Teacher profile not found.');
    filters.teacher_id = teacher.id;
    if (student_id) filters.student_id = parseInt(student_id);
    if (course_id)  filters.course_id  = parseInt(course_id);
  } else {
    if (student_id) filters.student_id = parseInt(student_id);
    if (course_id)  filters.course_id  = parseInt(course_id);
  }

  const marks = await MarksModel.findAll(filters);
  return successResponse(res, 200, 'Marks fetched successfully.', marks);
});

/**
 * GET /api/marks/:id
 * Get single mark record
 */
const getMarkById = asyncHandler(async (req, res) => {
  const mark = await MarksModel.findById(req.params.id);
  if (!mark) {
    return errorResponse(res, 404, `Mark record with ID ${req.params.id} not found.`);
  }
  return successResponse(res, 200, 'Mark record fetched.', mark);
});

/**
 * GET /api/marks/report/:studentId
 * Get complete marks report for a student
 */
const getStudentMarksReport = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  if (req.user.role === 'student') {
    const studentProfile = await StudentModel.findByUserId(req.user.id);
    if (!studentProfile || studentProfile.id !== parseInt(studentId)) {
      return errorResponse(res, 403, 'You can only view your own marks report.');
    }
  }

  const report = await MarksModel.getStudentReport(studentId);
  return successResponse(res, 200, 'Marks report fetched successfully.', report);
});

/**
 * PUT /api/marks/:id
 * Admin/Teacher: Update marks
 */
const updateMarks = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, 422, 'Validation failed', errors.array());
  }

  // Teacher can only update their own marks
  if (req.user.role === 'teacher') {
    const teacher = await TeacherModel.findByUserId(req.user.id);
    if (!teacher) return errorResponse(res, 404, 'Teacher profile not found.');
    const existingMark = await MarksModel.findById(req.params.id);
    if (!existingMark) return errorResponse(res, 404, 'Mark record not found.');
    if (existingMark.teacher_id !== teacher.id) {
      return errorResponse(res, 403, 'You can only update marks that you have added.');
    }
  }

  const mark = await MarksModel.update(req.params.id, req.body);
  if (!mark) {
    return errorResponse(res, 404, `Mark record with ID ${req.params.id} not found.`);
  }
  return successResponse(res, 200, 'Marks updated successfully.', mark);
});

/**
 * DELETE /api/marks/:id
 * Admin: Delete marks
 */
const deleteMarks = asyncHandler(async (req, res) => {
  const deleted = await MarksModel.delete(req.params.id);
  if (!deleted) {
    return errorResponse(res, 404, `Mark record with ID ${req.params.id} not found.`);
  }
  return noContentResponse(res);
});

module.exports = { addMarks, getAllMarks, getMarkById, getStudentMarksReport, updateMarks, deleteMarks };
