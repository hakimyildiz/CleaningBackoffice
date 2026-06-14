import api from '../../../config/api';

export const requestService = {
  getRequests: async (params) => {
    const response = await api.get('/requests', { params });
    return response.data;
  },

  approveRequest: async (id, note) => {
    const response = await api.patch(`/requests/${id}/approve`, { note });
    return response.data;
  },

  rejectRequest: async (id, note) => {
    const response = await api.patch(`/requests/${id}/reject`, { note });
    return response.data;
  }
};

export default requestService;
