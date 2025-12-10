import React, { useEffect, useState, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { io } from 'socket.io-client';
import api from '../services/api';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create custom marker icon
const createUserMarker = (initials, isActive = true, isSelected = false, isOffline = false) => {
  const bgColor = isOffline ? '#71717a' : (isActive ? (isSelected ? '#10b981' : '#3b82f6') : '#6b7280');
  const size = isOffline ? 30 : 36; // Smaller size if offline
  const fontSize = isOffline ? 10 : 12;
  const opacity = isOffline ? 0.8 : 1;

  const html = `
    <div style="
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: ${bgColor};
      border: 3px solid white;
      box-shadow: 0 4px 12px rgba(0, 0, 0, ${isOffline ? 0.15 : 0.25});
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: ${fontSize}px;
      font-family: 'Inter', sans-serif;
      opacity: ${opacity};
      position: relative;
    ">${initials}
      ${isOffline ? `
      <div style="
        position: absolute;
        bottom: 0;
        right: 0;
        width: 10px;
        height: 10px;
        background-color: #52525b;
        border: 2px solid white;
        border-radius: 50%;
      "></div>
      ` : ''}
    </div>
  `;
  return L.divIcon({
    html,
    className: 'custom-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -20],
  });
};

// Create playback marker
const createPlaybackMarker = () => {
  const html = `
    <div class="playback-marker">
      <div class="playback-marker-pulse"></div>
      <div class="playback-marker-inner"></div>
    </div>
  `;
  return L.divIcon({
    html,
    className: 'playback-marker-container',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

// Create waypoint marker
const createWaypointMarker = (label, isStart, isEnd) => {
  let bgColor = '#6366f1';
  if (isStart) bgColor = '#10b981';
  if (isEnd) bgColor = '#ef4444';

  const html = `
    <div style="
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: ${bgColor};
      border: 2px solid white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 10px;
      font-family: 'Inter', sans-serif;
    ">${label}</div>
  `;
  return L.divIcon({
    html,
    className: 'waypoint-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const MapController = ({ center, zoom }) => {
  const map = useMap();
  const prevCenterRef = React.useRef(null);
  const prevZoomRef = React.useRef(null);

  useEffect(() => {
    if (center && center.length === 2) {
      const [lat, lng] = center;
      const prevCenter = prevCenterRef.current;
      const prevZoom = prevZoomRef.current;

      // Check if center or zoom actually changed
      const centerChanged = !prevCenter || prevCenter[0] !== lat || prevCenter[1] !== lng;
      const zoomChanged = prevZoom !== zoom;

      if (centerChanged || zoomChanged) {
        map.flyTo([lat, lng], zoom || 14, { duration: 0.8 });
        prevCenterRef.current = [lat, lng];
        prevZoomRef.current = zoom;
      }
    }
  }, [center, zoom, map]);

  return null;
};

// Component to handle map clicks for geofence creation
const GeofenceClickHandler = ({ isDrawing, onMapClick }) => {
  useMapEvents({
    click: (e) => {
      if (isDrawing && onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    }
  });
  return null;
};

// Controls component that has access to map context
const MapControls = ({ showGeofences, onToggleGeofences }) => {
  const map = useMap();

  return (
    <div className="leaflet-bottom leaflet-right !bottom-6 !right-6 flex flex-col gap-2 pointer-events-auto z-[1000]">
      <button
        className="w-10 h-10 bg-white border border-zinc-200 shadow-md rounded-lg flex items-center justify-center text-zinc-600 hover:text-emerald-600 hover:border-emerald-200 transition-colors"
        title="Zoom In"
        onClick={(e) => {
          e.stopPropagation(); // Prevent map click
          map.zoomIn();
        }}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
      <button
        className="w-10 h-10 bg-white border border-zinc-200 shadow-md rounded-lg flex items-center justify-center text-zinc-600 hover:text-emerald-600 hover:border-emerald-200 transition-colors"
        title="Zoom Out"
        onClick={(e) => {
          e.stopPropagation();
          map.zoomOut();
        }}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
      </button>
      <div className="h-4"></div>
      <button
        className={`w-10 h-10 bg-white border shadow-md rounded-lg flex items-center justify-center transition-colors ${showGeofences ? 'text-emerald-600 border-emerald-200 bg-emerald-50' : 'text-zinc-600 border-zinc-200 hover:text-emerald-600 hover:border-emerald-200'
          }`}
        title="Toggle Geofences"
        onClick={(e) => {
          e.stopPropagation();
          onToggleGeofences && onToggleGeofences();
        }}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      </button>
    </div>
  );
};

const MapView = ({
  selectedUser,
  showGeofences,
  showHistory,
  historyDateRange,
  historyData,
  playbackPosition,
  playbackIndex,
  isAdmin,
  activeView,
  geofenceRefresh,
  isDrawingGeofence,
  onMapClickForGeofence,
  pendingGeofenceData,
  flyToLocation,
  onToggleGeofences
}) => {
  const [locations, setLocations] = useState({});
  const [geofences, setGeofences] = useState([]);
  const [mapCenter, setMapCenter] = useState([36.1901, 44.0091]); // Default: Erbil
  const [mapZoom, setMapZoom] = useState(14);
  const socketRef = useRef(null);

  // Load initial data
  useEffect(() => {
    loadLocations();
  }, []);

  // Reload geofences when showGeofences or geofenceRefresh changes
  useEffect(() => {
    if (showGeofences) {
      loadGeofences();
    }
  }, [showGeofences, geofenceRefresh]);

  // Socket.IO for real-time updates
  useEffect(() => {
    const getSocketUrl = () => {
      if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL.replace(/\/api\/v1$/, '');
      }
      return `http://${window.location.hostname}:3000`;
    };

    socketRef.current = io(getSocketUrl(), {
      transports: ['websocket', 'polling'],
    });

    socketRef.current.on('location_update', (data) => {
      setLocations(prev => ({
        ...prev,
        [data.userId]: {
          ...data.location,
          user_id: data.userId
        }
      }));
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const loadLocations = async () => {
    try {
      if (isAdmin) {
        const response = await api.get('/locations/all');
        const locs = response.data.locations || [];
        const locMap = {};
        locs.forEach(loc => {
          locMap[loc.user_id] = loc;
        });
        setLocations(locMap);

        // Set map center to first location
        if (locs.length > 0) {
          setMapCenter([parseFloat(locs[0].latitude), parseFloat(locs[0].longitude)]);
        }
      }
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const loadGeofences = async () => {
    try {
      const response = await api.get('/geofences');
      setGeofences(response.data.geofences || []);
    } catch (error) {
      console.error('Error loading geofences:', error);
    }
  };

  // Center on selected user
  useEffect(() => {
    if (selectedUser && locations[selectedUser]) {
      const loc = locations[selectedUser];
      setMapCenter([parseFloat(loc.latitude), parseFloat(loc.longitude)]);
    }
  }, [selectedUser, locations]);

  // Center on playback position
  useEffect(() => {
    if (showHistory && playbackPosition) {
      setMapCenter([parseFloat(playbackPosition.latitude), parseFloat(playbackPosition.longitude)]);
    }
  }, [playbackPosition, showHistory]);

  // Fly to searched location with appropriate zoom
  useEffect(() => {
    if (flyToLocation) {
      setMapCenter([flyToLocation.lat, flyToLocation.lng]);
      setMapZoom(10); // Wide city-level zoom
    }
  }, [flyToLocation]);

  // Get speed color for path
  const getSpeedColor = (speed) => {
    const s = parseFloat(speed) || 0;
    if (s < 2) return '#10b981'; // Green - slow/stopped
    if (s < 10) return '#f59e0b'; // Orange - walking
    if (s < 30) return '#f97316'; // Orange - running/cycling
    return '#ef4444'; // Red - driving
  };

  // Create color-coded path segments
  const colorCodedPaths = useMemo(() => {
    if (!historyData || historyData.length < 2) return [];

    const segments = [];
    for (let i = 0; i < historyData.length - 1; i++) {
      const point1 = historyData[i];
      const point2 = historyData[i + 1];
      segments.push({
        positions: [
          [parseFloat(point1.latitude), parseFloat(point1.longitude)],
          [parseFloat(point2.latitude), parseFloat(point2.longitude)]
        ],
        color: getSpeedColor(point2.speed)
      });
    }
    return segments;
  }, [historyData]);

  // Played path (up to current position)
  const playedPath = useMemo(() => {
    if (!historyData || playbackIndex === 0) return [];
    return historyData.slice(0, playbackIndex + 1).map(p => [
      parseFloat(p.latitude),
      parseFloat(p.longitude)
    ]);
  }, [historyData, playbackIndex]);

  // Waypoint markers
  const waypoints = useMemo(() => {
    if (!historyData || historyData.length === 0) return [];

    const points = [];
    const step = Math.max(1, Math.floor(historyData.length / 10));

    historyData.forEach((point, index) => {
      if (index === 0 || index === historyData.length - 1 || index % step === 0) {
        points.push({
          position: [parseFloat(point.latitude), parseFloat(point.longitude)],
          label: index === 0 ? 'S' : index === historyData.length - 1 ? 'E' : String(Math.floor(index / step)),
          isStart: index === 0,
          isEnd: index === historyData.length - 1,
          timestamp: point.timestamp
        });
      }
    });

    return points;
  }, [historyData]);

  // Location markers
  const locationMarkers = useMemo(() => {
    if (showHistory) return []; // Hide live markers in history mode

    return Object.values(locations).map(loc => {
      const lastUpdate = new Date(loc.timestamp);
      const now = new Date();
      const diffMins = (now - lastUpdate) / 60000;
      const isOffline = diffMins > 2; // Treat as offline/idle if > 2 mins (matches Sidebar idle)

      return {
        ...loc,
        position: [parseFloat(loc.latitude), parseFloat(loc.longitude)],
        initials: (loc.full_name || loc.username || '?')[0].toUpperCase(),
        isSelected: loc.user_id === selectedUser,
        isOffline
      };
    });
  }, [locations, selectedUser, showHistory]);

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={mapCenter}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap'
        />

        <MapController center={mapCenter} zoom={mapZoom} />

        {/* Custom Map Controls (Zoom, Geofences) */}
        <MapControls showGeofences={showGeofences} onToggleGeofences={onToggleGeofences} />

        {/* Geofence Click Handler */}
        <GeofenceClickHandler isDrawing={isDrawingGeofence} onMapClick={onMapClickForGeofence} />

        {/* Geofences */}
        {showGeofences && geofences.map(gf => (
          <Circle
            key={gf.id}
            center={[parseFloat(gf.center_latitude), parseFloat(gf.center_longitude)]}
            radius={parseFloat(gf.radius_meters)}
            pathOptions={{
              color: gf.is_active ? '#10b981' : '#6b7280',
              fillColor: gf.is_active ? '#10b981' : '#6b7280',
              fillOpacity: 0.1,
              weight: 2,
              dashArray: '5, 5'
            }}
          >
            <Popup>
              <div className="font-inter">
                <strong className="text-zinc-800">{gf.name}</strong>
                {gf.description && <p className="text-zinc-500 text-sm">{gf.description}</p>}
                <p className="text-zinc-400 text-xs">Radius: {gf.radius_meters}m</p>
              </div>
            </Popup>
          </Circle>
        ))}

        {/* Pending Geofence Preview */}
        {isDrawingGeofence && pendingGeofenceData?.latitude && pendingGeofenceData?.longitude && (
          <Circle
            center={[pendingGeofenceData.latitude, pendingGeofenceData.longitude]}
            radius={pendingGeofenceData.radius || 100}
            pathOptions={{
              color: '#6366f1',
              fillColor: '#6366f1',
              fillOpacity: 0.2,
              weight: 3,
              dashArray: '10, 10'
            }}
          >
            <Popup>
              <div className="font-inter">
                <strong className="text-zinc-800">New Geofence</strong>
                <p className="text-zinc-400 text-xs">Radius: {pendingGeofenceData.radius || 100}m</p>
                <p className="text-zinc-400 text-xs">Click "Create" to confirm</p>
              </div>
            </Popup>
          </Circle>
        )}

        {/* Live Location Markers */}
        {locationMarkers.map(loc => (
          <Marker
            key={loc.user_id}
            position={loc.position}
            icon={createUserMarker(loc.initials, true, loc.isSelected, loc.isOffline)}
          >
            <Popup>
              <div className="font-inter min-w-[150px]">
                <strong className="text-zinc-800 block">{loc.full_name || loc.username}</strong>
                {loc.isOffline ? (
                  <span className="text-zinc-500 text-xs flex items-center gap-1 mt-1">
                    <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full"></span>
                    Offline
                  </span>
                ) : (
                  <span className="text-emerald-500 text-xs flex items-center gap-1 mt-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    Active
                  </span>
                )}
                {loc.speed && parseFloat(loc.speed) > 0 && (
                  <p className="text-zinc-500 text-xs mt-2">
                    Speed: {(parseFloat(loc.speed) * 3.6).toFixed(1)} km/h
                  </p>
                )}
                <p className="text-zinc-400 text-[10px] mt-1">
                  {new Date(loc.timestamp).toLocaleString()}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* History Path - Color coded */}
        {showHistory && colorCodedPaths.map((segment, idx) => (
          <Polyline
            key={idx}
            positions={segment.positions}
            pathOptions={{
              color: segment.color,
              weight: 3,
              opacity: 0.6
            }}
          />
        ))}

        {/* Played Path Highlight */}
        {showHistory && playedPath.length > 1 && (
          <Polyline
            positions={playedPath}
            pathOptions={{
              color: '#6366f1',
              weight: 4,
              opacity: 0.9
            }}
          />
        )}

        {/* Waypoint Markers */}
        {showHistory && waypoints.map((wp, idx) => (
          <Marker
            key={idx}
            position={wp.position}
            icon={createWaypointMarker(wp.label, wp.isStart, wp.isEnd)}
          >
            <Popup>
              <div className="font-inter">
                <strong className="text-zinc-800">
                  {wp.isStart ? 'Start' : wp.isEnd ? 'End' : `Point ${wp.label}`}
                </strong>
                <p className="text-zinc-400 text-xs">{new Date(wp.timestamp).toLocaleString()}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Playback Position Marker */}
        {showHistory && playbackPosition && (
          <Marker
            position={[parseFloat(playbackPosition.latitude), parseFloat(playbackPosition.longitude)]}
            icon={createPlaybackMarker()}
          >
            <Popup>
              <div className="font-inter">
                <strong className="text-zinc-800">Current Position</strong>
                {playbackPosition.speed && (
                  <p className="text-zinc-500 text-xs">
                    Speed: {(parseFloat(playbackPosition.speed) * 3.6).toFixed(1)} km/h
                  </p>
                )}
                <p className="text-zinc-400 text-xs">
                  {new Date(playbackPosition.timestamp).toLocaleString()}
                </p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Speed Legend (when in history mode) */}
      {showHistory && historyData.length > 0 && (
        <div className="absolute bottom-32 left-8 bg-white/90 backdrop-blur-md border border-zinc-200 rounded-lg px-3 py-2 shadow-lg z-20">
          <p className="text-[10px] font-medium text-zinc-500 uppercase mb-2">Speed</p>
          <div className="flex items-center gap-3 text-[10px]">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-emerald-500"></div>
              <span className="text-zinc-600">Slow</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-amber-500"></div>
              <span className="text-zinc-600">Medium</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-red-500"></div>
              <span className="text-zinc-600">Fast</span>
            </div>
          </div>
        </div>
      )}

      {/* Drawing Mode Indicator */}
      {isDrawingGeofence && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg z-30 flex items-center gap-2">
          <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          <span className="text-sm font-medium">Click on map to place geofence</span>
        </div>
      )}
    </div>
  );
};

export default MapView;
