import api from './api';

export const feesService = {
  getAll: async (params = {}) => {
    const response = await api.get('/fees', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/fees/${id}`);
    return response.data;
  },

  getSummary: async (studentId) => {
    const response = await api.get(`/fees/summary/${studentId}`);
    return response.data;
  },

  create: async (feeData) => {
    const response = await api.post('/fees', feeData);
    return response.data;
  },

  update: async (id, feeData) => {
    const response = await api.put(`/fees/${id}`, feeData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/fees/${id}`);
    return response.data;
  },
};
