const express = require('express');
const router = express.Router();
const {
  createCourse, getAllCourses, getCourseById,
  updateCourse, assignTeacher, deleteCourse,
} = require('../controllers/courseController');
const { verifyToken } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const {
  createCourseValidator, updateCourseValidator,
  assignTeacherValidator, courseIdValidator,
} = require('../utils/validators/course.validator');

/**
 * @route   POST /api/courses
 * @desc    Create a course
 * @access  Admin
 */
router.post('/', verifyToken, authorize('admin'), createCourseValidator, createCourse);

/**
 * @route   GET /api/courses
 * @desc    Get all courses (teachers see own; students see all)
 * @access  Admin, Teacher, Student
 * @query   department, semester, page, limit
 */
router.get('/', verifyToken, authorize('admin', 'teacher', 'student'), getAllCourses);

/**
 * @route   GET /api/courses/:id
 * @desc    Get course by ID
 * @access  Admin, Teacher (own), Student
 */
router.get('/:id', verifyToken, authorize('admin', 'teacher', 'student'), courseIdValidator, getCourseById);

/**
 * @route   PUT /api/courses/:id
 * @desc    Update course details
 * @access  Admin
 */
router.put('/:id', verifyToken, authorize('admin'), courseIdValidator, updateCourseValidator, updateCourse);

/**
 * @route   PUT /api/courses/:id/assign-teacher
 * @desc    Assign a teacher to a course
 * @access  Admin
 */
router.put('/:id/assign-teacher', verifyToken, authorize('admin'), courseIdValidator, assignTeacherValidator, assignTeacher);

/**
 * @route   DELETE /api/courses/:id
 * @desc    Delete course
 * @access  Admin
 */
router.delete('/:id', verifyToken, authorize('admin'), courseIdValidator, deleteCourse);

module.exports = router;
