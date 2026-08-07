import api from './api';

export const courseService = {
  getAll: async (params = {}) => {
    const response = await api.get('/courses', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/courses/${id}`);
    return response.data;
  },

  create: async (courseData) => {
    const response = await api.post('/courses', courseData);
    return response.data;
  },

  update: async (id, courseData) => {
    const response = await api.put(`/courses/${id}`, courseData);
    return response.data;
  },

  assignTeacher: async (id, teacher_id) => {
    const response = await api.put(`/courses/${id}/assign-teacher`, { teacher_id });
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/courses/${id}`);
    return response.data;
  },
};
