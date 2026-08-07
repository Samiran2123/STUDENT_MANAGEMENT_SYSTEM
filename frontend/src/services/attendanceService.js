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
};
