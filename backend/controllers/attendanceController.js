const { validationResult } = require('express-validator');
const AttendanceModel = require('../models/attendanceModel');
const TeacherModel = require('../models/teacherModel');
const StudentModel = require('../models/studentModel');
const CourseModel = require('../models/courseModel');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse, createdResponse, noContentResponse } = require('../utils/apiResponse');

/**
 * Resolve logged-in teacher's teacher_id
 */
const resolveTeacherId = async (userId) => {
  const teacher = await TeacherModel.findByUserId(userId);
  return teacher ? teacher.id : null;
};

/**
 * POST /api/attendance
 * Admin/Teacher: Take attendance for a single student
 */
const takeAttendance = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, 422, 'Validation failed', errors.array());
  }

  const { student_id, course_id, date, status } = req.body;
  let teacher_id = req.body.teacher_id;

  // Teacher gets their own teacher_id automatically
  if (req.user.role === 'teacher') {
    teacher_id = await resolveTeacherId(req.user.id);
    if (!teacher_id) return errorResponse(res, 404, 'Teacher profile not found.');

    // Verify course belongs to this teacher
    const course = await CourseModel.findById(course_id);
    if (!course || course.teacher_id !== teacher_id) {
      return errorResponse(res, 403, 'You are not authorized to take attendance for this course.');
    }
  }

  const attendance = await AttendanceModel.create({ student_id, course_id, teacher_id, date, status });
  return createdResponse(res, 'Attendance recorded successfully.', attendance);
});

/**
 * POST /api/attendance/bulk
 * Admin/Teacher: Bulk attendance for a course
 */
const bulkAttendance = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, 422, 'Validation failed', errors.array());
  }

  const { course_id, date, records } = req.body;
  let teacher_id = req.body.teacher_id;

  if (req.user.role === 'teacher') {
    teacher_id = await resolveTeacherId(req.user.id);
    if (!teacher_id) return errorResponse(res, 404, 'Teacher profile not found.');

    const course = await CourseModel.findById(course_id);
    if (!course || course.teacher_id !== teacher_id) {
      return errorResponse(res, 403, 'You are not authorized to take attendance for this course.');
    }
  }

  const result = await AttendanceModel.bulkCreate(records, course_id, teacher_id, date);
  return createdResponse(res, `${result.length} attendance records saved successfully.`, result);
});

/**
 * GET /api/attendance
 * All roles: View attendance with role-based filter
 */
const getAllAttendance = asyncHandler(async (req, res) => {
  const { student_id, course_id, date, status, page = 1, limit = 50 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const filters = { date, status, limit: parseInt(limit), offset };

  if (req.user.role === 'student') {
    // Students see only their own attendance
    const studentProfile = await StudentModel.findByUserId(req.user.id);
    if (!studentProfile) return errorResponse(res, 404, 'Student profile not found.');
    filters.student_id = studentProfile.id;
  } else if (req.user.role === 'teacher') {
    // Teacher sees only their courses' attendance
    const teacher = await TeacherModel.findByUserId(req.user.id);
    if (!teacher) return errorResponse(res, 404, 'Teacher profile not found.');
    filters.teacher_id = teacher.id;
    if (course_id) filters.course_id = parseInt(course_id);
    if (student_id) filters.student_id = parseInt(student_id);
  } else {
    // Admin sees all
    if (student_id) filters.student_id = parseInt(student_id);
    if (course_id)  filters.course_id  = parseInt(course_id);
  }

  const records = await AttendanceModel.findAll(filters);
  return successResponse(res, 200, 'Attendance fetched successfully.', records);
});

/**
 * GET /api/attendance/:id
 * Get single attendance record
 */
const getAttendanceById = asyncHandler(async (req, res) => {
  const record = await AttendanceModel.findById(req.params.id);
  if (!record) {
    return errorResponse(res, 404, `Attendance record with ID ${req.params.id} not found.`);
  }
  return successResponse(res, 200, 'Attendance record fetched.', record);
});

/**
 * GET /api/attendance/summary/:studentId/:courseId
 * Get attendance summary for a student in a course
 */
const getAttendanceSummary = asyncHandler(async (req, res) => {
  const { studentId, courseId } = req.params;

  // Students can only see their own summary
  if (req.user.role === 'student') {
    const studentProfile = await StudentModel.findByUserId(req.user.id);
    if (!studentProfile || studentProfile.id !== parseInt(studentId)) {
      return errorResponse(res, 403, 'You can only view your own attendance summary.');
    }
  }

  const summary = await AttendanceModel.getSummary(studentId, courseId);
  return successResponse(res, 200, 'Attendance summary fetched.', summary);
});

/**
 * PUT /api/attendance/:id
 * Admin/Teacher: Update attendance status
 */
const updateAttendance = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, 422, 'Validation failed', errors.array());
  }

  const record = await AttendanceModel.update(req.params.id, req.body.status);
  if (!record) {
    return errorResponse(res, 404, `Attendance record with ID ${req.params.id} not found.`);
  }
  return successResponse(res, 200, 'Attendance updated successfully.', record);
});

/**
 * DELETE /api/attendance/:id
 * Admin: Delete attendance record
 */
const deleteAttendance = asyncHandler(async (req, res) => {
  const deleted = await AttendanceModel.delete(req.params.id);
  if (!deleted) {
    return errorResponse(res, 404, `Attendance record with ID ${req.params.id} not found.`);
  }
  return noContentResponse(res);
});

module.exports = {
  takeAttendance,
  bulkAttendance,
  getAllAttendance,
  getAttendanceById,
  getAttendanceSummary,
  updateAttendance,
  deleteAttendance,
};
