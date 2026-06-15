import api from '../../../config/api';

export const customerPortalService = {
  getOverview: async () => {
    const response = await api.get('/customer-portal/overview');
    return response.data;
  },

  getServices: async () => {
    const response = await api.get('/customer-portal/services');
    return response.data;
  },

  getSchedule: async () => {
    const response = await api.get('/customer-portal/schedule');
    return response.data;
  },

  getInvoices: async (params) => {
    const response = await api.get('/customer-portal/invoices', { params });
    return response.data;
  },

  getInvoiceDetail: async (id) => {
    const response = await api.get(`/customer-portal/invoices/${id}`);
    return response.data;
  },

  submitRequest: async (requestData) => {
    const response = await api.post('/customer-portal/requests', requestData);
    return response.data;
  },

  getRequests: async () => {
    const response = await api.get('/customer-portal/requests');
    return response.data;
  },

  getPhotos: async (serviceRecordId) => {
    const response = await api.get(`/customer-portal/photos/${serviceRecordId}`);
    return response.data;
  }
};

export default customerPortalService;
