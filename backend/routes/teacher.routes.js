const express = require('express');
const router = express.Router();
const {
  createTeacher, getAllTeachers, getTeacherById,
  getMyTeacherProfile, updateTeacher, approveTeacher, deleteTeacher,
} = require('../controllers/teacherController');
const { verifyToken } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const upload = require('../middleware/upload');
const { createTeacherValidator, updateTeacherValidator, teacherIdValidator } = require('../utils/validators/teacher.validator');

/**
 * @route   POST /api/teachers
 * @desc    Create teacher profile (link to existing user)
 * @access  Admin
 */
router.post('/', verifyToken, authorize('admin'), upload.single('photo'), createTeacherValidator, createTeacher);

/**
 * @route   GET /api/teachers
 * @desc    Get all teachers with filters
 * @access  Admin
 * @query   department, status, page, limit
 */
router.get('/', verifyToken, authorize('admin'), getAllTeachers);

/**
 * @route   GET /api/teachers/my-profile
 * @desc    Teacher gets their own profile
 * @access  Teacher
 */
router.get('/my-profile', verifyToken, authorize('teacher'), getMyTeacherProfile);

/**
 * @route   GET /api/teachers/:id
 * @desc    Get teacher by ID
 * @access  Admin, Teacher (own only)
 */
router.get('/:id', verifyToken, authorize('admin', 'teacher'), teacherIdValidator, getTeacherById);

/**
 * @route   PUT /api/teachers/:id
 * @desc    Update teacher profile
 * @access  Admin
 */
router.put('/:id', verifyToken, authorize('admin'), upload.single('photo'), teacherIdValidator, updateTeacherValidator, updateTeacher);

/**
 * @route   PUT /api/teachers/:id/approve
 * @desc    Approve a pending teacher registration
 * @access  Admin
 */
router.put('/:id/approve', verifyToken, authorize('admin'), teacherIdValidator, approveTeacher);

/**
 * @route   DELETE /api/teachers/:id
 * @desc    Delete teacher profile
 * @access  Admin
 */
router.delete('/:id', verifyToken, authorize('admin'), teacherIdValidator, deleteTeacher);

module.exports = router;
