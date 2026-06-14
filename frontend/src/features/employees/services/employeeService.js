import api from '../../../config/api';

export const employeeService = {
  getEmployees: async (params) => {
    const response = await api.get('/employees', { params });
    return response.data;
  },

  getEmployeeById: async (id) => {
    const response = await api.get(`/employees/${id}`);
    return response.data;
  },

  createEmployee: async (data) => {
    const response = await api.post('/employees', data);
    return response.data;
  },

  updateEmployee: async (id, data) => {
    const response = await api.put(`/employees/${id}`, data);
    return response.data;
  },

  toggleStatus: async (id, isActive) => {
    const response = await api.patch(`/employees/${id}/status`, { isActive });
    return response.data;
  },

  deleteEmployee: async (id) => {
    const response = await api.delete(`/employees/${id}`);
    return response.data;
  }
};

export default employeeService;
