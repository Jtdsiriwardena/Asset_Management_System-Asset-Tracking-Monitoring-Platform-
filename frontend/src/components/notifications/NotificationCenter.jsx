import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { 
  Bell, 
  CheckCheck, 
  X, 
  Package, 
  Users, 
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  BellRing,
  Filter,
  RefreshCw,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const NotificationCenter = () => {
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  
  const { 
    notifications, 
    unreadCount, 
    loading, 
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    markAsUnread,
    clearAll,
    toggleRead
  } = useNotifications();

  useEffect(() => {
    loadNotifications();
  }, [filter, page]);

  const loadNotifications = async () => {
    const params = {
      page,
      page_size: 20
    };
    
    if (filter !== 'all') {
      params.is_read = filter === 'read';
    }
    
    await fetchNotifications(params);
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'ASSIGNMENT_CREATED':
      case 'ASSET_CREATED':
        return <Package className="w-5 h-5 text-blue-500" />;
      case 'RETURN_REQUESTED':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'RETURN_APPROVED':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'RETURN_REJECTED':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'DAMAGE_REPORTED':
      case 'ASSIGNMENT_OVERDUE':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'WARRANTY_EXPIRING':
        return <Clock className="w-5 h-5 text-orange-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const handleMarkSelected = async (ids, read = true) => {
    if (read) {
      await markAsRead(ids);
    } else {
      await markAsUnread(ids);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.is_read;
    if (filter === 'read') return n.is_read;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Bell className="w-6 h-6 mr-2 text-blue-600" />
                Notification Center
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage all your notifications in one place
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </button>
              
              <button
                onClick={loadNotifications}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
              
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <CheckCheck className="w-4 h-4 mr-2" />
                  Mark All Read
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      {showFilters && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Filter by:</span>
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-full text-sm ${
                  filter === 'all'
                    ? 'bg-blue-100 text-blue-800'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-3 py-1 rounded-full text-sm ${
                  filter === 'unread'
                    ? 'bg-blue-100 text-blue-800'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Unread ({unreadCount})
              </button>
              <button
                onClick={() => setFilter('read')}
                className={`px-3 py-1 rounded-full text-sm ${
                  filter === 'read'
                    ? 'bg-blue-100 text-blue-800'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Read
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No notifications found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 ${
                    !notification.is_read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start">
                    <div className="shrink-0 mr-4">
                      {getNotificationIcon(notification.notification_type)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className={`text-sm font-medium ${
                          !notification.is_read ? 'text-gray-900' : 'text-gray-600'
                        }`}>
                          {notification.title}
                        </h3>
                        <span className="text-xs text-gray-400">
                          {notification.time_ago}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      
                      {notification.data && Object.keys(notification.data).length > 0 && (
                        <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                          <pre className="whitespace-pre-wrap">
                            {JSON.stringify(notification.data, null, 2)}
                          </pre>
                        </div>
                      )}
                      
                      <div className="flex items-center mt-3 space-x-4">
                        {notification.object_url && (
                          <Link
                            to={notification.object_url}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            View Details →
                          </Link>
                        )}
                        
                        <button
                          onClick={() => toggleRead(notification.id)}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          {notification.is_read ? 'Mark as unread' : 'Mark as read'}
                        </button>
                      </div>
                    </div>
                    
                    {!notification.is_read && (
                      <div className="ml-4 shrink-0">
                        <span className="inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Page <span className="font-medium">{page}</span>
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Clear All Button */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={clearAll}
            className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All Notifications
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;