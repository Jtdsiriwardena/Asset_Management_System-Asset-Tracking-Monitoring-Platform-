import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { historyAPI } from '../api/history';
import { Bell, CheckCircle, Clock, Package, User, QrCode, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const ActivityFeed = ({ limit = 10 }) => {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
    fetchUnreadCount();
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchActivities();
      fetchUnreadCount();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchActivities = async () => {
    try {
      const response = await historyAPI.getActivityFeed();
      setActivities(response.data.slice(0, limit));
    } catch (err) {
      console.error('Failed to fetch activities', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await historyAPI.getUnreadCount();
      setUnreadCount(response.data.unread_count);
    } catch (err) {
      console.error('Failed to fetch unread count', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await historyAPI.markAllFeedRead();
      setUnreadCount(0);
      // Update local read status
      setActivities(activities.map(a => ({ ...a, is_read: true })));
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const markAsRead = async (id) => {
    try {
      await historyAPI.markFeedRead(id);
      setUnreadCount(prev => Math.max(0, prev - 1));
      setActivities(activities.map(a => 
        a.id === id ? { ...a, is_read: true } : a
      ));
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const getActionIcon = (action) => {
    if (action.includes('ASSET')) return <Package className="w-4 h-4 text-blue-500" />;
    if (action.includes('ASSIGNMENT')) return <User className="w-4 h-4 text-green-500" />;
    if (action.includes('USER')) return <User className="w-4 h-4 text-purple-500" />;
    if (action.includes('QR')) return <QrCode className="w-4 h-4 text-orange-500" />;
    return <Bell className="w-4 h-4 text-gray-500" />;
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Bell className="w-5 h-5 mr-2 text-blue-600" />
            Activity Feed
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded-full">
                {unreadCount} new
              </span>
            )}
          </h3>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Mark all as read
            </button>
          )}
        </div>
      </div>
      
      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Bell className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p>No recent activity</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className={`p-4 hover:bg-gray-50 transition-colors ${
                !activity.is_read ? 'bg-blue-50' : ''
              }`}
              onClick={() => !activity.is_read && markAsRead(activity.id)}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {getActionIcon(activity.audit_log_details.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    {activity.audit_log_details.description}
                  </p>
                  <div className="mt-1 flex items-center text-xs text-gray-500">
                    <Clock className="w-3 h-3 mr-1" />
                    {getTimeAgo(activity.created_at)}
                    {activity.audit_log_details.object_repr && (
                      <>
                        <span className="mx-1">•</span>
                        <span>{activity.audit_log_details.object_repr}</span>
                      </>
                    )}
                  </div>
                </div>
                {!activity.is_read && (
                  <div className="flex-shrink-0">
                    <span className="inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
        <Link
          to="/history/logs"
          className="text-sm text-blue-600 hover:text-blue-800 block text-center"
        >
          View all activity
        </Link>
      </div>
    </div>
  );
};

export default ActivityFeed;