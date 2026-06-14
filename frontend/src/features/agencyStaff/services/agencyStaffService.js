import api from '../../../config/api';

export const agencyStaffService = {
  getAgencyStaff: async (params) => {
    const response = await api.get('/agency-staff', { params });
    return response.data;
  },

  getAgencyStaffById: async (id) => {
    const response = await api.get(`/agency-staff/${id}`);
    return response.data;
  },

  createAgencyStaff: async (data) => {
    const response = await api.post('/agency-staff', data);
    return response.data;
  },

  updateAgencyStaff: async (id, data) => {
    const response = await api.put(`/agency-staff/${id}`, data);
    return response.data;
  },

  toggleStatus: async (id, isActive) => {
    const response = await api.patch(`/agency-staff/${id}/status`, { isActive });
    return response.data;
  },

  deleteAgencyStaff: async (id) => {
    const response = await api.delete(`/agency-staff/${id}`);
    return response.data;
  },

  getAgencies: async () => {
    const response = await api.get('/agencies/lookup');
    return response.data;
  }
};

export default agencyStaffService;
