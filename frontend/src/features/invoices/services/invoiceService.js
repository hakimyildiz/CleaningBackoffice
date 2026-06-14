import api from '../../../config/api';

export const invoiceService = {
  getInvoices: async (params) => {
    const response = await api.get('/invoices', { params });
    return response.data;
  },

  getInvoiceById: async (id) => {
    const response = await api.get(`/invoices/${id}`);
    return response.data;
  },

  updateInvoice: async (id, data) => {
    const response = await api.put(`/invoices/${id}`, data);
    return response.data;
  },

  approveInvoice: async (id) => {
    const response = await api.patch(`/invoices/${id}/approve`);
    return response.data;
  },

  cancelInvoice: async (id) => {
    const response = await api.patch(`/invoices/${id}/cancel`);
    return response.data;
  },

  sendInvoiceEmail: async (id) => {
    const response = await api.post(`/invoices/${id}/send`);
    return response.data;
  },

  sendOverdueReminders: async (invoiceIds) => {
    const response = await api.post('/invoices/send-reminders', { invoiceIds });
    return response.data;
  }
};

export default invoiceService;
