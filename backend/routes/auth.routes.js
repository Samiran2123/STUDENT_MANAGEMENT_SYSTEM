const express = require('express');
const router = express.Router();
const { register, login, logout, getProfile, updateProfile } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { registerValidator, loginValidator, updateProfileValidator } = require('../utils/validators/auth.validator');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user (admin, teacher, student)
 * @access  Public
 */
router.post('/register', registerValidator, register);

/**
 * @route   POST /api/auth/login
 * @desc    Login and receive JWT token
 * @access  Public
 */
router.post('/login', loginValidator, login);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout (instructs client to discard token)
 * @access  Private
 */
router.post('/logout', verifyToken, logout);

/**
 * @route   GET /api/auth/profile
 * @desc    Get authenticated user's profile
 * @access  Private
 */
router.get('/profile', verifyToken, getProfile);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update authenticated user's profile (name, phone, password)
 * @access  Private
 */
router.put('/profile', verifyToken, updateProfileValidator, updateProfile);

module.exports = router;
