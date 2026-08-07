const { validationResult } = require('express-validator');
const AnnouncementModel = require('../models/announcementModel');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse, createdResponse, noContentResponse } = require('../utils/apiResponse');

/**
 * POST /api/announcements
 * Admin: Create an announcement
 */
const createAnnouncement = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, 422, 'Validation failed', errors.array());
  }

  const announcement = await AnnouncementModel.create({
    title: req.body.title,
    description: req.body.description,
    created_by: req.user.id,
  });

  return createdResponse(res, 'Announcement created successfully.', announcement);
});

/**
 * GET /api/announcements
 * All roles: Get all announcements (paginated)
 */
const getAllAnnouncements = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const [announcements, total] = await Promise.all([
    AnnouncementModel.findAll({ limit: parseInt(limit), offset }),
    AnnouncementModel.count(),
  ]);

  return successResponse(res, 200, 'Announcements fetched successfully.', announcements, {
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total / parseInt(limit)),
  });
});

/**
 * GET /api/announcements/:id
 * All roles: Get announcement by ID
 */
const getAnnouncementById = asyncHandler(async (req, res) => {
  const announcement = await AnnouncementModel.findById(req.params.id);
  if (!announcement) {
    return errorResponse(res, 404, `Announcement with ID ${req.params.id} not found.`);
  }
  return successResponse(res, 200, 'Announcement fetched successfully.', announcement);
});

/**
 * PUT /api/announcements/:id
 * Admin: Update announcement
 */
const updateAnnouncement = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, 422, 'Validation failed', errors.array());
  }

  const announcement = await AnnouncementModel.update(req.params.id, req.body);
  if (!announcement) {
    return errorResponse(res, 404, `Announcement with ID ${req.params.id} not found.`);
  }
  return successResponse(res, 200, 'Announcement updated successfully.', announcement);
});

/**
 * DELETE /api/announcements/:id
 * Admin: Delete announcement
 */
const deleteAnnouncement = asyncHandler(async (req, res) => {
  const deleted = await AnnouncementModel.delete(req.params.id);
  if (!deleted) {
    return errorResponse(res, 404, `Announcement with ID ${req.params.id} not found.`);
  }
  return noContentResponse(res);
});

module.exports = {
  createAnnouncement,
  getAllAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
};
