const express = require('express');
const router = express.Router();
const {
  takeAttendance, bulkAttendance, getAllAttendance,
  getAttendanceById, getAttendanceSummary, generateAttendancePDF,
  updateAttendance, deleteAttendance,
} = require('../controllers/attendanceController');
const { verifyToken } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const {
  takeAttendanceValidator, bulkAttendanceValidator,
  updateAttendanceValidator, attendanceIdValidator,
} = require('../utils/validators/attendance.validator');

/**
 * @route   POST /api/attendance
 * @desc    Record attendance for a single student
 * @access  Admin, Teacher
 */
router.post('/', verifyToken, authorize('admin', 'teacher'), takeAttendanceValidator, takeAttendance);

/**
 * @route   POST /api/attendance/bulk
 * @desc    Bulk attendance for an entire class/course
 * @access  Admin, Teacher
 */
router.post('/bulk', verifyToken, authorize('admin', 'teacher'), bulkAttendanceValidator, bulkAttendance);

/**
 * @route   GET /api/attendance
 * @desc    Get attendance (Admin=all, Teacher=own courses, Student=own)
 * @access  Admin, Teacher, Student
 * @query   student_id, course_id, date, status, page, limit
 */
router.get('/', verifyToken, authorize('admin', 'teacher', 'student'), getAllAttendance);

/**
 * @route   GET /api/attendance/student/:id/pdf
 * @desc    Generate attendance PDF report
 * @access  Admin, Teacher, Student (own only)
 */
router.get('/student/:id/pdf', verifyToken, authorize('admin', 'teacher', 'student'), generateAttendancePDF);

/**
 * @route   GET /api/attendance/summary/:studentId/:courseId
 * @desc    Get attendance summary with percentage for a student in a course
 * @access  Admin, Teacher, Student (own only)
 */
router.get('/summary/:studentId/:courseId', verifyToken, authorize('admin', 'teacher', 'student'), getAttendanceSummary);

/**
 * @route   GET /api/attendance/:id
 * @desc    Get single attendance record by ID
 * @access  Admin, Teacher
 */
router.get('/:id', verifyToken, authorize('admin', 'teacher'), attendanceIdValidator, getAttendanceById);

/**
 * @route   PUT /api/attendance/:id
 * @desc    Update attendance status
 * @access  Admin, Teacher
 */
router.put('/:id', verifyToken, authorize('admin', 'teacher'), attendanceIdValidator, updateAttendanceValidator, updateAttendance);

/**
 * @route   DELETE /api/attendance/:id
 * @desc    Delete attendance record
 * @access  Admin
 */
router.delete('/:id', verifyToken, authorize('admin'), attendanceIdValidator, deleteAttendance);

module.exports = router;
