import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Circle, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import api from '../services/api';
import { toast } from 'react-toastify';
import './GeofenceManager.css';

// Create a draggable center marker icon
const createCenterIcon = () => {
  const html = `
    <div style="
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      cursor: move;
    "></div>
  `;
  return L.divIcon({
    html: html,
    className: 'geofence-center-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

// Map click handler component
const MapClickHandler = ({ onMapClick, isActive }) => {
  useMapEvents({
    click: (e) => {
      if (isActive) {
        onMapClick(e.latlng);
      }
    },
  });
  return null;
};

// Map center component
const MapCenter = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
};

const GeofenceManager = () => {
  const [geofences, setGeofences] = useState([]);
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [showUserAssignment, setShowUserAssignment] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    center_latitude: '',
    center_longitude: '',
    radius_meters: '100'
  });
  const [editingId, setEditingId] = useState(null);
  const [tempCenter, setTempCenter] = useState(null);
  const [tempRadius, setTempRadius] = useState(100);
  const [assignedUsers, setAssignedUsers] = useState({});

  useEffect(() => {
    loadGeofences();
    loadUsers();
  }, []);

  const loadGeofences = async () => {
    try {
      const response = await api.get('/geofences');
      setGeofences(response.data.geofences);
    } catch (error) {
      console.error('Error loading geofences:', error);
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

  const loadAssignedUsers = async (geofenceId) => {
    try {
      const response = await api.get(`/geofences/${geofenceId}/users`);
      setAssignedUsers(prev => ({
        ...prev,
        [geofenceId]: response.data.users || []
      }));
    } catch (error) {
      console.error('Error loading assigned users:', error);
      setAssignedUsers(prev => ({
        ...prev,
        [geofenceId]: []
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingId) {
        await api.put(`/geofences/${editingId}`, formData);
        toast.success('Geofence updated successfully');
      } else {
        await api.post('/geofences', formData);
        toast.success('Geofence created successfully');
      }
      resetForm();
      loadGeofences();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save geofence');
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setShowMapPicker(false);
    setFormData({
      name: '',
      description: '',
      center_latitude: '',
      center_longitude: '',
      radius_meters: '100'
    });
    setEditingId(null);
    setTempCenter(null);
    setTempRadius(100);
  };

  const handleEdit = (geofence) => {
    setFormData({
      name: geofence.name,
      description: geofence.description || '',
      center_latitude: geofence.center_latitude,
      center_longitude: geofence.center_longitude,
      radius_meters: geofence.radius_meters
    });
    setTempCenter([parseFloat(geofence.center_latitude), parseFloat(geofence.center_longitude)]);
    setTempRadius(parseFloat(geofence.radius_meters));
    setEditingId(geofence.id);
    setShowForm(true);
    setShowMapPicker(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this geofence?')) {
      return;
    }

    try {
      await api.delete(`/geofences/${id}`);
      toast.success('Geofence deleted successfully');
      loadGeofences();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete geofence');
    }
  };

  const handleMapClick = (latlng) => {
    setTempCenter([latlng.lat, latlng.lng]);
    setFormData(prev => ({
      ...prev,
      center_latitude: latlng.lat.toFixed(8),
      center_longitude: latlng.lng.toFixed(8)
    }));
  };

  const handleRadiusChange = (value) => {
    const radius = Math.max(10, Math.min(5000, parseInt(value) || 100));
    setTempRadius(radius);
    setFormData(prev => ({
      ...prev,
      radius_meters: radius.toString()
    }));
  };

  const toggleUserAssignment = async (geofenceId) => {
    if (showUserAssignment === geofenceId) {
      setShowUserAssignment(null);
    } else {
      setShowUserAssignment(geofenceId);
      await loadAssignedUsers(geofenceId);
    }
  };

  const handleAssignUser = async (geofenceId, userId) => {
    try {
      await api.post(`/geofences/${geofenceId}/users/${userId}`, {
        alert_on_entry: true,
        alert_on_exit: true
      });
      toast.success('User assigned to geofence');
      await loadAssignedUsers(geofenceId);
    } catch (error) {
      toast.error('Failed to assign user');
    }
  };

  const handleUnassignUser = async (geofenceId, userId) => {
    try {
      await api.delete(`/geofences/${geofenceId}/users/${userId}`);
      toast.success('User removed from geofence');
      await loadAssignedUsers(geofenceId);
    } catch (error) {
      toast.error('Failed to remove user');
    }
  };

  const startNewGeofence = () => {
    resetForm();
    setShowForm(true);
    setShowMapPicker(true);
    // Try to get current location for initial map center
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setTempCenter([position.coords.latitude, position.coords.longitude]);
        },
        () => {
          // Default to a central location if geolocation fails
          setTempCenter([40.7128, -74.0060]);
        }
      );
    } else {
      setTempCenter([40.7128, -74.0060]);
    }
  };

  return (
    <div className="geofence-manager">
      <div className="geofence-header">
        <h3>🔲 Geofences</h3>
        <button
          className="add-button"
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              startNewGeofence();
            }
          }}
        >
          {showForm ? '✕ Cancel' : '+ Add'}
        </button>
      </div>

      {showForm && (
        <form className="geofence-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Geofence Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <textarea
            placeholder="Description (optional)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          {/* Map Picker */}
          {showMapPicker && (
            <div className="map-picker-container">
              <div className="map-picker-header">
                <span>📍 Click on the map to set center</span>
              </div>
              <div className="map-picker">
                <MapContainer
                  center={tempCenter || [40.7128, -74.0060]}
                  zoom={14}
                  style={{ height: '200px', width: '100%' }}
                  scrollWheelZoom={true}
                >
                  <TileLayer
                    attribution='&copy; OpenStreetMap'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MapClickHandler
                    onMapClick={handleMapClick}
                    isActive={true}
                  />
                  {tempCenter && (
                    <>
                      <MapCenter center={tempCenter} />
                      <Marker
                        position={tempCenter}
                        icon={createCenterIcon()}
                        draggable={true}
                        eventHandlers={{
                          dragend: (e) => {
                            const latlng = e.target.getLatLng();
                            handleMapClick(latlng);
                          }
                        }}
                      />
                      <Circle
                        center={tempCenter}
                        radius={tempRadius}
                        pathOptions={{
                          color: '#667eea',
                          fillColor: '#667eea',
                          fillOpacity: 0.2,
                          weight: 2
                        }}
                      />
                    </>
                  )}
                </MapContainer>
              </div>
            </div>
          )}

          {/* Radius Slider */}
          <div className="radius-control">
            <label>
              Radius: <strong>{tempRadius}m</strong>
            </label>
            <input
              type="range"
              min="10"
              max="2000"
              value={tempRadius}
              onChange={(e) => handleRadiusChange(e.target.value)}
              className="radius-slider"
            />
            <div className="radius-presets">
              {[50, 100, 250, 500, 1000].map(r => (
                <button
                  key={r}
                  type="button"
                  className={`preset-btn ${tempRadius === r ? 'active' : ''}`}
                  onClick={() => handleRadiusChange(r)}
                >
                  {r}m
                </button>
              ))}
            </div>
          </div>

          {/* Coordinate inputs (hidden but still functional) */}
          <div className="coord-inputs">
            <div className="coord-row">
              <label>Lat:</label>
              <input
                type="number"
                step="any"
                placeholder="Latitude"
                value={formData.center_latitude}
                onChange={(e) => {
                  setFormData({ ...formData, center_latitude: e.target.value });
                  if (formData.center_longitude) {
                    setTempCenter([parseFloat(e.target.value), parseFloat(formData.center_longitude)]);
                  }
                }}
                required
              />
            </div>
            <div className="coord-row">
              <label>Lng:</label>
              <input
                type="number"
                step="any"
                placeholder="Longitude"
                value={formData.center_longitude}
                onChange={(e) => {
                  setFormData({ ...formData, center_longitude: e.target.value });
                  if (formData.center_latitude) {
                    setTempCenter([parseFloat(formData.center_latitude), parseFloat(e.target.value)]);
                  }
                }}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="submit-button"
            disabled={!formData.center_latitude || !formData.center_longitude}
          >
            {editingId ? '✓ Update Geofence' : '✓ Create Geofence'}
          </button>
        </form>
      )}

      <div className="geofence-list">
        {geofences.length === 0 ? (
          <p className="no-geofences">No geofences created yet</p>
        ) : (
          geofences.map((geofence) => (
            <div key={geofence.id} className="geofence-item">
              <div className="geofence-info">
                <strong>{geofence.name}</strong>
                <div className="geofence-details">
                  📏 Radius: {geofence.radius_meters}m
                </div>
                {geofence.description && (
                  <div className="geofence-description">{geofence.description}</div>
                )}
              </div>
              <div className="geofence-actions">
                <button
                  className="assign-button"
                  onClick={() => toggleUserAssignment(geofence.id)}
                  title="Manage Users"
                >
                  👥
                </button>
                <button
                  className="edit-button"
                  onClick={() => handleEdit(geofence)}
                >
                  ✏️
                </button>
                <button
                  className="delete-button"
                  onClick={() => handleDelete(geofence.id)}
                >
                  🗑️
                </button>
              </div>

              {/* User Assignment Panel */}
              {showUserAssignment === geofence.id && (
                <div className="user-assignment-panel">
                  <div className="assignment-header">
                    <h4>👥 Assigned Users</h4>
                  </div>
                  <div className="user-list">
                    {users.map(user => {
                      const isAssigned = (assignedUsers[geofence.id] || [])
                        .some(au => au.user_id === user.id);
                      return (
                        <div key={user.id} className="user-item">
                          <span className="user-name">
                            {user.full_name || user.username}
                          </span>
                          <button
                            className={`toggle-assign-btn ${isAssigned ? 'assigned' : ''}`}
                            onClick={() => {
                              if (isAssigned) {
                                handleUnassignUser(geofence.id, user.id);
                              } else {
                                handleAssignUser(geofence.id, user.id);
                              }
                            }}
                          >
                            {isAssigned ? '✓ Assigned' : '+ Assign'}
                          </button>
                        </div>
                      );
                    })}
                    {users.length === 0 && (
                      <p className="no-users">No users available</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default GeofenceManager;
