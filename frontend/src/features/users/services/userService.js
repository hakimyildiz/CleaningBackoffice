import api from '../../../config/api';

export const userService = {
  getUsers: async (params) => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  toggleStatus: async (id, isActive) => {
    const response = await api.patch(`/users/${id}/status`, { isActive });
    return response.data;
  },

  resetPassword: async (id) => {
    const response = await api.post(`/users/${id}/reset-password`);
    return response.data;
  }
};

export default userService;
