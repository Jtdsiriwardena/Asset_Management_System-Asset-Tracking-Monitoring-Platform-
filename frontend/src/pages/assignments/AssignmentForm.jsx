import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { assignmentAPI } from '../../api/assignments';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';

const AssignmentForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    asset: '',
    assigned_to: '',
    expected_return_date: '',
    notes: '',
    condition_before: ''
  });
  
  const [availableAssets, setAvailableAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    fetchAvailableAssets();
    fetchEmployees();
  }, []);

  const fetchAvailableAssets = async () => {
    try {
      const response = await assignmentAPI.getAvailableAssets();
      setAvailableAssets(response.data);
    } catch (err) {
      console.error('Failed to fetch available assets', err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await assignmentAPI.getEmployees();
      setEmployees(response.data);
    } catch (err) {
      console.error('Failed to fetch employees', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.asset) {
      errors.asset = 'Please select an asset';
    }
    
    if (!formData.assigned_to) {
      errors.assigned_to = 'Please select an employee';
    }
    
    if (formData.expected_return_date) {
      const selectedDate = new Date(formData.expected_return_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        errors.expected_return_date = 'Return date must be in the future';
      }
    }
    
    return errors;
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  
  const errors = validateForm();
  if (Object.keys(errors).length > 0) {
    setValidationErrors(errors);
    return;
  }
  
  setLoading(true);
  setError(null);
  
  try {
    const response = await assignmentAPI.createAssignment(formData);
    console.log('Assignment created:', response.data); // Debug log
    
    // Navigate to the new assignment
    if (response.data && response.data.id) {
      navigate(`/assignments/${response.data.id}`);
    } else {
      // If response doesn't have ID, go to assignments list
      navigate('/assignments');
    }
  } catch (err) {
    console.error('Creation error:', err);
    if (err.response?.data) {
      setValidationErrors(err.response.data);
      setError('Please check the form for errors');
    } else {
      setError('Failed to create assignment. Please try again.');
    }
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="mr-4 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">New Asset Assignment</h1>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow">
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Asset Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Asset <span className="text-red-500">*</span>
              </label>
              <select
                name="asset"
                value={formData.asset}
                onChange={handleChange}
                className={`w-full border ${
                  validationErrors.asset ? 'border-red-500' : 'border-gray-300'
                } rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                <option value="">Choose an asset...</option>
                {availableAssets.map(asset => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name} - {asset.asset_code} ({asset.category__name})
                  </option>
                ))}
              </select>
              {validationErrors.asset && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.asset}</p>
              )}
            </div>

            {/* Employee Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assign To <span className="text-red-500">*</span>
              </label>
              <select
                name="assigned_to"
                value={formData.assigned_to}
                onChange={handleChange}
                className={`w-full border ${
                  validationErrors.assigned_to ? 'border-red-500' : 'border-gray-300'
                } rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                <option value="">Select an employee...</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name} - {emp.username} ({emp.department || 'No Dept'})
                  </option>
                ))}
              </select>
              {validationErrors.assigned_to && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.assigned_to}</p>
              )}
            </div>

            {/* Expected Return Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expected Return Date
              </label>
              <input
                type="date"
                name="expected_return_date"
                value={formData.expected_return_date}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full border ${
                  validationErrors.expected_return_date ? 'border-red-500' : 'border-gray-300'
                } rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {validationErrors.expected_return_date && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.expected_return_date}</p>
              )}
            </div>

            {/* Condition Before */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Asset Condition
              </label>
              <input
                type="text"
                name="condition_before"
                value={formData.condition_before}
                onChange={handleChange}
                placeholder="e.g., Good condition, minor scratches, etc."
                className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assignment Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                placeholder="Any additional notes about this assignment..."
                className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Form Actions */}
            <div className="pt-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Creating...' : 'Create Assignment'}
              </button>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">About Assignments</h3>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Only available assets can be assigned</li>
            <li>• Employees will receive notification of new assignments</li>
            <li>• Assets will show as "Assigned" until returned</li>
            <li>• Return requests must be approved by admin</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AssignmentForm;