import axios from './axios';

export const historyAPI = {
  // Get audit logs with filters
  getLogs: (params = {}) => axios.get('/history/logs/', { params }),
  
  // Get single log details
  getLog: (id) => axios.get(`/history/logs/${id}/`),
  
  // Get log details (large changes)
  getLogDetails: (id) => axios.get(`/history/logs/${id}/details/`),
  
  // Get log summary statistics
  getSummary: () => axios.get('/history/logs/summary/'),
  
  // Export logs
  exportLogs: (params = {}) => axios.get('/history/logs/export/', { params }),
  
  // Get object history
  getObjectHistory: (contentType, objectId) => 
    axios.get(`/history/object/${contentType}/${objectId}/`),
  
  // Activity feed
  getActivityFeed: () => axios.get('/history/feed/'),
  getUnreadCount: () => axios.get('/history/feed/unread_count/'),
  markFeedRead: (id) => axios.post(`/history/feed/${id}/mark_read/`),
  markAllFeedRead: () => axios.post('/history/feed/mark_all_read/'),
  
  // Retention policies (admin only)
  getRetentionPolicies: () => axios.get('/history/retention/'),
  createRetentionPolicy: (data) => axios.post('/history/retention/', data),
  updateRetentionPolicy: (id, data) => axios.patch(`/history/retention/${id}/`, data),
  deleteRetentionPolicy: (id) => axios.delete(`/history/retention/${id}/`),
  applyRetention: () => axios.post('/history/retention/apply_retention/'),
};