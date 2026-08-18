import api from './api';

export const attendanceService = {
  getAll: async (params = {}) => {
    const response = await api.get('/attendance', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/attendance/${id}`);
    return response.data;
  },

  getSummary: async (studentId, courseId) => {
    const response = await api.get(`/attendance/summary/${studentId}/${courseId}`);
    return response.data;
  },

  record: async (attendanceData) => {
    const response = await api.post('/attendance', attendanceData);
    return response.data;
  },

  recordBulk: async (bulkData) => {
    const response = await api.post('/attendance/bulk', bulkData);
    return response.data;
  },

  update: async (id, attendanceData) => {
    const response = await api.put(`/attendance/${id}`, attendanceData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/attendance/${id}`);
    return response.data;
  },

  getStudentReport: async (studentId) => {
    // Fetch all records for this specific student to build the preview
    const response = await api.get('/attendance', {
      params: { student_id: studentId, limit: 500 },
    });
    return response.data;
  },

  downloadStudentAttendancePDF: async (studentId, filename) => {
    const response = await api.get(`/attendance/student/${studentId}/pdf`, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `attendance_report_${studentId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    return { success: true };
  },
};
