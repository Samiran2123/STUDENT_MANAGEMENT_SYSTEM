const express = require('express');
const router = express.Router();
const {
  addMarks, getAllMarks, getMarkById,
  getStudentMarksReport, updateMarks, deleteMarks,
} = require('../controllers/marksController');
const { verifyToken } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { addMarksValidator, updateMarksValidator, marksIdValidator } = require('../utils/validators/marks.validator');

/**
 * @route   POST /api/marks
 * @desc    Add marks for a student
 * @access  Admin, Teacher
 */
router.post('/', verifyToken, authorize('admin', 'teacher'), addMarksValidator, addMarks);

/**
 * @route   GET /api/marks
 * @desc    Get marks (Admin=all, Teacher=own courses, Student=own)
 * @access  Admin, Teacher, Student
 * @query   student_id, course_id, exam_type, page, limit
 */
router.get('/', verifyToken, authorize('admin', 'teacher', 'student'), getAllMarks);

/**
 * @route   GET /api/marks/report/:studentId
 * @desc    Get complete marks report for a student across all courses
 * @access  Admin, Teacher, Student (own only)
 */
router.get('/report/:studentId', verifyToken, authorize('admin', 'teacher', 'student'), getStudentMarksReport);

/**
 * @route   GET /api/marks/:id
 * @desc    Get single mark record by ID
 * @access  Admin, Teacher
 */
router.get('/:id', verifyToken, authorize('admin', 'teacher'), marksIdValidator, getMarkById);

/**
 * @route   PUT /api/marks/:id
 * @desc    Update marks
 * @access  Admin, Teacher (own only)
 */
router.put('/:id', verifyToken, authorize('admin', 'teacher'), marksIdValidator, updateMarksValidator, updateMarks);

/**
 * @route   DELETE /api/marks/:id
 * @desc    Delete marks record
 * @access  Admin
 */
router.delete('/:id', verifyToken, authorize('admin'), marksIdValidator, deleteMarks);

module.exports = router;
