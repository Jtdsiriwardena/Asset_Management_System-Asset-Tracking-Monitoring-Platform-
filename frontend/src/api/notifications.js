import axios from './axios';

export const notificationAPI = {
  // Get all notifications
  getNotifications: (params = {}) => 
    axios.get('/notifications/notifications/', { params }),
  
  // Get notification counts
  getCounts: () => 
    axios.get('/notifications/notifications/counts/'),
  
  // Mark notifications as read
  markAsRead: (notificationIds = []) => 
    axios.post('/notifications/notifications/mark_read/', {
      notification_ids: notificationIds
    }),
  
  // Mark all as read
  markAllAsRead: () => 
    axios.post('/notifications/notifications/mark_read/', { all: true }),
  
  // Mark as unread
  markAsUnread: (notificationIds) => 
    axios.post('/notifications/notifications/mark_unread/', {
      notification_ids: notificationIds
    }),
  
  // Toggle read status
  toggleRead: (id) => 
    axios.post(`/notifications/notifications/${id}/toggle_read/`),
  
  // Clear all notifications
  clearAll: () => 
    axios.delete('/notifications/notifications/clear_all/'),
  
  // Get notification preferences
  getPreferences: () => 
    axios.get('/notifications/preferences/'),
  
  // Update notification preferences
  updatePreferences: (data) => 
    axios.patch('/notifications/preferences/', data),
};