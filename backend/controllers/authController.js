const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const UserModel = require('../models/userModel');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse, createdResponse } = require('../utils/apiResponse');

/**
 * Generate JWT Token
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * POST /api/auth/register
 * Register a new user
 */
const register = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, 422, 'Validation failed', errors.array());
  }

  const { name, email, password, phone, role } = req.body;
  const userRole = role || 'student';

  // Check if email already exists
  const emailExists = await UserModel.emailExists(email);
  if (emailExists) {
    return errorResponse(res, 409, 'An account with this email already exists.');
  }

  // Hash password
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Create user
  const user = await UserModel.create({ name, email, password: hashedPassword, phone, role: userRole });

  if (userRole === 'student') {
    const StudentModel = require('../models/studentModel');
    await StudentModel.create({
      user_id: user.id,
      degree: req.body.degree || null,
      department: req.body.department || null,
      academic_year_id: req.body.academic_year_id ? parseInt(req.body.academic_year_id) : null,
      class_id: req.body.class_id ? parseInt(req.body.class_id) : null,
      semester: req.body.semester ? parseInt(req.body.semester) : 1,
      section_id: req.body.section_id ? parseInt(req.body.section_id) : null,
      admission_status: 'pending',
      status: 'inactive',
    });

    return createdResponse(res, 'Registration successful. Your admission application is pending admin approval.', {
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role },
      token: null,
    });
  } else if (userRole === 'teacher') {
    const TeacherModel = require('../models/teacherModel');
    const employee_id = `EMP-${user.id}-${Date.now()}`;
    await TeacherModel.create({ user_id: user.id, employee_id, department: req.body.department || 'General' });
  }

  // Generate token for non-students (admin/teacher)
  const token = generateToken(user);

  return createdResponse(res, 'Account created successfully.', {
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role },
    token,
  });
});

/**
 * POST /api/auth/login
 * Authenticate user and return JWT
 */
const login = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, 422, 'Validation failed', errors.array());
  }

  const { email, password } = req.body;

  // Find user by email
  const user = await UserModel.findByEmail(email);
  if (!user) {
    return errorResponse(res, 401, 'Invalid email or password.');
  }

  // Compare passwords
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return errorResponse(res, 401, 'Invalid email or password.');
  }

  // Check admission status for students
  if (user.role === 'student') {
    const StudentModel = require('../models/studentModel');
    const studentProfile = await StudentModel.findByUserId(user.id);
    
    if (!studentProfile || studentProfile.admission_status === 'rejected') {
      return errorResponse(res, 403, 'Your admission has been rejected.');
    }
    if (studentProfile.admission_status !== 'approved') {
      return errorResponse(res, 403, 'Your admission is pending admin approval.');
    }
  }

  // Generate token
  const token = generateToken(user);

  return successResponse(res, 200, 'Login successful.', {
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role },
    token,
  });
});

/**
 * POST /api/auth/logout
 * Client-side logout (token invalidation note)
 */
const logout = asyncHandler(async (req, res) => {
  // JWT is stateless — client must discard the token.
  // For server-side invalidation, implement a token blacklist (Redis recommended).
  return successResponse(res, 200, 'Logged out successfully. Please discard your token.');
});

/**
 * GET /api/auth/profile
 * Get authenticated user's profile
 */
const getProfile = asyncHandler(async (req, res) => {
  const user = await UserModel.findById(req.user.id);
  if (!user) {
    return errorResponse(res, 404, 'User not found.');
  }
  return successResponse(res, 200, 'Profile fetched successfully.', user);
});

/**
 * PUT /api/auth/profile
 * Update authenticated user's profile
 */
const updateProfile = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, 422, 'Validation failed', errors.array());
  }

  const { name, phone, currentPassword, newPassword } = req.body;
  const updateFields = {};

  if (name)  updateFields.name  = name;
  if (phone) updateFields.phone = phone;

  // Handle password change
  if (newPassword) {
    if (!currentPassword) {
      return errorResponse(res, 400, 'Current password is required to set a new password.');
    }

    // Fetch user with password for verification
    const userWithPwd = await UserModel.findByEmail(req.user.email);
    const isValid = await bcrypt.compare(currentPassword, userWithPwd.password);
    if (!isValid) {
      return errorResponse(res, 401, 'Current password is incorrect.');
    }

    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    updateFields.password = await bcrypt.hash(newPassword, saltRounds);
  }

  if (!Object.keys(updateFields).length) {
    return errorResponse(res, 400, 'No update fields provided.');
  }

  const updatedUser = await UserModel.update(req.user.id, updateFields);
  return successResponse(res, 200, 'Profile updated successfully.', updatedUser);
});

module.exports = { register, login, logout, getProfile, updateProfile };
