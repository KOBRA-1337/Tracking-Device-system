import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { io } from 'socket.io-client';

const Sidebar = ({
    user,
    isAdmin,
    selectedUser,
    onSelectUser,
    activeView,
    onViewChange,
    onLogout
}) => {
    const [users, setUsers] = useState([]);
    const [locations, setLocations] = useState({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Load users and their locations
    useEffect(() => {
        loadUsers();
        loadLocations();

        // Socket.IO for real-time updates
        const getSocketUrl = () => {
            if (import.meta.env.VITE_API_URL) {
                return import.meta.env.VITE_API_URL.replace(/\/api\/v1$/, '');
            }
            return `http://${window.location.hostname}:3000`;
        };

        const socket = io(getSocketUrl(), {
            transports: ['websocket', 'polling'],
        });

        socket.on('location_update', (data) => {
            setLocations(prev => ({
                ...prev,
                [data.userId]: {
                    ...data.location,
                    lastUpdate: new Date()
                }
            }));
        });

        const interval = setInterval(loadLocations, 30000);

        return () => {
            socket.disconnect();
            clearInterval(interval);
        };
    }, [isAdmin]);

    const loadUsers = async () => {
        try {
            if (isAdmin) {
                const response = await api.get('/auth/users');
                setUsers(response.data.users || []);
            }
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadLocations = async () => {
        try {
            if (isAdmin) {
                const response = await api.get('/locations/all');
                const locs = response.data.locations || [];
                const locMap = {};
                locs.forEach(loc => {
                    locMap[loc.user_id] = {
                        ...loc,
                        lastUpdate: new Date(loc.timestamp)
                    };
                });
                setLocations(locMap);
            }
        } catch (error) {
            console.error('Error loading locations:', error);
        }
    };

    // Filter users based on search
    const filteredUsers = users.filter(u =>
        !searchTerm ||
        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Get user status
    const getUserStatus = (userId) => {
        const loc = locations[userId];
        if (!loc) return { status: 'offline', label: 'No signal', color: 'zinc' };

        const lastUpdate = new Date(loc.timestamp || loc.lastUpdate);
        const now = new Date();
        const diffMins = (now - lastUpdate) / 60000;

        if (diffMins < 2) {
            const speed = parseFloat(loc.speed) || 0;
            if (speed > 0.5) {
                return { status: 'moving', label: 'Moving', color: 'emerald' };
            }
            return { status: 'online', label: 'Active', color: 'emerald' };
        } else if (diffMins < 30) {
            return { status: 'idle', label: `Idle • ${Math.floor(diffMins)}m`, color: 'zinc' };
        }
        return { status: 'offline', label: 'Offline', color: 'zinc' };
    };

    const navItems = [
        { id: 'tracking', label: 'Live Tracking', icon: 'map' },
        { id: 'geofencing', label: 'Geofencing', icon: 'hexagon' },
        { id: 'history', label: 'History Playback', icon: 'history' },
    ];

    const renderIcon = (name) => {
        switch (name) {
            case 'map':
                return (
                    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                );
            case 'hexagon':
                return (
                    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 012 0l6 3.5a2 2 0 011 1.73v7a2 2 0 01-1 1.73l-6 3.5a2 2 0 01-2 0l-6-3.5a2 2 0 01-1-1.73v-7a2 2 0 011-1.73l6-3.5z" />
                    </svg>
                );
            case 'history':
                return (
                    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            default:
                return null;
        }
    };

    return (
        <aside className="w-72 bg-[#0F1117] text-zinc-400 flex flex-col border-r border-zinc-800 z-20 flex-shrink-0">
            {/* Brand */}
            <div className="h-16 flex items-center px-6 border-b border-zinc-800/50">
                <div className="flex items-center text-white">
                    <span className="text-sm font-medium tracking-tight uppercase">
                        Tracking <span className="text-emerald-500">System</span>
                    </span>
                </div>
            </div>

            {/* Main Navigation */}
            <nav className="p-4 space-y-1">
                <p className="px-2 text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2 mt-2">
                    Platform
                </p>

                {navItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => onViewChange(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeView === item.id
                            ? 'bg-zinc-800/50 text-white border border-zinc-700/50 shadow-sm'
                            : 'hover:bg-zinc-800/30 hover:text-zinc-200'
                            }`}
                    >
                        {renderIcon(item.icon)}
                        {item.label}
                    </button>
                ))}
            </nav>

            {/* Tracked Users List */}
            <div className="flex-1 overflow-y-auto px-4 py-2">
                <div className="flex items-center justify-between mb-3 px-2">
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Targets ({filteredUsers.length})
                    </p>
                </div>

                {/* Device Search */}
                <div className="mb-3">
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                            <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search devices..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="w-5 h-5 border-2 border-zinc-600 border-t-emerald-500 rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredUsers.map(u => {
                            const { status, label, color } = getUserStatus(u.id);
                            const isSelected = selectedUser === u.id;
                            const loc = locations[u.id];

                            return (
                                <div
                                    key={u.id}
                                    onClick={() => onSelectUser(u.id)}
                                    className={`group p-3 rounded-lg border transition-all cursor-pointer ${isSelected
                                        ? 'border-emerald-500/50 bg-emerald-900/20'
                                        : status === 'offline'
                                            ? 'border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800/60 opacity-60'
                                            : 'border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800/60'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-medium bg-gradient-to-br ${status === 'moving' ? 'from-emerald-500 to-emerald-600' :
                                                status === 'online' ? 'from-blue-500 to-blue-600' :
                                                    'from-zinc-600 to-zinc-700'
                                                }`}>
                                                {(u.full_name || u.username || '?')[0].toUpperCase()}
                                            </div>
                                            <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-[#0F1117] rounded-full ${color === 'emerald' ? 'bg-emerald-500' : 'bg-zinc-500'
                                                }`}></span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-medium text-zinc-200 truncate flex items-center gap-2">
                                                {u.full_name || u.username}
                                                {loc?.isOutOfZone && (
                                                    <div className="group/tooltip relative">
                                                        <div className="text-red-500 animate-pulse">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                            </svg>
                                                        </div>
                                                        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-xs text-white whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50">
                                                            Out of Safe Zone
                                                        </div>
                                                    </div>
                                                )}
                                            </h4>
                                            <p className={`text-xs flex items-center gap-1 ${color === 'emerald' ? 'text-emerald-500' : 'text-zinc-500'
                                                }`}>
                                                {status === 'moving' && (
                                                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
                                                )}
                                                {label}
                                            </p>
                                        </div>
                                    </div>

                                    {loc && status !== 'offline' && (
                                        <div className="mt-3 flex items-center justify-between border-t border-zinc-800 pt-2">
                                            {loc.speed && parseFloat(loc.speed) > 0.1 && (
                                                <div className="flex items-center gap-1 text-zinc-500" title="Speed">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                    </svg>
                                                    <span className="text-xs">{(parseFloat(loc.speed) * 3.6).toFixed(1)} km/h</span>
                                                </div>
                                            )}
                                            {loc.accuracy && (
                                                <div className="flex items-center gap-1 text-zinc-500" title="GPS Accuracy">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <span className="text-xs">±{Math.round(parseFloat(loc.accuracy))}m</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {filteredUsers.length === 0 && !loading && (
                            <div className="text-center py-8 text-zinc-500 text-sm">
                                {searchTerm ? 'No users match your search' : 'No tracked users'}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* User Profile */}
            <div className="p-4 border-t border-zinc-800">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                        {(user?.username || 'A')[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                        <div className="text-xs font-medium text-white">{user?.username || 'Admin'}</div>
                        <div className="text-xs text-zinc-500">{isAdmin ? 'Admin' : 'User'}</div>
                    </div>
                    <button
                        onClick={onLogout}
                        className="text-zinc-500 hover:text-white transition-colors"
                        title="Logout"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
