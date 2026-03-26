import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { assetAPI } from '../api/assets';
import { 
  Search, 
  Plus, 
  Filter, 
  Download, 
  Trash2, 
  Edit, 
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  Package,
  DollarSign,
  TrendingUp,
  Calendar,
  FolderTree,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

const AssetList = () => {
  const { isAdmin } = useAuth();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    show_deleted: false
  });
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
    currentPage: 1
  });
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState(null);
  const [fetchingStats, setFetchingStats] = useState(false);

  useEffect(() => {
    fetchAssets();
    fetchCategories();
    fetchStats();
  }, [filters, pagination.currentPage]);

  const fetchAssets = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        search: searchTerm,
        page: pagination.currentPage,
        ...filters
      };
      
      if (filters.status === '') delete params.status;
      if (filters.category === '') delete params.category;
      
      console.log('Fetching assets with params:', params); // Debug log
      const response = await assetAPI.getAssets(params);
      console.log('Assets response:', response.data); // Debug log
      
      // Handle different response structures
      if (response.data.results) {
        setAssets(response.data.results);
        setPagination({
          count: response.data.count,
          next: response.data.next,
          previous: response.data.previous,
          currentPage: pagination.currentPage
        });
      } else if (Array.isArray(response.data)) {
        setAssets(response.data);
        setPagination({
          count: response.data.length,
          next: null,
          previous: null,
          currentPage: 1
        });
      }
    } catch (err) {
      console.error('Failed to fetch assets', err);
      setError('Failed to fetch assets. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await assetAPI.getCategories();
      console.log('Categories response:', response.data); // Debug log
      
      // Handle different response structures
      if (Array.isArray(response.data)) {
        setCategories(response.data);
      } else if (response.data.results) {
        setCategories(response.data.results);
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.error('Failed to fetch categories', err);
      setCategories([]);
    }
  };

  const fetchStats = async () => {
    setFetchingStats(true);
    try {
      const response = await assetAPI.getStats();
      console.log('Stats response:', response.data); // Debug log
      setStats(response.data);
    } catch (err) {
      console.error('Failed to fetch stats', err);
      // Set default stats if API fails
      setStats({
        total_assets: assets.length,
        total_value: 0,
        average_cost: 0,
        warranty_expiring_soon: 0
      });
    } finally {
      setFetchingStats(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    fetchAssets();
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      category: '',
      show_deleted: false
    });
    setSearchTerm('');
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedAssets(assets.map(asset => asset.id));
    } else {
      setSelectedAssets([]);
    }
  };

  const handleSelectAsset = (assetId) => {
    setSelectedAssets(prev => {
      if (prev.includes(assetId)) {
        return prev.filter(id => id !== assetId);
      } else {
        return [...prev, assetId];
      }
    });
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedAssets.length} assets?`)) return;
    
    try {
      await assetAPI.bulkDeleteAssets(selectedAssets, false);
      setSelectedAssets([]);
      fetchAssets();
      fetchStats();
    } catch (err) {
      alert('Failed to delete assets');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this asset?')) return;
    
    try {
      await assetAPI.deleteAsset(id);
      fetchAssets();
      fetchStats();
    } catch (err) {
      alert('Failed to delete asset');
    }
  };

  const getStatusBadgeClass = (status) => {
    const classes = {
      'AVAILABLE': 'bg-green-100 text-green-800',
      'ASSIGNED': 'bg-blue-100 text-blue-800',
      'UNDER_REPAIR': 'bg-yellow-100 text-yellow-800',
      'DAMAGED': 'bg-red-100 text-red-800',
      'RETIRED': 'bg-gray-100 text-gray-800',
      'RETURN_REQUESTED': 'bg-purple-100 text-purple-800',
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (value) => {
    if (!value && value !== 0) return '0';
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Assets</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage and track all your organizational assets
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  fetchAssets();
                  fetchStats();
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
              {isAdmin && (
                <Link
                  to="/assets/new"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Asset
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Total Assets Card */}
            <div className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Total Assets</p>
                <Package className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {fetchingStats ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  stats.total_assets || 0
                )}
              </p>
              <p className="text-xs text-gray-500 mt-1">All active assets</p>
            </div>

            {/* Total Value Card */}
            <div className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Total Value</p>
                <DollarSign className="w-4 h-4 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {fetchingStats ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  `$${formatCurrency(stats.total_value)}`
                )}
              </p>
              <p className="text-xs text-gray-500 mt-1">Total purchase cost</p>
            </div>

            {/* Average Cost Card */}
            <div className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Average Cost</p>
                <TrendingUp className="w-4 h-4 text-purple-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {fetchingStats ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  `$${formatCurrency(stats.average_cost)}`
                )}
              </p>
              <p className="text-xs text-gray-500 mt-1">Per asset average</p>
            </div>

            {/* Warranty Expiring Card */}
            <div className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Warranty Expiring</p>
                <Calendar className="w-4 h-4 text-yellow-500" />
              </div>
              <p className="text-2xl font-bold text-yellow-600">
                {fetchingStats ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  stats.warranty_expiring_soon || 0
                )}
              </p>
              <p className="text-xs text-gray-500 mt-1">Next 30 days</p>
            </div>

            {/* Categories Card */}
            <div className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Categories</p>
                <FolderTree className="w-4 h-4 text-indigo-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {categories.length}
              </p>
              <p className="text-xs text-gray-500 mt-1">Asset categories</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search assets by name, serial number, or description..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center whitespace-nowrap"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 whitespace-nowrap"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="mt-4 p-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                      className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Statuses</option>
                      <option value="AVAILABLE">Available</option>
                      <option value="ASSIGNED">Assigned</option>
                      <option value="UNDER_REPAIR">Under Repair</option>
                      <option value="DAMAGED">Damaged</option>
                      <option value="RETIRED">Retired</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={filters.category}
                      onChange={(e) => handleFilterChange('category', e.target.value)}
                      className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Categories</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  {isAdmin && (
                    <div className="flex items-center">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={filters.show_deleted}
                          onChange={(e) => handleFilterChange('show_deleted', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Show deleted assets</span>
                      </label>
                    </div>
                  )}
                  
                  <div className="flex items-end">
                    <button
                      onClick={clearFilters}
                      className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm w-full"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedAssets.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 flex items-center justify-between">
            <span className="text-blue-700">
              <span className="font-medium">{selectedAssets.length}</span> asset(s) selected
            </span>
            <div className="flex gap-2">
              {isAdmin && (
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm flex items-center"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete Selected
                </button>
              )}
              <button
                onClick={() => setSelectedAssets([])}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm flex items-center"
              >
                <X className="w-4 h-4 mr-1" />
                Clear Selection
              </button>
            </div>
          </div>
        )}

        {/* Assets Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchAssets}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          ) : assets.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No assets found</p>
              {isAdmin && (
                <Link 
                  to="/assets/new" 
                  className="text-blue-600 hover:text-blue-800 mt-2 inline-block"
                >
                  Add your first asset
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedAssets.length === assets.length && assets.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Asset Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Serial Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Purchase Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {assets.map((asset) => (
                    <tr key={asset.id} className={!asset.is_active ? 'bg-gray-50' : 'hover:bg-gray-50'}>
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedAssets.includes(asset.id)}
                          onChange={() => handleSelectAsset(asset.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {asset.asset_code}
                        </div>
                        {!asset.is_active && (
                          <span className="mt-1 inline-flex px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                            Deleted
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{asset.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{asset.category_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{asset.serial_number}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(asset.status)}`}>
                          {asset.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString() : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <Link
                            to={`/assets/${asset.id}`}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          {isAdmin && (
                            <>
                              <Link
                                to={`/assets/${asset.id}/edit`}
                                className="text-green-600 hover:text-green-900 p-1 rounded-full hover:bg-green-50"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => handleDelete(asset.id)}
                                className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
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
                    Showing <span className="font-medium">{assets.length}</span> of{' '}
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
    </div>
  );
};

export default AssetList;