import api from './api';

export const announcementService = {
  getAll: async (params = {}) => {
    const response = await api.get('/announcements', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/announcements/${id}`);
    return response.data;
  },

  create: async (announcementData) => {
    const response = await api.post('/announcements', announcementData);
    return response.data;
  },

  update: async (id, announcementData) => {
    const response = await api.put(`/announcements/${id}`, announcementData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/announcements/${id}`);
    return response.data;
  },
};
