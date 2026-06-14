import api from '../../../config/api';

export const serviceOptionService = {
  getServiceOptions: async () => {
    const response = await api.get('/service-options');
    return response.data;
  },

  getAllServiceOptions: async (params) => {
    const response = await api.get('/service-options/all', { params });
    return response.data;
  },

  createServiceOption: async (data) => {
    const response = await api.post('/service-options', data);
    return response.data;
  },

  updateServiceOption: async (id, data) => {
    const response = await api.put(`/service-options/${id}`, data);
    return response.data;
  },

  toggleStatus: async (id, isActive) => {
    const response = await api.patch(`/service-options/${id}/status`, { isActive });
    return response.data;
  }
};

export default serviceOptionService;
