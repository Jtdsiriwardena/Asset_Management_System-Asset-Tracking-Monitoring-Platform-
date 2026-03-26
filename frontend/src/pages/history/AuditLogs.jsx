import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { historyAPI } from '../../api/history';
import {
  History,
  Filter,
  Search,
  Calendar,
  Download,
  Eye,
  AlertCircle,
  Info,
  AlertTriangle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import Navbar from '../../components/Navbar';

const AuditLogs = () => {
  const { isAdmin } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [filters, setFilters] = useState({
    action: '',
    severity: '',
    date_from: '',
    date_to: '',
    search: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
    currentPage: 1
  });
  const [selectedLog, setSelectedLog] = useState(null);
  const [logDetails, setLogDetails] = useState(null);

  useEffect(() => {
    fetchLogs();
    fetchSummary();
  }, [filters, pagination.currentPage]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.currentPage,
        ...filters
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });

      const response = await historyAPI.getLogs(params);
      setLogs(response.data.results || response.data);

      if (response.data.count) {
        setPagination({
          count: response.data.count,
          next: response.data.next,
          previous: response.data.previous,
          currentPage: pagination.currentPage
        });
      }
    } catch (err) {
      console.error('Failed to fetch logs', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await historyAPI.getSummary();
      setSummary(response.data);
    } catch (err) {
      console.error('Failed to fetch summary', err);
    }
  };

  const fetchLogDetails = async (logId) => {
    try {
      const response = await historyAPI.getLogDetails(logId);
      setLogDetails(response.data);
    } catch (err) {
      console.error('Failed to fetch log details', err);
    }
  };

  const handleExport = async () => {
    try {
      const response = await historyAPI.exportLogs(filters);

      // Create download link
      const dataStr = JSON.stringify(response.data, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

      const exportFileDefaultName = `audit_logs_${new Date().toISOString().slice(0, 10)}.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (err) {
      alert('Failed to export logs');
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'INFO':
        return <Info className="w-4 h-4 text-blue-500" />;
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'ERROR':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'CRITICAL':
        return <AlertCircle className="w-4 h-4 text-red-700" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSeverityClass = (severity) => {
    switch (severity) {
      case 'INFO':
        return 'bg-blue-100 text-blue-800';
      case 'WARNING':
        return 'bg-yellow-100 text-yellow-800';
      case 'ERROR':
        return 'bg-red-100 text-red-800';
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 font-bold';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      {/* Header */}
      <div className="bg-white rounded-lg shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <History className="w-6 h-6 mr-2 text-blue-600" />
              Audit Trail
            </h1>
            {isAdmin && (
              <button
                onClick={handleExport}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Logs
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Total Logs</p>
              <p className="text-2xl font-bold">{summary.total_logs}</p>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">By Severity</p>
              <div className="flex space-x-2 mt-1">
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                  I:{summary.logs_by_severity?.INFO || 0}
                </span>
                <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                  W:{summary.logs_by_severity?.WARNING || 0}
                </span>
                <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded">
                  E:{summary.logs_by_severity?.ERROR || 0}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Unique Actions</p>
              <p className="text-2xl font-bold">
                {Object.keys(summary.logs_by_action || {}).length}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Active Users</p>
              <p className="text-2xl font-bold">
                {Object.keys(summary.logs_by_user || {}).length}
              </p>
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
                  placeholder="Search logs..."
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
              <button
                onClick={fetchLogs}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="mt-4 p-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Action Type
                    </label>
                    <select
                      value={filters.action}
                      onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                      className="w-full border border-gray-300 rounded-md p-2"
                    >
                      <option value="">All Actions</option>
                      <option value="ASSET_CREATED">Asset Created</option>
                      <option value="ASSET_UPDATED">Asset Updated</option>
                      <option value="ASSET_DELETED">Asset Deleted</option>
                      <option value="ASSIGNMENT_CREATED">Assignment Created</option>
                      <option value="ASSIGNMENT_RETURN_REQUESTED">Return Requested</option>
                      <option value="USER_LOGIN">User Login</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Severity
                    </label>
                    <select
                      value={filters.severity}
                      onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                      className="w-full border border-gray-300 rounded-md p-2"
                    >
                      <option value="">All Severities</option>
                      <option value="INFO">Info</option>
                      <option value="WARNING">Warning</option>
                      <option value="ERROR">Error</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      From Date
                    </label>
                    <input
                      type="date"
                      value={filters.date_from}
                      onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                      className="w-full border border-gray-300 rounded-md p-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      To Date
                    </label>
                    <input
                      type="date"
                      value={filters.date_to}
                      onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                      className="w-full border border-gray-300 rounded-md p-2"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Object
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Severity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(log.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {log.user_details?.username || 'System'}
                        </div>
                        {log.user_ip && (
                          <div className="text-xs text-gray-500">{log.user_ip}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          {log.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">{log.description}</p>
                        {Object.keys(log.changes || {}).length > 0 && (
                          <span className="text-xs text-blue-600">
                            {Object.keys(log.changes).length} change(s)
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.object_repr || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSeverityClass(log.severity)}`}>
                          {getSeverityIcon(log.severity)}
                          <span className="ml-1">{log.severity}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => {
                            setSelectedLog(log);
                            fetchLogDetails(log.id);
                          }}
                          className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.count > 0 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{logs.length}</span> of{' '}
                    <span className="font-medium">{pagination.count}</span> results
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                    disabled={!pagination.previous}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </button>
                  <span className="px-4 py-2 text-sm text-gray-700">
                    Page {pagination.currentPage}
                  </span>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                    disabled={!pagination.next}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Log Details</h3>
              <button
                onClick={() => {
                  setSelectedLog(null);
                  setLogDetails(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Action</p>
                  <p className="text-sm font-medium">{selectedLog.action.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Timestamp</p>
                  <p className="text-sm font-medium">{formatDate(selectedLog.timestamp)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">User</p>
                  <p className="text-sm font-medium">{selectedLog.user_details?.username || 'System'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">IP Address</p>
                  <p className="text-sm font-medium">{selectedLog.user_ip || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Severity</p>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSeverityClass(selectedLog.severity)}`}>
                    {selectedLog.severity}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Object</p>
                  <p className="text-sm font-medium">{selectedLog.object_repr || 'N/A'}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500">Description</p>
                <p className="text-sm bg-gray-50 p-3 rounded mt-1">{selectedLog.description}</p>
              </div>

              {Object.keys(selectedLog.changes || {}).length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Changes</p>
                  <div className="bg-gray-50 p-3 rounded">
                    <pre className="text-xs overflow-x-auto">
                      {JSON.stringify(selectedLog.changes, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {logDetails && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Additional Details</p>
                  <div className="bg-gray-50 p-3 rounded">
                    <pre className="text-xs overflow-x-auto">
                      {JSON.stringify(logDetails.data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {selectedLog.user_agent && (
                <div>
                  <p className="text-sm text-gray-500">User Agent</p>
                  <p className="text-xs text-gray-600 wrap-break-word">{selectedLog.user_agent}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;