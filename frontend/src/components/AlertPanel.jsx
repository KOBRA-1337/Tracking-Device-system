import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import api from '../services/api';
import { toast } from 'react-toastify';
import './AlertPanel.css';

// Sound for new alerts
const playAlertSound = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (e) {
    console.log('Could not play alert sound:', e);
  }
};

// Request browser notification permission
const requestNotificationPermission = async () => {
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission();
  }
};

// Show browser notification
const showBrowserNotification = (title, body, icon = '🚨') => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${icon}</text></svg>`,
      tag: 'geofence-alert',
      requireInteraction: false
    });
  }
};

const AlertPanel = ({ onAlertClick }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const socketRef = useRef(null);
  const processedAlerts = useRef(new Set());

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Load alerts
  useEffect(() => {
    loadAlerts();
    const interval = setInterval(() => {
      loadAlerts();
    }, 30000);
    return () => clearInterval(interval);
  }, [showUnreadOnly]);

  // Socket.IO connection for real-time alerts
  useEffect(() => {
    const getSocketUrl = () => {
      if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL.replace(/\/api\/v1$/, '');
      }
      return `http://${window.location.hostname}:3000`;
    };

    const socketUrl = getSocketUrl();
    socketRef.current = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
    });

    socketRef.current.on('connect', () => {
      console.log('Alert panel connected to Socket.IO');
    });

    // Listen for new alerts
    socketRef.current.on('new_alert', (alertData) => {
      // Prevent duplicate processing
      if (processedAlerts.current.has(alertData.id)) return;
      processedAlerts.current.add(alertData.id);

      // Add alert to state
      setAlerts(prev => [alertData, ...prev]);

      // Show toast notification
      const alertColor = alertData.alert_type === 'geofence_entry' ? '#48bb78' : '#f56565';
      const alertIcon = alertData.alert_type === 'geofence_entry' ? '📍' : '🚪';
      toast.info(
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>{alertIcon}</span>
          <span>{alertData.message}</span>
        </div>,
        {
          autoClose: 5000,
          style: { borderLeft: `4px solid ${alertColor}` }
        }
      );

      // Play sound
      if (soundEnabled) {
        playAlertSound();
      }

      // Show browser notification
      showBrowserNotification(
        alertData.alert_type === 'geofence_entry' ? 'Geofence Entry' : 'Geofence Exit',
        alertData.message,
        alertData.alert_type === 'geofence_entry' ? '📍' : '🚪'
      );
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [soundEnabled]);

  const loadAlerts = async () => {
    try {
      const endpoint = '/alerts/all'; // Admin gets all alerts
      const params = showUnreadOnly ? { is_read: false } : {};
      const response = await api.get(endpoint, { params });
      const newAlerts = response.data.alerts || [];

      // Track alert IDs to prevent duplicate notifications
      newAlerts.forEach(alert => {
        processedAlerts.current.add(alert.id);
      });

      setAlerts(newAlerts);
    } catch (error) {
      if (error.response?.status !== 500) {
        console.error('Error loading alerts:', error);
      }
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.patch(`/alerts/${id}/read`);
      setAlerts(prev =>
        prev.map(a => a.id === id ? { ...a, is_read: true } : a)
      );
      toast.success('Alert marked as read');
    } catch (error) {
      toast.error('Failed to mark alert as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadAlerts = alerts.filter(a => !a.is_read);
      await Promise.all(
        unreadAlerts.map(a => api.patch(`/alerts/${a.id}/read`))
      );
      setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
      toast.success('All alerts marked as read');
    } catch (error) {
      toast.error('Failed to mark alerts as read');
    }
  };

  const deleteAlert = async (id) => {
    if (!window.confirm('Are you sure you want to delete this alert?')) {
      return;
    }

    try {
      await api.delete(`/alerts/${id}`);
      setAlerts(prev => prev.filter(a => a.id !== id));
      toast.success('Alert deleted');
    } catch (error) {
      toast.error('Failed to delete alert');
    }
  };

  const handleAlertClick = (alert) => {
    if (onAlertClick) {
      onAlertClick(alert);
    }
  };

  const unreadCount = alerts.filter((a) => !a.is_read).length;

  const getAlertIcon = (alertType) => {
    switch (alertType) {
      case 'geofence_entry':
        return '📍';
      case 'geofence_exit':
        return '🚪';
      default:
        return '🔔';
    }
  };

  const getAlertClass = (alertType) => {
    switch (alertType) {
      case 'geofence_entry':
        return 'alert-entry';
      case 'geofence_exit':
        return 'alert-exit';
      default:
        return 'alert-custom';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffMs = now - alertTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <div className="alert-panel">
        <div className="alert-panel-loading">
          <div className="loading-spinner"></div>
          <span>Loading alerts...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`alert-panel ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="alert-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="alert-header-left">
          <span className="alert-icon">🔔</span>
          <h3>Alerts</h3>
          {unreadCount > 0 && (
            <span className="badge pulse">{unreadCount}</span>
          )}
        </div>
        <div className="alert-header-right">
          <button
            className={`sound-toggle ${soundEnabled ? 'on' : 'off'}`}
            onClick={(e) => {
              e.stopPropagation();
              setSoundEnabled(!soundEnabled);
            }}
            title={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>
          <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
        </div>
      </div>

      {isExpanded && (
        <>
          <div className="alert-controls">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showUnreadOnly}
                onChange={(e) => setShowUnreadOnly(e.target.checked)}
              />
              Unread only
            </label>
            {unreadCount > 0 && (
              <button
                className="mark-all-read-btn"
                onClick={markAllAsRead}
              >
                ✓ Mark all read
              </button>
            )}
          </div>

          <div className="alert-list">
            {alerts.length === 0 ? (
              <p className="no-alerts">
                <span className="no-alerts-icon">✨</span>
                No alerts
              </p>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`alert-item ${alert.is_read ? 'read' : 'unread'} ${getAlertClass(alert.alert_type)}`}
                  onClick={() => handleAlertClick(alert)}
                >
                  <div className="alert-icon-wrapper">
                    <span className="alert-type-icon">{getAlertIcon(alert.alert_type)}</span>
                  </div>
                  <div className="alert-content">
                    <div className="alert-message">{alert.message}</div>
                    <div className="alert-meta">
                      {alert.username && (
                        <span className="alert-user">👤 {alert.username}</span>
                      )}
                      {alert.geofence_name && (
                        <span className="alert-geofence">🔲 {alert.geofence_name}</span>
                      )}
                    </div>
                    <div className="alert-time">
                      {formatTimeAgo(alert.created_at)}
                    </div>
                  </div>
                  <div className="alert-actions">
                    {!alert.is_read && (
                      <button
                        className="btn-mark-read"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(alert.id);
                        }}
                        title="Mark as read"
                      >
                        ✓
                      </button>
                    )}
                    <button
                      className="btn-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteAlert(alert.id);
                      }}
                      title="Delete"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AlertPanel;
