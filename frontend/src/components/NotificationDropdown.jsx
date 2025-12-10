import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import api from '../services/api';
import { toast } from 'react-toastify';

const NotificationDropdown = () => {
    const [alerts, setAlerts] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const dropdownRef = useRef(null);
    const socketRef = useRef(null);
    const processedAlerts = useRef(new Set());

    useEffect(() => {
        loadAlerts();

        // Socket.IO for real-time alerts
        const getSocketUrl = () => {
            if (import.meta.env.VITE_API_URL) {
                return import.meta.env.VITE_API_URL.replace(/\/api\/v1$/, '');
            }
            return `http://${window.location.hostname}:3000`;
        };

        socketRef.current = io(getSocketUrl(), {
            transports: ['websocket', 'polling'],
        });

        socketRef.current.on('new_alert', (alertData) => {
            if (processedAlerts.current.has(alertData.id)) return;
            processedAlerts.current.add(alertData.id);
            setAlerts(prev => [alertData, ...prev].slice(0, 50));

            // Show toast
            toast.info(alertData.message, {
                icon: alertData.alert_type === 'geofence_entry' ? '📍' : '🚪',
                autoClose: 5000
            });

            // Browser notification
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(
                    alertData.alert_type === 'geofence_entry' ? 'Zone Entry' : 'Zone Exit',
                    { body: alertData.message }
                );
            }
        });

        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadAlerts = async () => {
        try {
            const response = await api.get('/alerts/all');
            const newAlerts = response.data.alerts || [];
            newAlerts.forEach(a => processedAlerts.current.add(a.id));
            setAlerts(newAlerts.slice(0, 50));
        } catch (error) {
            console.error('Error loading alerts:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id, e) => {
        e.stopPropagation();
        try {
            await api.patch(`/alerts/${id}/read`);
            setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_read: true } : a));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const unread = alerts.filter(a => !a.is_read);
            await Promise.all(unread.map(a => api.patch(`/alerts/${a.id}/read`)));
            setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const formatTimeAgo = (timestamp) => {
        const now = new Date();
        const alertTime = new Date(timestamp);
        const diffMs = now - alertTime;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} mins ago`;
        const diffHours = Math.floor(diffMs / 3600000);
        if (diffHours < 24) return `${diffHours}h ago`;
        const diffDays = Math.floor(diffMs / 86400000);
        return `${diffDays}d ago`;
    };

    const unreadCount = alerts.filter(a => !a.is_read).length;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-white/90 backdrop-blur-md border border-zinc-200/60 shadow-lg shadow-zinc-200/50 rounded-lg h-10 w-10 flex items-center justify-center hover:bg-white transition-colors relative"
            >
                <svg className="w-[18px] h-[18px] text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 top-12 w-80 bg-white border border-zinc-200 shadow-xl rounded-xl overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
                        <span className="text-sm font-semibold text-zinc-800">
                            Notifications {unreadCount > 0 && `(${unreadCount})`}
                        </span>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="w-5 h-5 border-2 border-zinc-300 border-t-emerald-500 rounded-full animate-spin"></div>
                            </div>
                        ) : alerts.length === 0 ? (
                            <div className="text-center py-8 text-zinc-400 text-sm">
                                No notifications
                            </div>
                        ) : (
                            alerts.slice(0, 20).map(alert => (
                                <div
                                    key={alert.id}
                                    className={`p-3 hover:bg-zinc-50 cursor-pointer flex gap-3 border-b border-zinc-50 ${!alert.is_read ? 'bg-emerald-50/30' : ''
                                        }`}
                                    onClick={(e) => !alert.is_read && markAsRead(alert.id, e)}
                                >
                                    <div className={`mt-1 min-w-[6px] h-[6px] rounded-full ${alert.alert_type === 'geofence_exit' ? 'bg-red-500' :
                                            alert.alert_type === 'geofence_entry' ? 'bg-emerald-500' : 'bg-blue-500'
                                        } ${!alert.is_read ? '' : 'opacity-0'}`}></div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-zinc-800 truncate">
                                            {alert.alert_type === 'geofence_exit' ? 'Zone Exit Alert' :
                                                alert.alert_type === 'geofence_entry' ? 'Zone Entry Alert' : 'Alert'}
                                        </p>
                                        <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{alert.message}</p>
                                        <p className="text-[10px] text-zinc-400 mt-1">{formatTimeAgo(alert.created_at)}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
