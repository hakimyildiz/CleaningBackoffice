import api from '../../../config/api';

export const customerService = {
  getCustomers: async (params) => {
    const response = await api.get('/customers', { params });
    return response.data;
  },

  getCustomerById: async (id) => {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  },

  createCustomer: async (data) => {
    const response = await api.post('/customers', data);
    return response.data;
  },

  updateCustomer: async (id, data) => {
    const response = await api.put(`/customers/${id}`, data);
    return response.data;
  },

  toggleStatus: async (id, isActive) => {
    const response = await api.patch(`/customers/${id}/status`, { isActive });
    return response.data;
  },

  deleteCustomer: async (id) => {
    const response = await api.delete(`/customers/${id}`);
    return response.data;
  }
};

export default customerService;
