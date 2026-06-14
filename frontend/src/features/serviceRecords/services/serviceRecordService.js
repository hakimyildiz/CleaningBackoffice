import api from '../../../config/api';

export const serviceRecordService = {
  getServiceRecords: async (params) => {
    const response = await api.get('/service-records', { params });
    return response.data;
  },

  getServiceRecordById: async (id) => {
    const response = await api.get(`/service-records/${id}`);
    return response.data;
  },

  checkIn: async ({ scheduleId, lat, lng }) => {
    const response = await api.post('/service-records/checkin', { scheduleId, lat, lng });
    return response.data;
  },

  checkOut: async (id, formData) => {
    // Requires multipart/form-data header for photos upload
    const response = await api.post(`/service-records/${id}/checkout`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  cancelServiceRecord: async (id) => {
    const response = await api.patch(`/service-records/${id}/cancel`);
    return response.data;
  },

  assignCleanersToSchedule: async (scheduleId, employeeIds) => {
    const response = await api.post(`/service-records/schedule/${scheduleId}/assign`, { employeeIds });
    return response.data;
  },

  removeCleanerFromSchedule: async (scheduleId, employeeId) => {
    const response = await api.delete(`/service-records/schedule/${scheduleId}/assign/${employeeId}`);
    return response.data;
  },

  getScheduleCleaners: async (scheduleId) => {
    const response = await api.get(`/service-records/schedule/${scheduleId}/cleaners`);
    return response.data;
  },

  addCleanerToRecord: async (id, employeeId) => {
    const response = await api.post(`/service-records/${id}/assign`, { employeeId });
    return response.data;
  },

  removeCleanerFromRecord: async (id, employeeId) => {
    const response = await api.delete(`/service-records/${id}/assign/${employeeId}`);
    return response.data;
  },

  updateScheduleStatus: async (scheduleId, status) => {
    const response = await api.patch(`/schedule/${scheduleId}/status`, { status });
    return response.data;
  },

  getGlobalSchedule: async (params) => {
    const response = await api.get('/schedule', { params });
    return response.data;
  }
};

export default serviceRecordService;
