import api from './api';

export const marksService = {
  getAll: async (params = {}) => {
    const response = await api.get('/marks', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/marks/${id}`);
    return response.data;
  },

  getReport: async (studentId) => {
    const response = await api.get(`/marks/report/${studentId}`);
    return response.data;
  },

  add: async (marksData) => {
    const response = await api.post('/marks', marksData);
    return response.data;
  },

  update: async (id, marksData) => {
    const response = await api.put(`/marks/${id}`, marksData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/marks/${id}`);
    return response.data;
  },
};
