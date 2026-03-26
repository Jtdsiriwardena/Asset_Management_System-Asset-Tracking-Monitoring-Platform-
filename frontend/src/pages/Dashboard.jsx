import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { dashboardAPI } from '../api/dashboard';
import { assignmentAPI } from '../api/assignments';
import StatsCard from '../components/dashboard/StatsCard';
import CustomPieChart from '../components/dashboard/PieChart';
import CustomBarChart from '../components/dashboard/BarChart';
import CustomLineChart from '../components/dashboard/LineChart';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import WarrantyList from '../components/dashboard/WarrantyList';
import OverdueList from '../components/dashboard/OverdueList';
import {
  Package,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Briefcase,
  Scan
} from 'lucide-react';

const Dashboard = () => {
  const { user, isAdmin, isEmployee } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [myAssignments, setMyAssignments] = useState([]);
  const [timeRange, setTimeRange] = useState('month');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchAdminDashboard();
    } else {
      fetchEmployeeDashboard();
    }
  }, [isAdmin]);

  const fetchAdminDashboard = async () => {
    setLoading(true);
    try {
      const response = await dashboardAPI.getDashboardData();
      setData(response.data);
    } catch (err) {
      console.error('Failed to fetch admin dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeeDashboard = async () => {
    setLoading(true);
    try {
      const assignmentsResponse = await assignmentAPI.getMyAssignments();
      
      // Handle different response structures
      let assignmentsData = [];
      if (assignmentsResponse.data) {
        if (Array.isArray(assignmentsResponse.data)) {
          assignmentsData = assignmentsResponse.data;
        } else if (assignmentsResponse.data.results) {
          assignmentsData = assignmentsResponse.data.results;
        }
      }
      
      setMyAssignments(assignmentsData);
    } catch (err) {
      console.error('Failed to fetch employee dashboard data', err);
      setMyAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type = 'all', format = 'csv') => {
    if (!isAdmin) return;
    
    setExporting(true);
    try {
      const response = await dashboardAPI.exportData(type, format);
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `dashboard_${type}_${new Date().toISOString().slice(0,10)}.${format}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar /> {/* Use the Navbar component */}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Actions */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {isAdmin ? 'Admin Dashboard' : 'My Dashboard'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {isAdmin 
                ? "Welcome back! Here's an overview of your asset management system."
                : `Welcome back, ${user?.first_name || user?.username}! Here are your assigned assets.`
              }
            </p>
          </div>
          
          {isAdmin && (
            <div className="flex space-x-3">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="week">Last 7 days</option>
                <option value="month">Last 30 days</option>
                <option value="quarter">Last 90 days</option>
                <option value="year">Last 12 months</option>
              </select>
              
              <button
                onClick={() => handleExport('all', 'csv')}
                disabled={exporting}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                <Package className="w-4 h-4 mr-2" />
                Export
              </button>
              
              <button
                onClick={fetchAdminDashboard}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Clock className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>
          )}
        </div>

        {/* Employee Dashboard View */}
        {isEmployee && (
          <div className="space-y-6">
            {/* Employee Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatsCard
                title="My Assigned Assets"
                value={Array.isArray(myAssignments) 
                  ? myAssignments.filter(a => a.status === 'ACTIVE').length 
                  : 0}
                icon={Briefcase}
                color="blue"
              />
              
              <StatsCard
                title="Pending Returns"
                value={Array.isArray(myAssignments) 
                  ? myAssignments.filter(a => a.status === 'RETURN_REQUESTED').length 
                  : 0}
                icon={Clock}
                color="yellow"
              />
              
              <StatsCard
                title="Completed Returns"
                value={Array.isArray(myAssignments) 
                  ? myAssignments.filter(a => a.status === 'RETURNED').length 
                  : 0}
                icon={CheckCircle}
                color="green"
              />
            </div>

            {/* My Current Assignments */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">My Current Assignments</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {!Array.isArray(myAssignments) || myAssignments.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>You have no active assignments</p>
                    <p className="text-sm mt-1">Assets assigned to you will appear here</p>
                  </div>
                ) : (
                  myAssignments
                    .filter(a => ['ACTIVE', 'RETURN_REQUESTED'].includes(a.status))
                    .map((assignment) => (
                      <div key={assignment.id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">
                              {assignment.asset_details?.name || 'Unknown Asset'}
                            </p>
                            <p className="text-sm text-gray-500">
                              Asset Code: {assignment.asset_details?.asset_code || 'N/A'}
                            </p>
                            <div className="flex items-center mt-2 space-x-4">
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                assignment.status === 'ACTIVE' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {assignment.status || 'UNKNOWN'}
                              </span>
                              <span className="text-xs text-gray-500">
                                Assigned: {assignment.assigned_date 
                                  ? new Date(assignment.assigned_date).toLocaleDateString() 
                                  : 'N/A'}
                              </span>
                              {assignment.expected_return_date && (
                                <span className="text-xs text-gray-500">
                                  Due: {new Date(assignment.expected_return_date).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <a
                            href={`/assignments/${assignment.id}`}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            View Details →
                          </a>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* Quick Actions for Employees */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-blue-900 mb-3">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => document.querySelector('[title="Scan QR Code"]')?.click()}
                  className="flex items-center justify-center p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <Scan className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Scan QR Code</span>
                </button>
                
                <a
                  href="/assignments"
                  className="flex items-center justify-center p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <Clock className="h-5 w-5 text-yellow-600 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Request Return</span>
                </a>
                
                <a
                  href="/assets"
                  className="flex items-center justify-center p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <Package className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Browse Assets</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Admin Dashboard View */}
        {isAdmin && data && (
          <>
            {/* Summary Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatsCard
                title="Total Assets"
                value={data.summary.assets.total}
                icon={Package}
                color="blue"
                subtitle={`$${data.summary.assets.total_value.toLocaleString()} total value`}
              />
              
              <StatsCard
                title="Available Assets"
                value={data.summary.assets.available}
                icon={CheckCircle}
                color="green"
                subtitle={`${((data.summary.assets.available / data.summary.assets.total) * 100).toFixed(1)}% of total`}
              />
              
              <StatsCard
                title="Active Assignments"
                value={data.summary.assignments.active}
                icon={Users}
                color="purple"
                subtitle={`${data.summary.assignments.overdue} overdue`}
              />
              
              <StatsCard
                title="Damaged/Repair"
                value={data.summary.assets.damaged + data.summary.assets.under_repair}
                icon={AlertCircle}
                color="red"
                subtitle={`${data.summary.assets.damaged} damaged, ${data.summary.assets.under_repair} in repair`}
              />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {data?.assets_by_status && (
                <CustomPieChart
                  data={data.assets_by_status}
                  title="Assets by Status"
                  height={350}
                />
              )}
              
              {data?.assets_by_category && (
                <CustomBarChart
                  data={data.assets_by_category.map(item => ({
                    name: item.name,
                    count: item.count,
                    value: item.total_value
                  }))}
                  title="Assets by Category"
                  height={350}
                  bars={[
                    { dataKey: 'count', name: 'Count', color: '#3B82F6' },
                    { dataKey: 'value', name: 'Total Value ($)', color: '#10B981' }
                  ]}
                />
              )}
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {data?.asset_trends && data.asset_trends.length > 0 && (
                <CustomLineChart
                  data={data.asset_trends}
                  title="Asset Creation Trends"
                  height={300}
                  lines={[
                    { dataKey: 'count', name: 'New Assets', color: '#3B82F6' }
                  ]}
                />
              )}
              
              {data?.assignment_trends && data.assignment_trends.length > 0 && (
                <CustomLineChart
                  data={data.assignment_trends}
                  title="Assignment Trends"
                  height={300}
                  lines={[
                    { dataKey: 'assigned', name: 'Assigned', color: '#3B82F6' },
                    { dataKey: 'returned', name: 'Returned', color: '#10B981' },
                    { dataKey: 'active', name: 'Active', color: '#F59E0B' }
                  ]}
                />
              )}
            </div>

            {/* Bottom Widgets */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <ActivityFeed activities={data?.recent_activities || []} />
              <WarrantyList warranties={data?.upcoming_warranties || []} />
              <OverdueList assignments={data?.overdue_assignments || []} />
            </div>

            {/* Top Employees Section */}
            {data?.top_employees && data.top_employees.length > 0 && (
              <div className="mt-8 bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Top Employees by Assignments</h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {data.top_employees.map((emp, index) => (
                    <div key={emp.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          index === 0 ? 'bg-yellow-100 text-yellow-600' :
                          index === 1 ? 'bg-gray-100 text-gray-600' :
                          index === 2 ? 'bg-orange-100 text-orange-600' :
                          'bg-blue-50 text-blue-600'
                        }`}>
                          #{index + 1}
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">{emp.name}</p>
                          <p className="text-xs text-gray-500">{emp.department || 'No Department'}</p>
                        </div>
                      </div>
                      <div className="flex space-x-4">
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-900">{emp.active_assignments}</p>
                          <p className="text-xs text-gray-500">Active</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-900">{emp.completed_assignments}</p>
                          <p className="text-xs text-gray-500">Completed</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-900">{emp.total_assignments}</p>
                          <p className="text-xs text-gray-500">Total</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;