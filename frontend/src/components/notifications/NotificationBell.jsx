import React, { useState, useRef, useEffect } from 'react';
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
  MoreVertical
} from 'lucide-react';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead,
    toggleRead,
    loading 
  } = useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'ASSIGNMENT_CREATED':
      case 'ASSET_CREATED':
        return <Package className="w-4 h-4 text-blue-500" />;
      case 'RETURN_REQUESTED':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'RETURN_APPROVED':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'RETURN_REJECTED':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'DAMAGE_REPORTED':
      case 'ASSIGNMENT_OVERDUE':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'WARRANTY_EXPIRING':
        return <Clock className="w-4 h-4 text-orange-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      await markAsRead([notification.id]);
    }
    
    // Navigate to related page if object_url exists
    if (notification.object_url) {
      window.location.href = notification.object_url;
    }
    
    setIsOpen(false);
  };

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    await markAllAsRead();
  };

  const displayedNotifications = showAll 
    ? notifications 
    : notifications.slice(0, 5);

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full min-w-5 h-5">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <div className="flex items-center">
              <BellRing className="w-4 h-4 text-blue-600 mr-2" />
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No notifications</p>
              </div>
            ) : (
              <>
                {displayedNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0 ${
                      !notification.is_read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start">
                      <div className="shrink-0 mr-3">
                        {getNotificationIcon(notification.notification_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium ${
                            !notification.is_read ? 'text-gray-900' : 'text-gray-600'
                          }`}>
                            {notification.title}
                          </p>
                          <span className="text-xs text-gray-400 ml-2">
                            {notification.time_ago}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        {!notification.is_read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRead(notification.id);
                            }}
                            className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {notifications.length > 5 && !showAll && (
                  <button
                    onClick={() => setShowAll(true)}
                    className="w-full px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 text-center border-t border-gray-200"
                  >
                    View all {notifications.length} notifications
                  </button>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 bg-gray-50 rounded-b-lg border-t border-gray-200">
            <Link
              to="/notifications"
              className="block text-sm text-center text-gray-600 hover:text-gray-900"
              onClick={() => setIsOpen(false)}
            >
              Manage notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;