import api from '../../../config/api';

export const employeePaymentService = {
  getEarnings: async (params) => {
    const response = await api.get('/employee-payments/earnings', { params });
    return response.data;
  },

  getPayments: async (params) => {
    const response = await api.get('/employee-payments', { params });
    return response.data;
  },

  recordPayment: async (paymentData) => {
    const response = await api.post('/employee-payments', paymentData);
    return response.data;
  },

  deletePayment: async (id) => {
    const response = await api.delete(`/employee-payments/${id}`);
    return response.data;
  },

  getEmployees: async () => {
    const response = await api.get('/employees', { params: { limit: 100 } });
    return response.data;
  }
};

export default employeePaymentService;
