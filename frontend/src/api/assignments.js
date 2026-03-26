import axios from './axios';

export const assignmentAPI = {
  // Get all assignments (with filters)
  getAssignments: (params = {}) => axios.get('/assignments/', { params }),
  
  // Get single assignment
  getAssignment: (id) => axios.get(`/assignments/${id}/`),
  
  // Create new assignment
  createAssignment: (data) => axios.post('/assignments/', data),
  
  // Update assignment
  updateAssignment: (id, data) => axios.patch(`/assignments/${id}/`, data),
  
  // Delete assignment
  deleteAssignment: (id) => axios.delete(`/assignments/${id}/`),
  
  // Request return
  requestReturn: (id, data = {}) => axios.post(`/assignments/${id}/request_return/`, data),
  
  // Approve/reject return
  approveReturn: (id, data) => axios.post(`/assignments/${id}/approve_return/`, data),
  
  // Complete return
  completeReturn: (id) => axios.post(`/assignments/${id}/complete_return/`),
  
  // Report damage
  reportDamage: (id, data) => axios.post(`/assignments/${id}/report_damage/`, data),
  
  // Get assignment history
  getHistory: (id) => axios.get(`/assignments/${id}/history/`),
  
  // Get current user's assignments
  getMyAssignments: () => axios.get('/assignments/my_assignments/'),
  
  // Get pending returns (admin)
  getPendingReturns: () => axios.get('/assignments/pending_returns/'),
  
  // Get assignment statistics
  getStats: () => axios.get('/assignments/stats/'),
  
  // Get available assets for assignment (admin)
  getAvailableAssets: () => axios.get('/assignments/available_assets/'),
  
  // Get employees for assignment (admin)
  getEmployees: () => axios.get('/assignments/employees/'),
};