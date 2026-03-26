import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { assignmentAPI } from '../../api/assignments';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  User,
  Package,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  Eye
} from 'lucide-react';
import Navbar from '../../components/Navbar';

const AssignmentList = () => {
  const { user, isAdmin } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchAssignments();
    fetchStats();
  }, [filters]);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;
      
      const response = await assignmentAPI.getAssignments(params);
      setAssignments(response.data.results || response.data);
    } catch (err) {
      setError('Failed to fetch assignments');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await assignmentAPI.getStats();
      setStats(response.data);
    } catch (err) {
      console.error('Failed to fetch stats', err);
    }
  };

  const getStatusBadge = (status) => {
    const classes = {
      'ACTIVE': 'bg-green-100 text-green-800',
      'RETURN_REQUESTED': 'bg-yellow-100 text-yellow-800',
      'RETURN_APPROVED': 'bg-blue-100 text-blue-800',
      'RETURNED': 'bg-gray-100 text-gray-800',
      'OVERDUE': 'bg-red-100 text-red-800',
      'DAMAGED': 'bg-red-100 text-red-800',
      'REJECTED': 'bg-red-100 text-red-800',
    };
    
    const icons = {
      'ACTIVE': <CheckCircle className="w-4 h-4 mr-1" />,
      'RETURN_REQUESTED': <Clock className="w-4 h-4 mr-1" />,
      'RETURN_APPROVED': <CheckCircle className="w-4 h-4 mr-1" />,
      'RETURNED': <RefreshCw className="w-4 h-4 mr-1" />,
      'OVERDUE': <AlertCircle className="w-4 h-4 mr-1" />,
      'DAMAGED': <XCircle className="w-4 h-4 mr-1" />,
      'REJECTED': <XCircle className="w-4 h-4 mr-1" />,
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${classes[status] || 'bg-gray-100 text-gray-800'}`}>
        {icons[status]}
        {status.replace('_', ' ')}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
          <Navbar />
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Asset Assignments</h1>
            {isAdmin && (
              <Link
                to="/assignments/new"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Assignment
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Active Assignments</p>
              <p className="text-2xl font-bold text-green-600">{stats.total_active}</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Pending Returns</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending_returns}</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{stats.total_overdue}</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Returned</p>
              <p className="text-2xl font-bold text-blue-600">{stats.total_returned}</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Damaged</p>
              <p className="text-2xl font-bold text-red-600">{stats.damaged_reported}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by asset name, employee..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="mt-4 p-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                      className="w-full border border-gray-300 rounded-md p-2"
                    >
                      <option value="">All Statuses</option>
                      <option value="ACTIVE">Active</option>
                      <option value="RETURN_REQUESTED">Return Requested</option>
                      <option value="RETURN_APPROVED">Return Approved</option>
                      <option value="RETURNED">Returned</option>
                      <option value="OVERDUE">Overdue</option>
                      <option value="DAMAGED">Damaged</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Assignments Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">{error}</div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No assignments found</p>
              {isAdmin && (
                <Link to="/assignments/new" className="text-blue-600 hover:text-blue-800 mt-2 inline-block">
                  Create your first assignment
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Asset
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned To
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expected Return
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {assignments.map((assignment) => (
                    <tr key={assignment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {assignment.asset_details?.name || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {assignment.asset_details?.asset_code}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-gray-400 mr-2" />
                          <div>
                            <p className="text-sm text-gray-900">
                              {assignment.assigned_to_details?.username}
                            </p>
                            <p className="text-xs text-gray-500">
                              {assignment.assigned_to_details?.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {assignment.assigned_by_name || 'System'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-500">
                            {formatDate(assignment.assigned_date)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                          <span className={`text-sm ${
                            assignment.is_overdue ? 'text-red-600 font-medium' : 'text-gray-500'
                          }`}>
                            {formatDate(assignment.expected_return_date)}
                            {assignment.is_overdue && ' (Overdue)'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(assignment.status)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Link
                          to={`/assignments/${assignment.id}`}
                          className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignmentList;