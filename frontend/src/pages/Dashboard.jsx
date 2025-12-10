import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import MapView from '../components/MapView';
import Sidebar from '../components/Sidebar';
import HistoryTimeline from '../components/HistoryTimeline';
import NotificationDropdown from '../components/NotificationDropdown';
import GeofencePanel from '../components/GeofencePanel';
import LocationSearch from '../components/LocationSearch';

const Dashboard = () => {
  const { user, logout, isAdmin } = useAuth();
  const [selectedUser, setSelectedUser] = useState(null);
  const [showGeofences, setShowGeofences] = useState(true);
  const [activeView, setActiveView] = useState('tracking'); // 'tracking' | 'geofencing' | 'history'
  const [historyDateRange, setHistoryDateRange] = useState({
    start: null,
    end: null
  });

  // History playback state
  const [historyData, setHistoryData] = useState([]);
  const [playbackPosition, setPlaybackPosition] = useState(null);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Search
  const [searchTerm, setSearchTerm] = useState('');

  // Geofence refresh trigger
  const [geofenceRefresh, setGeofenceRefresh] = useState(0);

  // Geofence drawing state
  const [isDrawingGeofence, setIsDrawingGeofence] = useState(false);
  const [pendingGeofenceData, setPendingGeofenceData] = useState(null);

  // Handle map click for geofence creation
  const handleMapClickForGeofence = (lat, lng) => {
    setPendingGeofenceData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng
    }));
  };

  // Handle radius change for preview
  const handleGeofenceRadiusChange = (radius) => {
    setPendingGeofenceData(prev => prev ? { ...prev, radius } : null);
  };

  // Start drawing mode
  const startDrawingGeofence = (radius = 100) => {
    setIsDrawingGeofence(true);
    setPendingGeofenceData({ latitude: null, longitude: null, radius });
  };

  // Stop drawing mode
  const stopDrawingGeofence = () => {
    setIsDrawingGeofence(false);
    setPendingGeofenceData(null);
  };

  // Location search - fly to location
  const [flyToLocation, setFlyToLocation] = useState(null);

  const handleLocationSelect = (location) => {
    // Add timestamp to ensure state change is detected every time
    setFlyToLocation({
      lat: location.lat,
      lng: location.lng,
      timestamp: Date.now()
    });
  };

  // Listen for custom event from HistoryViewer presets
  useEffect(() => {
    const handleSetHistoryRange = (e) => {
      setHistoryDateRange({
        start: e.detail.start,
        end: e.detail.end
      });
    };

    window.addEventListener('setHistoryRange', handleSetHistoryRange);
    return () => window.removeEventListener('setHistoryRange', handleSetHistoryRange);
  }, []);

  // Handle history data load
  const handleHistoryLoad = useCallback((data) => {
    setHistoryData(data);
    setPlaybackIndex(0);
    setIsPlaying(false);
  }, []);

  // Handle playback position change
  const handlePlaybackPositionChange = useCallback((point, index) => {
    setPlaybackPosition(point);
    setPlaybackIndex(index);
  }, []);

  // Playback timer
  useEffect(() => {
    if (!isPlaying || historyData.length === 0) return;

    const interval = setInterval(() => {
      setPlaybackIndex(prev => {
        if (prev >= historyData.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        const newIndex = prev + 1;
        setPlaybackPosition(historyData[newIndex]);
        return newIndex;
      });
    }, 1000 / playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, historyData]);

  // Update playback position when index changes
  useEffect(() => {
    if (historyData.length > 0 && historyData[playbackIndex]) {
      setPlaybackPosition(historyData[playbackIndex]);
    }
  }, [playbackIndex, historyData]);

  // Auto enable geofence display when in geofencing view
  useEffect(() => {
    if (activeView === 'geofencing') {
      setShowGeofences(true);
    }
  }, [activeView]);

  const showHistory = activeView === 'history';

  return (
    <div className="bg-zinc-50 h-screen w-screen overflow-hidden flex text-zinc-800">
      {/* Sidebar Navigation */}
      <Sidebar
        user={user}
        isAdmin={isAdmin}
        selectedUser={selectedUser}
        onSelectUser={setSelectedUser}
        activeView={activeView}
        onViewChange={setActiveView}
        onLogout={logout}
      />

      {/* Main Content Area */}
      <main className="flex-1 relative h-full flex flex-col">
        {/* Top Floating Header */}
        <div className="absolute top-0 left-0 right-0 z-30 p-6 pointer-events-none flex justify-center">
          {/* Location Search - Centered */}
          <LocationSearch onLocationSelect={handleLocationSelect} />

          {/* Right Controls - Positioned absolutely */}
          <div className="pointer-events-auto flex items-center gap-3 absolute right-6 top-6">
            {/* Date Display */}
            <div className="bg-white/90 backdrop-blur-md border border-zinc-200/60 shadow-lg shadow-zinc-200/50 rounded-lg h-10 px-3 flex items-center gap-2 cursor-pointer hover:bg-white transition-colors">
              <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs font-medium text-zinc-700">
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

            {/* Notifications */}
            <NotificationDropdown />
          </div>
        </div>

        {/* Map View */}
        <div className="absolute inset-0 z-0">
          <MapView
            selectedUser={selectedUser}
            showGeofences={showGeofences}
            showHistory={showHistory}
            historyDateRange={historyDateRange}
            historyData={historyData}
            playbackPosition={playbackPosition}
            playbackIndex={playbackIndex}
            isAdmin={isAdmin}
            activeView={activeView}
            geofenceRefresh={geofenceRefresh}
            isDrawingGeofence={isDrawingGeofence}
            onMapClickForGeofence={handleMapClickForGeofence}
            pendingGeofenceData={pendingGeofenceData}
            flyToLocation={flyToLocation}
            onToggleGeofences={() => setShowGeofences(!showGeofences)}
          />
        </div>



        {/* Geofence Panel */}
        {activeView === 'geofencing' && (
          <GeofencePanel
            onGeofenceChange={() => {
              setGeofenceRefresh(prev => prev + 1);
              stopDrawingGeofence();
            }}
            onClose={() => {
              setActiveView('tracking');
              stopDrawingGeofence();
            }}
            isDrawingGeofence={isDrawingGeofence}
            onStartDrawing={startDrawingGeofence}
            onStopDrawing={stopDrawingGeofence}
            pendingCoordinates={pendingGeofenceData}
            onRadiusChange={handleGeofenceRadiusChange}
          />
        )}

        {/* History Timeline (Bottom) */}
        {showHistory && selectedUser && (
          <HistoryTimeline
            selectedUser={selectedUser}
            historyDateRange={historyDateRange}
            setHistoryDateRange={setHistoryDateRange}
            historyData={historyData}
            onHistoryLoad={handleHistoryLoad}
            playbackPosition={playbackPosition}
            playbackIndex={playbackIndex}
            setPlaybackIndex={setPlaybackIndex}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            playbackSpeed={playbackSpeed}
            setPlaybackSpeed={setPlaybackSpeed}
            onClose={() => setActiveView('tracking')}
          />
        )}
      </main>
    </div>
  );
};

export default Dashboard;
