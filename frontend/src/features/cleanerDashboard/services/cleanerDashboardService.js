import api from '../../../config/api';

export const cleanerDashboardService = {
  getCleanerJobs: async () => {
    const response = await api.get('/cleaner/jobs');
    return response.data;
  }
};

export default cleanerDashboardService;
