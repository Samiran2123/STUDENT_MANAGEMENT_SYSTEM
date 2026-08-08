const { successResponse, errorResponse } = require('../utils/apiResponse');
const ErpModel = require('../models/erpModel');
const StudentModel = require('../models/studentModel');

const erpController = {
  getAcademicYears: async (req, res) => {
    try {
      const data = await ErpModel.getAcademicYears();
      return successResponse(res, 200, 'Academic years fetched', data);
    } catch (err) {
      return errorResponse(res, 500, err.message);
    }
  },
  getPrograms: async (req, res) => {
    try {
      const data = await ErpModel.getPrograms();
      return successResponse(res, 200, 'Programs fetched', data);
    } catch (err) {
      return errorResponse(res, 500, err.message);
    }
  },
  getDepartments: async (req, res) => {
    try {
      const data = await ErpModel.getDepartments();
      return successResponse(res, 200, 'Departments fetched', data);
    } catch (err) {
      return errorResponse(res, 500, err.message);
    }
  },
  getClasses: async (req, res) => {
    try {
      const { degree, department } = req.query;
      const data = await ErpModel.getClasses({ degree, department });
      return successResponse(res, 200, 'Classes fetched', data);
    } catch (err) {
      return errorResponse(res, 500, err.message);
    }
  },
  getSections: async (req, res) => {
    try {
      const classId = req.params.classId || req.query.class_id || req.query.classId;
      const data = await ErpModel.getSectionsByClass(classId);
      return successResponse(res, 200, 'Sections fetched', data);
    } catch (err) {
      return errorResponse(res, 500, err.message);
    }
  },
  getSubjects: async (req, res) => {
    try {
      const { class_id } = req.query;
      let data;
      if (class_id) {
        data = await ErpModel.getClassSubjects(class_id);
      } else {
        data = await ErpModel.getSubjects();
      }
      return successResponse(res, 200, 'Subjects fetched', data);
    } catch (err) {
      return errorResponse(res, 500, err.message);
    }
  },
  getFeeStructures: async (req, res) => {
    try {
      const { class_id, academic_year_id } = req.query;
      if (class_id && academic_year_id) {
        const data = await ErpModel.getFeeStructure(class_id, academic_year_id);
        return successResponse(res, 200, 'Fee structure fetched', data);
      }
      const data = await ErpModel.getFeeStructures();
      return successResponse(res, 200, 'Fee structures fetched', data);
    } catch (err) {
      return errorResponse(res, 500, err.message);
    }
  },
  getPendingAdmissions: async (req, res) => {
    try {
      const data = await ErpModel.getPendingAdmissions();
      return successResponse(res, 200, 'Pending admissions fetched', data);
    } catch (err) {
      return errorResponse(res, 500, err.message);
    }
  },
  approveStudentAdmission: async (req, res) => {
    try {
      const { id } = req.params;
      const { 
        class_id, section_id, academic_year_id,
        degree, department, semester, year_level,
        roll_number, student_code, subject_ids 
      } = req.body;

      if (!class_id || !section_id) {
        return errorResponse(res, 400, 'class_id and section_id are required');
      }

      const student = await StudentModel.findById(id);
      if (!student) return errorResponse(res, 404, 'Student profile not found');
      if (student.admission_status === 'approved') return errorResponse(res, 400, 'Student admission is already approved');

      let activeYearId = academic_year_id;
      if (!activeYearId) {
        const activeYear = await ErpModel.getActiveAcademicYear();
        activeYearId = activeYear ? activeYear.id : 1;
      }

      const result = await ErpModel.approveStudentAdmission({
        student_id: parseInt(id),
        class_id: parseInt(class_id),
        section_id: parseInt(section_id),
        academic_year_id: parseInt(activeYearId),
        degree,
        department,
        semester: semester ? parseInt(semester) : undefined,
        year_level: year_level ? parseInt(year_level) : undefined,
        roll_number,
        student_code,
        subject_ids
      });

      return successResponse(res, 200, 'Student admission approved successfully', result);
    } catch (err) {
      return errorResponse(res, 500, err.message);
    }
  },
  rejectStudentAdmission: async (req, res) => {
    try {
      const { id } = req.params;
      const student = await StudentModel.findById(id);
      if (!student) return errorResponse(res, 404, 'Student not found');

      await ErpModel.rejectStudentAdmission(id);
      return successResponse(res, 200, 'Student admission rejected successfully', null);
    } catch (err) {
      return errorResponse(res, 500, err.message);
    }
  },

  // Payment Endpoints
  createPayment: async (req, res) => {
    try {
      const student = await StudentModel.findByUserId(req.user.id);
      if (!student) return errorResponse(res, 404, 'Student profile not found');

      const { student_fee_id, amount, payment_method, transaction_reference } = req.body;
      if (!student_fee_id || !amount) {
        return errorResponse(res, 400, 'student_fee_id and amount are required');
      }

      const payment = await ErpModel.createPayment({
        student_id: student.id,
        student_fee_id,
        amount,
        payment_method,
        transaction_reference
      });

      return successResponse(res, 201, 'Payment submitted for admin verification', payment);
    } catch (err) {
      return errorResponse(res, 500, err.message);
    }
  },
  getPendingPayments: async (req, res) => {
    try {
      const data = await ErpModel.getPendingPayments();
      return successResponse(res, 200, 'Pending payments fetched', data);
    } catch (err) {
      return errorResponse(res, 500, err.message);
    }
  },
  approvePayment: async (req, res) => {
    try {
      const { id } = req.params;
      const payment = await ErpModel.approvePayment(id, req.user.id);
      return successResponse(res, 200, 'Payment verified and fee ledger updated successfully', payment);
    } catch (err) {
      return errorResponse(res, 500, err.message);
    }
  },
  rejectPayment: async (req, res) => {
    try {
      const { id } = req.params;
      const payment = await ErpModel.rejectPayment(id);
      return successResponse(res, 200, 'Payment rejected', payment);
    } catch (err) {
      return errorResponse(res, 500, err.message);
    }
  },
  getMyStudentLedger: async (req, res) => {
    try {
      const student = await StudentModel.findByUserId(req.user.id);
      if (!student) return errorResponse(res, 404, 'Student profile not found');

      const [ledger, payments] = await Promise.all([
        ErpModel.getStudentFeeLedger(student.id),
        ErpModel.getStudentPayments(student.id)
      ]);

      return successResponse(res, 200, 'Student fee ledger fetched', { ledger, payments });
    } catch (err) {
      return errorResponse(res, 500, err.message);
    }
  }
};

module.exports = erpController;

