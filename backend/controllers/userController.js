const { validationResult } = require('express-validator');
const UserModel = require('../models/userModel');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse, noContentResponse } = require('../utils/apiResponse');

/**
 * GET /api/users
 * Admin: Get all users with optional role filter & pagination
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const { role, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const [users, total] = await Promise.all([
    UserModel.findAll({ role, limit: parseInt(limit), offset }),
    UserModel.count(role),
  ]);

  return successResponse(res, 200, 'Users fetched successfully.', users, {
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total / parseInt(limit)),
  });
});

/**
 * GET /api/users/:id
 * Admin: Get single user by ID
 */
const getUserById = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, 422, 'Validation failed', errors.array());
  }
  const user = await UserModel.findById(req.params.id);
  if (!user) {
    return errorResponse(res, 404, `User with ID ${req.params.id} not found.`);
  }
  return successResponse(res, 200, 'User fetched successfully.', user);
});

/**
 * DELETE /api/users/:id
 * Admin: Delete user by ID
 */
const deleteUser = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, 422, 'Validation failed', errors.array());
  }

  const userId = parseInt(req.params.id);

  // Prevent self-deletion
  if (userId === req.user.id) {
    return errorResponse(res, 400, 'You cannot delete your own account.');
  }

  const deleted = await UserModel.delete(userId);
  if (!deleted) {
    return errorResponse(res, 404, `User with ID ${userId} not found.`);
  }

  return noContentResponse(res);
});

module.exports = { getAllUsers, getUserById, deleteUser };
