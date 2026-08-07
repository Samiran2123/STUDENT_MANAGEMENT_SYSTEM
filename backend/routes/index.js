const express = require('express');
const router = express.Router();

const authRoutes         = require('./auth.routes');
const userRoutes         = require('./user.routes');
const studentRoutes      = require('./student.routes');
const teacherRoutes      = require('./teacher.routes');
const courseRoutes       = require('./course.routes');
const attendanceRoutes   = require('./attendance.routes');
const marksRoutes        = require('./marks.routes');
const feesRoutes         = require('./fees.routes');
const announcementRoutes = require('./announcement.routes');

// Mount all routes
router.use('/auth',          authRoutes);
router.use('/users',         userRoutes);
router.use('/students',      studentRoutes);
router.use('/teachers',      teacherRoutes);
router.use('/courses',       courseRoutes);
router.use('/attendance',    attendanceRoutes);
router.use('/marks',         marksRoutes);
router.use('/fees',          feesRoutes);
router.use('/announcements', announcementRoutes);

module.exports = router;
