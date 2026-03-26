import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { notificationAPI } from '../api/notifications';

const NotificationContext = createContext(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Fetch initial notifications
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      fetchCounts();
      connectWebSocket();
    }
    
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [isAuthenticated]);

  // Connect to WebSocket for real-time updates
  const connectWebSocket = useCallback(() => {
    const token = localStorage.getItem('access_token');
    if (!token || !user) {
      console.log('No token or user, skipping WebSocket connection');
      return;
    }

    // Close existing connection
    if (socketRef.current) {
      socketRef.current.close();
    }

    const wsUrl = `ws://localhost:8000/ws/notifications/?token=${token}`;
    console.log('Connecting to WebSocket:', wsUrl);
    
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected successfully');
      setIsConnected(true);
      socketRef.current = ws;
      
      // Send ping every 30 seconds to keep connection alive
      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ 
            type: 'ping', 
            timestamp: Date.now() 
          }));
        }
      }, 30000);
      
      // Store interval for cleanup
      ws.pingInterval = pingInterval;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', data.type);
        
        if (data.type === 'notification') {
          // New notification received
          setNotifications(prev => [data.notification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Show browser notification if supported
          if (Notification.permission === 'granted') {
            new Notification(data.notification.title, {
              body: data.notification.message,
              icon: '/favicon.ico'
            });
          }
        } else if (data.type === 'count_update') {
          setUnreadCount(data.count);
        } else if (data.type === 'connection_established') {
          console.log('Connection confirmed by server');
        } else if (data.type === 'pong') {
          console.log('Received pong from server');
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    ws.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
      setIsConnected(false);
      
      // Clear ping interval
      if (ws.pingInterval) {
        clearInterval(ws.pingInterval);
      }
      
      // Attempt to reconnect after 5 seconds
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('Attempting to reconnect WebSocket...');
        connectWebSocket();
      }, 5000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    socketRef.current = ws;
  }, [user]);

  const fetchNotifications = async (params = {}) => {
    setLoading(true);
    try {
      const response = await notificationAPI.getNotifications(params);
      setNotifications(response.data.results || response.data);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCounts = async () => {
    try {
      const response = await notificationAPI.getCounts();
      setUnreadCount(response.data.unread);
    } catch (err) {
      console.error('Failed to fetch counts', err);
    }
  };

  const markAsRead = async (notificationIds = []) => {
    try {
      await notificationAPI.markAsRead(notificationIds);
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          notificationIds.includes(n.id) ? { ...n, is_read: true } : n
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
      
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
      
      setUnreadCount(0);
      
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const markAsUnread = async (notificationIds) => {
    try {
      await notificationAPI.markAsUnread(notificationIds);
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          notificationIds.includes(n.id) ? { ...n, is_read: false } : n
        )
      );
      
      setUnreadCount(prev => prev + notificationIds.length);
      
    } catch (err) {
      console.error('Failed to mark as unread', err);
    }
  };

  const toggleRead = async (id) => {
    try {
      const response = await notificationAPI.toggleRead(id);
      const updated = response.data;
      
      setNotifications(prev => 
        prev.map(n => n.id === id ? updated : n)
      );
      
      // Update unread count
      if (updated.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      } else {
        setUnreadCount(prev => prev + 1);
      }
      
    } catch (err) {
      console.error('Failed to toggle read', err);
    }
  };

  const clearAll = async () => {
    try {
      await notificationAPI.clearAll();
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to clear notifications', err);
    }
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }
    
    if (Notification.permission === 'granted') {
      return true;
    }
    
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    
    return false;
  };

  const value = {
    notifications,
    unreadCount,
    loading,
    isConnected,
    fetchNotifications,
    fetchCounts,
    markAsRead,
    markAllAsRead,
    markAsUnread,
    toggleRead,
    clearAll,
    requestNotificationPermission,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};