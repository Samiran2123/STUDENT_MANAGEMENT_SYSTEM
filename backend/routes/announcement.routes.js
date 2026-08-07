const express = require('express');
const router = express.Router();
const {
  createAnnouncement, getAllAnnouncements,
  getAnnouncementById, updateAnnouncement, deleteAnnouncement,
} = require('../controllers/announcementController');
const { verifyToken } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const {
  createAnnouncementValidator,
  updateAnnouncementValidator,
  announcementIdValidator,
} = require('../utils/validators/announcement.validator');

/**
 * @route   POST /api/announcements
 * @desc    Create a new announcement
 * @access  Admin
 */
router.post('/', verifyToken, authorize('admin'), createAnnouncementValidator, createAnnouncement);

/**
 * @route   GET /api/announcements
 * @desc    Get all announcements (all roles)
 * @access  Admin, Teacher, Student
 * @query   page, limit
 */
router.get('/', verifyToken, authorize('admin', 'teacher', 'student'), getAllAnnouncements);

/**
 * @route   GET /api/announcements/:id
 * @desc    Get announcement by ID
 * @access  Admin, Teacher, Student
 */
router.get('/:id', verifyToken, authorize('admin', 'teacher', 'student'), announcementIdValidator, getAnnouncementById);

/**
 * @route   PUT /api/announcements/:id
 * @desc    Update announcement
 * @access  Admin
 */
router.put('/:id', verifyToken, authorize('admin'), announcementIdValidator, updateAnnouncementValidator, updateAnnouncement);

/**
 * @route   DELETE /api/announcements/:id
 * @desc    Delete announcement
 * @access  Admin
 */
router.delete('/:id', verifyToken, authorize('admin'), announcementIdValidator, deleteAnnouncement);

module.exports = router;
