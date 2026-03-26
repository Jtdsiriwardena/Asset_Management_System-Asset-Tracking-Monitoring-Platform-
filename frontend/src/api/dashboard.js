import axios from './axios';

export const dashboardAPI = {
  // Get all dashboard data
  getDashboardData: () => axios.get('/dashboard/'),
  
  // Get summary statistics
  getSummary: () => axios.get('/dashboard/summary/'),
  
  // Get asset statistics
  getAssetStats: (params = {}) => axios.get('/dashboard/assets/', { params }),
  
  // Get assignment statistics
  getAssignmentStats: (params = {}) => axios.get('/dashboard/assignments/', { params }),
  
  // Export data
  exportData: (type = 'all', format = 'csv') => 
    axios.get(`/dashboard/export/?type=${type}&format=${format}`, {
      responseType: 'blob'
    }),
};