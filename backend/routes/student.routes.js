const express = require('express');
const router = express.Router();
const {
  createStudent, getAllStudents, getStudentById,
  getMyStudentProfile, updateStudent, deleteStudent,
} = require('../controllers/studentController');
const { verifyToken } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const upload = require('../middleware/upload');
const { createStudentValidator, updateStudentValidator, studentIdValidator } = require('../utils/validators/student.validator');

/**
 * @route   POST /api/students
 * @desc    Create a student profile (link to existing user)
 * @access  Admin
 */
router.post('/', verifyToken, authorize('admin'), upload.single('photo'), createStudentValidator, createStudent);

/**
 * @route   GET /api/students
 * @desc    Get all students with filters (department, semester, status)
 * @access  Admin, Teacher
 * @query   department, semester, status, page, limit
 */
router.get('/', verifyToken, authorize('admin', 'teacher'), getAllStudents);

/**
 * @route   GET /api/students/my-profile
 * @desc    Student gets their own profile
 * @access  Student
 */
router.get('/my-profile', verifyToken, authorize('student'), getMyStudentProfile);

/**
 * @route   GET /api/students/:id
 * @desc    Get student by ID
 * @access  Admin, Teacher, Student (own only)
 */
router.get('/:id', verifyToken, authorize('admin', 'teacher', 'student'), studentIdValidator, getStudentById);

/**
 * @route   GET /api/students/:id/subjects
 * @desc    Get assigned subjects for student
 * @access  Admin, Teacher, Student (own only)
 */
router.get('/:id/subjects', verifyToken, authorize('admin', 'teacher', 'student'), studentIdValidator, require('../controllers/studentController').getAssignedSubjects);

/**
 * @route   PUT /api/students/:id
 * @desc    Update student profile
 * @access  Admin
 */
router.put('/:id', verifyToken, authorize('admin'), upload.single('photo'), studentIdValidator, updateStudentValidator, updateStudent);

/**
 * @route   DELETE /api/students/:id
 * @desc    Delete student profile
 * @access  Admin
 */
router.delete('/:id', verifyToken, authorize('admin'), studentIdValidator, deleteStudent);

module.exports = router;
