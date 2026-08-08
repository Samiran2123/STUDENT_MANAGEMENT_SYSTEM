const express = require('express');
const router = express.Router();
const erpController = require('../controllers/erpController');
const { verifyToken } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

// Public ERP lookup routes (needed for Student Registration Application form)
router.get('/academic-years', erpController.getAcademicYears);
router.get('/programs', erpController.getPrograms);
router.get('/departments', erpController.getDepartments);
router.get('/classes', erpController.getClasses);
router.get('/sections', erpController.getSections);
router.get('/sections/:classId', erpController.getSections);

// Protected ERP routes
router.use(verifyToken);

router.get('/subjects', erpController.getSubjects);
router.get('/fee-structures', erpController.getFeeStructures);
router.get('/pending-admissions', authorize('admin'), erpController.getPendingAdmissions);

// Admission Actions
router.put('/admissions/:id/approve', authorize('admin'), erpController.approveStudentAdmission);
router.put('/admissions/:id/reject', authorize('admin'), erpController.rejectStudentAdmission);

// Payment Actions & Student Fee Ledger
router.get('/my-ledger', authorize('student'), erpController.getMyStudentLedger);
router.get('/student/fees', authorize('student'), erpController.getMyStudentLedger);
router.post('/payments', authorize('student'), erpController.createPayment);
router.post('/student/pay', authorize('student'), erpController.createPayment);
router.get('/payments/pending', authorize('admin'), erpController.getPendingPayments);
router.put('/payments/:id/approve', authorize('admin'), erpController.approvePayment);
router.put('/payments/:id/reject', authorize('admin'), erpController.rejectPayment);

module.exports = router;

