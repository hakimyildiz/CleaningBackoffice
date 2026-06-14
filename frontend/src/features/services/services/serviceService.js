import api from '../../../config/api';

export const serviceService = {
  getServices: async (params) => {
    const response = await api.get('/services', { params });
    return response.data;
  },

  getServiceById: async (id) => {
    const response = await api.get(`/services/${id}`);
    return response.data;
  },

  createService: async (data) => {
    const response = await api.post('/services', data);
    return response.data;
  },

  updateService: async (id, data) => {
    const response = await api.put(`/services/${id}`, data);
    return response.data;
  },

  toggleStatus: async (id, isActive) => {
    const response = await api.patch(`/services/${id}/status`, { isActive });
    return response.data;
  },

  deleteService: async (id) => {
    const response = await api.delete(`/services/${id}`);
    return response.data;
  },

  resolveEffectiveRate: async (params) => {
    const response = await api.get('/rates/resolve', { params });
    return response.data;
  },

  getServiceSchedule: async (serviceId) => {
    const response = await api.get(`/services/${serviceId}/schedule`);
    return response.data;
  },

  createPause: async (serviceId, data) => {
    const response = await api.post(`/services/${serviceId}/pause`, data);
    return response.data;
  },

  getPauses: async () => {
    const response = await api.get('/pauses');
    return response.data;
  },

  approvePause: async (id) => {
    const response = await api.patch(`/pauses/${id}/approve`);
    return response.data;
  },

  rejectPause: async (id) => {
    const response = await api.patch(`/pauses/${id}/reject`);
    return response.data;
  },

  getServiceHistory: async (serviceId, params) => {
    const response = await api.get(`/services/${serviceId}/history`, { params });
    return response.data;
  }
};

export default serviceService;
