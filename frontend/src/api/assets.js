import axios from './axios';

export const assetAPI = {
  // Get all assets with filters
  getAssets: (params = {}) => axios.get('/assets/', { params }),
  
  // Get single asset
  getAsset: (id) => axios.get(`/assets/${id}/`),
  
  // Create new asset
  createAsset: async (data) => {
    const formData = new FormData();
    
    // Append all fields to FormData for file upload
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
        if (key === 'image' || key === 'invoice') {
          if (data[key] instanceof File) {
            formData.append(key, data[key]);
          }
        } else {
          formData.append(key, data[key]);
        }
      }
    });
    
    try {
      const response = await axios.post('/assets/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response;
    } catch (error) {
      // Log the full error for debugging
      console.error('Create asset error:', error.response?.data);
      throw error;
    }
  },
  
  // Update asset
  updateAsset: async (id, data) => {
    const formData = new FormData();
    
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
        if (key === 'image' || key === 'invoice') {
          if (data[key] instanceof File) {
            formData.append(key, data[key]);
          }
        } else {
          formData.append(key, data[key]);
        }
      }
    });
    
    try {
      const response = await axios.patch(`/assets/${id}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response;
    } catch (error) {
      console.error('Update asset error:', error.response?.data);
      throw error;
    }
  },
  
  // Soft delete asset
  deleteAsset: (id) => axios.delete(`/assets/${id}/`),
  
  // Restore soft-deleted asset
  restoreAsset: (id) => axios.post(`/assets/${id}/restore/`),
  
  // Permanently delete asset (admin only)
  permanentDeleteAsset: (id) => axios.delete(`/assets/${id}/permanent_delete/`),
  
  // Bulk delete assets
  bulkDeleteAssets: (assetIds, permanent = false) => 
    axios.post('/assets/bulk_delete/', { asset_ids: assetIds, permanent }),
  
  // Get asset statistics
  getStats: () => axios.get('/assets/stats/'),
  
  // Categories API
  getCategories: async () => {
    try {
      const response = await axios.get('/assets/categories/');
      return response;
    } catch (error) {
      console.error('Get categories error:', error.response?.data);
      throw error;
    }
  },
  createCategory: (data) => axios.post('/assets/categories/', data),
  updateCategory: (id, data) => axios.patch(`/assets/categories/${id}/`, data),
  deleteCategory: (id) => axios.delete(`/assets/categories/${id}/`),
  
  // QR Code endpoints
  getScanStats: () => axios.get('/assets/scan_stats/'),
  
  downloadQR: (id) => axios.get(`/assets/${id}/download_qr/`, {
    responseType: 'blob'
  }),
  
  downloadMultipleQR: (data) => axios.post('/assets/download_multiple_qr/', data, {
    responseType: 'blob'
  }),
  
  generateQRSheet: (data) => axios.post('/assets/generate_qr_sheet/', data, {
    responseType: 'blob'
  }),
  
  regenerateQR: (id) => axios.post(`/assets/${id}/regenerate_qr/`),
  
  bulkRegenerateQR: (data) => axios.post('/assets/bulk_regenerate_qr/', data),
  
  scanQR: (id) => axios.get(`/assets/scan/${id}/`),
};