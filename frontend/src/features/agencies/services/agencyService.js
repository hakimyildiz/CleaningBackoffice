import api from '../../../config/api';

export const agencyService = {
  getAgencies: async (params) => {
    const response = await api.get('/agencies', { params });
    return response.data;
  },

  getAgencyById: async (id) => {
    const response = await api.get(`/agencies/${id}`);
    return response.data;
  },

  createAgency: async (data) => {
    const response = await api.post('/agencies', data);
    return response.data;
  },

  updateAgency: async (id, data) => {
    const response = await api.put(`/agencies/${id}`, data);
    return response.data;
  },

  toggleStatus: async (id, isActive) => {
    const response = await api.patch(`/agencies/${id}/status`, { isActive });
    return response.data;
  },

  deleteAgency: async (id) => {
    const response = await api.delete(`/agencies/${id}`);
    return response.data;
  },

  getAgencyStaff: async (id) => {
    const response = await api.get(`/agencies/${id}/staff`);
    return response.data;
  }
};

export default agencyService;
