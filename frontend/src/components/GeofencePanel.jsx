import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';

const GeofencePanel = ({
    onGeofenceChange,
    onClose,
    isDrawingGeofence,
    onStartDrawing,
    onStopDrawing,
    pendingCoordinates,
    onRadiusChange
}) => {
    const [geofences, setGeofences] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingGeofence, setEditingGeofence] = useState(null);
    const [assigningUsers, setAssigningUsers] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        center_latitude: '',
        center_longitude: '',
        radius_meters: 100
    });

    useEffect(() => {
        loadGeofences();
        loadUsers();
    }, []);

    // Auto-populate form when coordinates are picked from map
    useEffect(() => {
        if (pendingCoordinates?.latitude && pendingCoordinates?.longitude) {
            setFormData(prev => ({
                ...prev,
                center_latitude: pendingCoordinates.latitude.toFixed(6),
                center_longitude: pendingCoordinates.longitude.toFixed(6)
            }));
        }
    }, [pendingCoordinates?.latitude, pendingCoordinates?.longitude]);

    // Notify parent of radius changes for preview
    useEffect(() => {
        if (isDrawingGeofence && onRadiusChange) {
            onRadiusChange(formData.radius_meters);
        }
    }, [formData.radius_meters, isDrawingGeofence, onRadiusChange]);

    const loadGeofences = async () => {
        try {
            const response = await api.get('/geofences');
            setGeofences(response.data.geofences || []);
        } catch (error) {
            console.error('Error loading geofences:', error);
            toast.error('Failed to load geofences');
        } finally {
            setLoading(false);
        }
    };

    const loadUsers = async () => {
        try {
            const response = await api.get('/auth/users');
            setUsers(response.data.users || []);
        } catch (error) {
            console.error('Error loading users:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (editingGeofence) {
                await api.put(`/geofences/${editingGeofence.id}`, formData);
                toast.success('Geofence updated');
            } else {
                await api.post('/geofences', formData);
                toast.success('Geofence created');
            }

            loadGeofences();
            onGeofenceChange();
            resetForm();
            if (onStopDrawing) onStopDrawing();
        } catch (error) {
            console.error('Error saving geofence:', error);
            toast.error(error.response?.data?.error || 'Failed to save geofence');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this geofence?')) return;

        try {
            await api.delete(`/geofences/${id}`);
            toast.success('Geofence deleted');
            loadGeofences();
            onGeofenceChange();
        } catch (error) {
            console.error('Error deleting geofence:', error);
            toast.error('Failed to delete geofence');
        }
    };

    const handleEdit = (gf) => {
        setEditingGeofence(gf);
        setFormData({
            name: gf.name,
            description: gf.description || '',
            center_latitude: gf.center_latitude,
            center_longitude: gf.center_longitude,
            radius_meters: gf.radius_meters
        });
        setShowCreateForm(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            center_latitude: '',
            center_longitude: '',
            radius_meters: 100
        });
        setEditingGeofence(null);
        setShowCreateForm(false);
        if (onStopDrawing) onStopDrawing();
    };

    const handleAssignUser = async (geofenceId, userId, assign) => {
        try {
            if (assign) {
                await api.post(`/geofences/${geofenceId}/users/${userId}`);
            } else {
                await api.delete(`/geofences/${geofenceId}/users/${userId}`);
            }
            toast.success(assign ? 'User assigned' : 'User removed');
        } catch (error) {
            console.error('Error updating assignment:', error);
            toast.error('Failed to update assignment');
        }
    };

    const loadAssignedUsers = async (geofenceId) => {
        try {
            const response = await api.get(`/geofences/${geofenceId}/users`);
            return response.data.users || [];
        } catch (error) {
            console.error('Error loading assigned users:', error);
            return [];
        }
    };

    const UserAssignmentPanel = ({ geofence }) => {
        const [assignedUsers, setAssignedUsers] = useState([]);
        const [loadingAssigned, setLoadingAssigned] = useState(true);

        useEffect(() => {
            const load = async () => {
                const assigned = await loadAssignedUsers(geofence.id);
                setAssignedUsers(assigned.map(u => u.user_id));
                setLoadingAssigned(false);
            };
            load();
        }, [geofence.id]);

        const toggleUser = async (userId) => {
            const isAssigned = assignedUsers.includes(userId);
            await handleAssignUser(geofence.id, userId, !isAssigned);

            if (isAssigned) {
                setAssignedUsers(prev => prev.filter(id => id !== userId));
            } else {
                setAssignedUsers(prev => [...prev, userId]);
            }
        };

        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl shadow-2xl w-96 max-h-[80vh] overflow-hidden">
                    <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
                        <h3 className="font-semibold text-zinc-800">Assign Users to "{geofence.name}"</h3>
                        <button onClick={() => setAssigningUsers(null)} className="text-zinc-400 hover:text-zinc-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="p-4 max-h-80 overflow-y-auto">
                        {loadingAssigned ? (
                            <div className="flex justify-center py-4">
                                <div className="w-5 h-5 border-2 border-zinc-300 border-t-emerald-500 rounded-full animate-spin"></div>
                            </div>
                        ) : users.length === 0 ? (
                            <p className="text-zinc-500 text-sm text-center">No users available</p>
                        ) : (
                            <div className="space-y-2">
                                {users.map(user => (
                                    <label
                                        key={user.id}
                                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-50 cursor-pointer"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={assignedUsers.includes(user.id)}
                                            onChange={() => toggleUser(user.id)}
                                            className="w-4 h-4 text-emerald-600 rounded border-zinc-300 focus:ring-emerald-500"
                                        />
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-sm font-medium">
                                            {(user.full_name || user.username || '?')[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-zinc-800">{user.full_name || user.username}</p>
                                            <p className="text-xs text-zinc-500">{user.email}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="absolute left-8 top-24 bottom-8 w-96 z-20 flex flex-col">
            <div className="bg-white/95 backdrop-blur-xl border border-zinc-200/80 shadow-2xl shadow-zinc-900/10 rounded-2xl flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-zinc-800">Geofences</h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowCreateForm(!showCreateForm)}
                            className={`p-2 rounded-lg transition-colors ${showCreateForm
                                ? 'bg-zinc-100 text-zinc-600'
                                : 'bg-emerald-500 text-white hover:bg-emerald-600'
                                }`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showCreateForm ? "M6 18L18 6M6 6l12 12" : "M12 4v16m8-8H4"} />
                            </svg>
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Create/Edit Form */}
                {showCreateForm && (
                    <div className="p-4 border-b border-zinc-100 bg-zinc-50">
                        <h3 className="text-sm font-medium text-zinc-700 mb-3">
                            {editingGeofence ? 'Edit Geofence' : 'Create New Geofence'}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-3">
                            <input
                                type="text"
                                placeholder="Geofence Name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            />
                            <input
                                type="text"
                                placeholder="Description (optional)"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            />
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    step="any"
                                    placeholder="Latitude"
                                    value={formData.center_latitude}
                                    onChange={(e) => setFormData({ ...formData, center_latitude: e.target.value })}
                                    required
                                    className="flex-1 px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                />
                                <input
                                    type="number"
                                    step="any"
                                    placeholder="Longitude"
                                    value={formData.center_longitude}
                                    onChange={(e) => setFormData({ ...formData, center_longitude: e.target.value })}
                                    required
                                    className="flex-1 px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    if (isDrawingGeofence) {
                                        onStopDrawing();
                                    } else {
                                        onStartDrawing(formData.radius_meters);
                                    }
                                }}
                                className={`w-full py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${isDrawingGeofence
                                    ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                                    : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200'
                                    }`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {isDrawingGeofence ? 'Click on Map to Select Location...' : 'Pick Location on Map'}
                            </button>
                            <div>
                                <label className="text-xs text-zinc-500 mb-1 block">Radius: {formData.radius_meters}m</label>
                                <input
                                    type="range"
                                    min="50"
                                    max="5000"
                                    step="50"
                                    value={formData.radius_meters}
                                    onChange={(e) => setFormData({ ...formData, radius_meters: parseInt(e.target.value) })}
                                    className="w-full"
                                />
                                <div className="flex gap-2 mt-2">
                                    {[100, 250, 500, 1000].map(r => (
                                        <button
                                            key={r}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, radius_meters: r })}
                                            className={`flex-1 py-1 text-xs rounded ${formData.radius_meters === r
                                                ? 'bg-emerald-500 text-white'
                                                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                                                }`}
                                        >
                                            {r}m
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    className="flex-1 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600"
                                >
                                    {editingGeofence ? 'Update' : 'Create'}
                                </button>
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-4 py-2 bg-zinc-100 text-zinc-600 rounded-lg text-sm font-medium hover:bg-zinc-200"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Geofence List */}
                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="w-6 h-6 border-2 border-zinc-300 border-t-emerald-500 rounded-full animate-spin"></div>
                        </div>
                    ) : geofences.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="w-12 h-12 mx-auto mb-3 bg-zinc-100 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                </svg>
                            </div>
                            <p className="text-zinc-500 text-sm">No geofences yet</p>
                            <button
                                onClick={() => setShowCreateForm(true)}
                                className="mt-2 text-emerald-600 text-sm font-medium hover:text-emerald-700"
                            >
                                Create your first geofence
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {geofences.map(gf => (
                                <div
                                    key={gf.id}
                                    className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 hover:border-zinc-200 transition-colors"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h4 className="font-medium text-zinc-800">{gf.name}</h4>
                                            {gf.description && (
                                                <p className="text-xs text-zinc-500 mt-0.5">{gf.description}</p>
                                            )}
                                        </div>
                                        <span className={`px-2 py-0.5 text-xs rounded-full ${gf.is_active
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-zinc-200 text-zinc-600'
                                            }`}>
                                            {gf.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-4 text-xs text-zinc-500 mb-3">
                                        <span className="flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            </svg>
                                            {parseFloat(gf.center_latitude).toFixed(4)}, {parseFloat(gf.center_longitude).toFixed(4)}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <circle cx="12" cy="12" r="10" strokeWidth={2} />
                                            </svg>
                                            {gf.radius_meters}m
                                        </span>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setAssigningUsers(gf)}
                                            className="flex-1 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-medium hover:bg-indigo-100 flex items-center justify-center gap-1"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                            </svg>
                                            Assign Users
                                        </button>
                                        <button
                                            onClick={() => handleEdit(gf)}
                                            className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(gf.id)}
                                            className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* User Assignment Modal */}
            {assigningUsers && (
                <UserAssignmentPanel geofence={assigningUsers} />
            )}
        </div>
    );
};

export default GeofencePanel;
