import api from './api';

export const erpService = {
  // Academic Years
  getAcademicYears: () => api.get('/erp/academic-years').then(r => r.data),
  createAcademicYear: (data) => api.post('/erp/academic-years', data).then(r => r.data),
  updateAcademicYear: (id, data) => api.put(`/erp/academic-years/${id}`, data).then(r => r.data),
  deleteAcademicYear: (id) => api.delete(`/erp/academic-years/${id}`).then(r => r.data),

  // Programs & Departments
  getPrograms: () => api.get('/erp/programs').then(r => r.data),
  getDepartments: () => api.get('/erp/departments').then(r => r.data),

  // Classes
  getClasses: (params = {}) => api.get('/erp/classes', { params }).then(r => r.data),
  createClass: (data) => api.post('/erp/classes', data).then(r => r.data),
  updateClass: (id, data) => api.put(`/erp/classes/${id}`, data).then(r => r.data),
  deleteClass: (id) => api.delete(`/erp/classes/${id}`).then(r => r.data),

  // Sections
  getSections: (classId) => {
    const url = classId ? `/erp/sections/${classId}` : '/erp/sections';
    return api.get(url).then(r => r.data);
  },
  createSection: (data) => api.post('/erp/sections', data).then(r => r.data),
  updateSection: (id, data) => api.put(`/erp/sections/${id}`, data).then(r => r.data),
  deleteSection: (id) => api.delete(`/erp/sections/${id}`).then(r => r.data),

  // Subjects
  getSubjects: (params = {}) => api.get('/erp/subjects', { params }).then(r => r.data),
  createSubject: (data) => api.post('/erp/subjects', data).then(r => r.data),
  updateSubject: (id, data) => api.put(`/erp/subjects/${id}`, data).then(r => r.data),
  deleteSubject: (id) => api.delete(`/erp/subjects/${id}`).then(r => r.data),

  // Admissions
  getPendingAdmissions: () => api.get('/erp/pending-admissions').then(r => r.data),
  approveAdmission: (id, data) => api.put(`/erp/admissions/${id}/approve`, data).then(r => r.data),
  rejectAdmission: (id, data) => api.put(`/erp/admissions/${id}/reject`, data).then(r => r.data),

  // Fee Structures
  getFeeStructures: (params = {}) => api.get('/erp/fee-structures', { params }).then(r => r.data),
  createFeeStructure: (data) => api.post('/erp/fee-structures', data).then(r => r.data),
  updateFeeStructure: (id, data) => api.put(`/erp/fee-structures/${id}`, data).then(r => r.data),
  deleteFeeStructure: (id) => api.delete(`/erp/fee-structures/${id}`).then(r => r.data),

  // Payments & Ledger
  getStudentLedger: () => api.get('/erp/my-ledger').then(r => r.data),
  submitPayment: (data) => api.post('/erp/payments', data).then(r => r.data),
  getPendingPayments: () => api.get('/erp/payments/pending').then(r => r.data),
  approvePayment: (id) => api.put(`/erp/payments/${id}/approve`).then(r => r.data),
  rejectPayment: (id) => api.put(`/erp/payments/${id}/reject`).then(r => r.data),
};

