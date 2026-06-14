import api from '../../../config/api';

export const paymentService = {
  getPayments: async (params) => {
    const response = await api.get('/payments', { params });
    return response.data;
  },

  getInvoicePayments: async (invoiceId) => {
    const response = await api.get(`/invoices/${invoiceId}/payments`);
    return response.data;
  },

  recordPayment: async (invoiceId, paymentData) => {
    const response = await api.post(`/invoices/${invoiceId}/payments`, paymentData);
    return response.data;
  },

  deletePayment: async (id) => {
    const response = await api.delete(`/payments/${id}`);
    return response.data;
  },

  getCredits: async (params) => {
    const response = await api.get('/credits', { params });
    return response.data;
  },

  getCustomerCreditBalance: async (customerId) => {
    const response = await api.get(`/credits/balance/${customerId}`);
    return response.data;
  },

  getAgencyCreditBalance: async (agencyId) => {
    const response = await api.get(`/credits/balance/agency/${agencyId}`);
    return response.data;
  },

  adjustCredit: async (adjustmentData) => {
    const response = await api.post('/credits/adjust', adjustmentData);
    return response.data;
  }
};

export default paymentService;
