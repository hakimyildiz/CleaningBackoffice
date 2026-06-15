import api from '../../../config/api';

export const agencyPortalService = {
  getOverview: async () => {
    const response = await api.get('/agency-portal/overview');
    return response.data;
  },

  getProperties: async () => {
    const response = await api.get('/agency-portal/properties');
    return response.data;
  },

  getSchedule: async () => {
    const response = await api.get('/agency-portal/schedule');
    return response.data;
  },

  getInvoices: async (params) => {
    const response = await api.get('/agency-portal/invoices', { params });
    return response.data;
  },

  getInvoiceDetail: async (id) => {
    const response = await api.get(`/agency-portal/invoices/${id}`);
    return response.data;
  },

  getCreditBalance: async () => {
    const response = await api.get('/agency-portal/credit');
    return response.data;
  },

  submitRequest: async (requestData) => {
    const response = await api.post('/agency-portal/requests', requestData);
    return response.data;
  },

  getRequests: async () => {
    const response = await api.get('/agency-portal/requests');
    return response.data;
  },

  getStaffAssignments: async () => {
    const response = await api.get('/agency-portal/staff-assignments');
    return response.data;
  }
};

export default agencyPortalService;
