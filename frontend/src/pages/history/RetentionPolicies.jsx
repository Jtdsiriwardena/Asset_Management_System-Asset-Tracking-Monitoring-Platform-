import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { historyAPI } from '../../api/history';
import {
  Clock,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

const RetentionPolicies = () => {
  const { isAdmin } = useAuth();
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [formData, setFormData] = useState({
    action_type: '',
    retention_days: 365,
    auto_delete: false
  });
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const response = await historyAPI.getRetentionPolicies();
      setPolicies(response.data);
    } catch (err) {
      console.error('Failed to fetch policies', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPolicy) {
        await historyAPI.updateRetentionPolicy(editingPolicy.id, formData);
      } else {
        await historyAPI.createRetentionPolicy(formData);
      }
      setShowModal(false);
      setEditingPolicy(null);
      setFormData({ action_type: '', retention_days: 365, auto_delete: false });
      fetchPolicies();
    } catch (err) {
      alert('Failed to save policy');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this policy?')) return;
    try {
      await historyAPI.deleteRetentionPolicy(id);
      fetchPolicies();
    } catch (err) {
      alert('Failed to delete policy');
    }
  };

  const handleEdit = (policy) => {
    setEditingPolicy(policy);
    setFormData({
      action_type: policy.action_type,
      retention_days: policy.retention_days,
      auto_delete: policy.auto_delete
    });
    setShowModal(true);
  };

  const handleApplyRetention = async () => {
    if (!window.confirm('Apply retention policies? This will permanently delete old logs.')) return;
    
    setApplying(true);
    try {
      const response = await historyAPI.applyRetention();
      alert(response.data.message);
      fetchPolicies();
    } catch (err) {
      alert('Failed to apply retention policies');
    } finally {
      setApplying(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900">Access Denied</h2>
          <p className="text-gray-600">Only administrators can manage retention policies.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Clock className="w-6 h-6 mr-2 text-blue-600" />
              Data Retention Policies
            </h1>
            <div className="flex space-x-3">
              <button
                onClick={handleApplyRetention}
                disabled={applying}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${applying ? 'animate-spin' : ''}`} />
                Apply Now
              </button>
              <button
                onClick={() => {
                  setEditingPolicy(null);
                  setFormData({ action_type: '', retention_days: 365, auto_delete: false });
                  setShowModal(true);
                }}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Policy
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : policies.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No retention policies configured</p>
              <button
                onClick={() => setShowModal(true)}
                className="mt-4 text-blue-600 hover:text-blue-800"
              >
                Add your first policy
              </button>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Retention Days
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Auto Delete
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Updated
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {policies.map((policy) => (
                  <tr key={policy.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {policy.action_type.replace(/_/g, ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {policy.retention_days} days
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        policy.auto_delete 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {policy.auto_delete ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(policy.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(policy.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(policy)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(policy.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Policy Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingPolicy ? 'Edit Policy' : 'Add Policy'}
            </h3>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Action Type
                  </label>
                  <select
                    value={formData.action_type}
                    onChange={(e) => setFormData({ ...formData, action_type: e.target.value })}
                    required
                    className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Action Type</option>
                    <option value="ASSET_CREATED">Asset Created</option>
                    <option value="ASSET_UPDATED">Asset Updated</option>
                    <option value="ASSET_DELETED">Asset Deleted</option>
                    <option value="ASSIGNMENT_CREATED">Assignment Created</option>
                    <option value="ASSIGNMENT_RETURN_REQUESTED">Return Requested</option>
                    <option value="USER_LOGIN">User Login</option>
                    <option value="USER_LOGOUT">User Logout</option>
                    <option value="QR_SCANNED">QR Scanned</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Retention Days
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="3650"
                    value={formData.retention_days}
                    onChange={(e) => setFormData({ ...formData, retention_days: parseInt(e.target.value) })}
                    required
                    className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="auto_delete"
                    checked={formData.auto_delete}
                    onChange={(e) => setFormData({ ...formData, auto_delete: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="auto_delete" className="ml-2 text-sm text-gray-700">
                    Automatically delete logs after retention period
                  </label>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingPolicy(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingPolicy ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RetentionPolicies;