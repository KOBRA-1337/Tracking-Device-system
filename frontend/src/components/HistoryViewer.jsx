import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api';
import './HistoryViewer.css';

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in meters
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Format duration from milliseconds to human readable string
 */
function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

/**
 * Format distance to human readable string
 */
function formatDistance(meters) {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${Math.round(meters)} m`;
}

const HistoryViewer = ({
  selectedUser,
  historyDateRange,
  onHistoryLoad,
  onPlaybackPositionChange,
  isVisible
}) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Quick range presets
  const presets = [
    { label: 'Last Hour', hours: 1 },
    { label: 'Last 6 Hours', hours: 6 },
    { label: 'Today', hours: 24 },
    { label: 'Yesterday', hours: 48, offset: 24 },
    { label: 'Last Week', hours: 168 },
  ];

  // Load history when user or date range changes
  useEffect(() => {
    if (selectedUser && historyDateRange.start && historyDateRange.end && isVisible) {
      loadHistory();
    } else {
      setHistory([]);
      setCurrentIndex(0);
    }
  }, [selectedUser, historyDateRange.start, historyDateRange.end, isVisible]);

  // Playback timer
  useEffect(() => {
    if (!isPlaying || history.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => {
        if (prev >= history.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1000 / playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, history.length]);

  // Notify parent of current playback position
  useEffect(() => {
    if (history.length > 0 && onPlaybackPositionChange) {
      onPlaybackPositionChange(history[currentIndex], currentIndex, history);
    }
  }, [currentIndex, history, onPlaybackPositionChange]);

  const loadHistory = async () => {
    if (!selectedUser || !historyDateRange.start || !historyDateRange.end) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/locations/history/${selectedUser}`, {
        params: {
          startDate: historyDateRange.start,
          endDate: historyDateRange.end,
          limit: 1000
        }
      });

      // Sort by timestamp ascending for playback
      const sortedHistory = (response.data.locations || []).sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
      );

      setHistory(sortedHistory);
      setCurrentIndex(0);
      setIsPlaying(false);

      if (onHistoryLoad) {
        onHistoryLoad(sortedHistory);
      }
    } catch (err) {
      console.error('Error loading history:', err);
      console.error('Error details:', err.response?.data || err.message);

      // Show more specific error message
      let errorMessage = 'Failed to load history';
      if (err.response?.status === 403) {
        errorMessage = 'Access denied - you may not have permission to view this user\'s history';
      } else if (err.response?.status === 404) {
        errorMessage = 'User not found';
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = `Failed to load history: ${err.message}`;
      }

      setError(errorMessage);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    if (history.length < 2) {
      return {
        totalDistance: 0,
        duration: 0,
        avgSpeed: 0,
        maxSpeed: 0,
        stopCount: 0
      };
    }

    let totalDistance = 0;
    let maxSpeed = 0;
    let stopCount = 0;
    const STOP_THRESHOLD = 0.5; // m/s (1.8 km/h)

    for (let i = 1; i < history.length; i++) {
      const prev = history[i - 1];
      const curr = history[i];

      const distance = calculateDistance(
        parseFloat(prev.latitude),
        parseFloat(prev.longitude),
        parseFloat(curr.latitude),
        parseFloat(curr.longitude)
      );

      totalDistance += distance;

      const speed = parseFloat(curr.speed) || 0;
      if (speed > maxSpeed) maxSpeed = speed;

      // Detect stops (speed below threshold)
      if (speed < STOP_THRESHOLD && parseFloat(prev.speed) >= STOP_THRESHOLD) {
        stopCount++;
      }
    }

    const startTime = new Date(history[0].timestamp);
    const endTime = new Date(history[history.length - 1].timestamp);
    const duration = endTime - startTime;
    const avgSpeed = duration > 0 ? (totalDistance / (duration / 1000)) : 0;

    return {
      totalDistance,
      duration,
      avgSpeed,
      maxSpeed,
      stopCount
    };
  }, [history]);

  // Export history as CSV
  const exportCSV = () => {
    if (history.length === 0) return;

    const headers = ['Timestamp', 'Latitude', 'Longitude', 'Accuracy', 'Speed', 'Heading', 'Altitude'];
    const rows = history.map(loc => [
      new Date(loc.timestamp).toISOString(),
      loc.latitude,
      loc.longitude,
      loc.accuracy || '',
      loc.speed || '',
      loc.heading || '',
      loc.altitude || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `location_history_${selectedUser}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Playback controls
  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);
  const handleStop = () => {
    setIsPlaying(false);
    setCurrentIndex(0);
  };
  const handleSliderChange = (e) => {
    setCurrentIndex(parseInt(e.target.value));
  };

  if (!isVisible) return null;

  const currentPoint = history[currentIndex];
  const progress = history.length > 1 ? (currentIndex / (history.length - 1)) * 100 : 0;

  return (
    <div className="history-viewer">
      <div className="history-header">
        <h3>📍 History Tracking</h3>
        {history.length > 0 && (
          <button className="export-btn" onClick={exportCSV} title="Export as CSV">
            📥 Export
          </button>
        )}
      </div>

      {/* Quick Range Presets */}
      <div className="quick-presets">
        {presets.map((preset, idx) => (
          <button
            key={idx}
            className="preset-btn"
            onClick={() => {
              const end = new Date();
              const start = new Date();
              if (preset.offset) {
                end.setHours(end.getHours() - preset.offset);
                start.setHours(start.getHours() - preset.hours);
              } else {
                start.setHours(start.getHours() - preset.hours);
              }
              // Format for datetime-local input
              const formatDate = (d) => d.toISOString().slice(0, 16);
              window.dispatchEvent(new CustomEvent('setHistoryRange', {
                detail: { start: formatDate(start), end: formatDate(end) }
              }));
            }}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="history-loading">
          <div className="spinner"></div>
          <span>Loading history...</span>
        </div>
      )}

      {error && <div className="history-error">{error}</div>}

      {!loading && history.length === 0 && selectedUser && (
        <div className="no-history">
          No history data found for the selected time range.
          <br />
          <small>Try selecting a different date range or user.</small>
        </div>
      )}

      {!loading && history.length > 0 && (
        <>
          {/* Statistics Panel */}
          <div className="stats-panel">
            <div className="stat-item">
              <span className="stat-icon">📏</span>
              <span className="stat-value">{formatDistance(stats.totalDistance)}</span>
              <span className="stat-label">Distance</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">⏱️</span>
              <span className="stat-value">{formatDuration(stats.duration)}</span>
              <span className="stat-label">Duration</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">🚀</span>
              <span className="stat-value">{(stats.avgSpeed * 3.6).toFixed(1)} km/h</span>
              <span className="stat-label">Avg Speed</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">⚡</span>
              <span className="stat-value">{(stats.maxSpeed * 3.6).toFixed(1)} km/h</span>
              <span className="stat-label">Max Speed</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">🛑</span>
              <span className="stat-value">{stats.stopCount}</span>
              <span className="stat-label">Stops</span>
            </div>
          </div>

          {/* Timeline Slider */}
          <div className="timeline-container">
            <div className="timeline-info">
              <span className="timeline-start">
                {new Date(history[0]?.timestamp).toLocaleTimeString()}
              </span>
              <span className="timeline-current">
                {currentPoint && new Date(currentPoint.timestamp).toLocaleString()}
              </span>
              <span className="timeline-end">
                {new Date(history[history.length - 1]?.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div className="timeline-slider-wrapper">
              <div
                className="timeline-progress"
                style={{ width: `${progress}%` }}
              ></div>
              <input
                type="range"
                className="timeline-slider"
                min="0"
                max={Math.max(0, history.length - 1)}
                value={currentIndex}
                onChange={handleSliderChange}
              />
            </div>
            <div className="timeline-position">
              Point {currentIndex + 1} of {history.length}
            </div>
          </div>

          {/* Playback Controls */}
          <div className="playback-controls">
            <button
              className="control-btn stop"
              onClick={handleStop}
              title="Stop"
            >
              ⏹️
            </button>
            {isPlaying ? (
              <button
                className="control-btn pause"
                onClick={handlePause}
                title="Pause"
              >
                ⏸️
              </button>
            ) : (
              <button
                className="control-btn play"
                onClick={handlePlay}
                title="Play"
                disabled={currentIndex >= history.length - 1}
              >
                ▶️
              </button>
            )}
            <div className="speed-controls">
              <span>Speed:</span>
              {[1, 2, 4, 8].map(speed => (
                <button
                  key={speed}
                  className={`speed-btn ${playbackSpeed === speed ? 'active' : ''}`}
                  onClick={() => setPlaybackSpeed(speed)}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>

          {/* Current Point Info */}
          {currentPoint && (
            <div className="current-point-info">
              <div className="point-coords">
                <span>📍 {parseFloat(currentPoint.latitude).toFixed(6)}, {parseFloat(currentPoint.longitude).toFixed(6)}</span>
              </div>
              {currentPoint.speed && parseFloat(currentPoint.speed) > 0 && (
                <div className="point-speed">
                  🚗 {(parseFloat(currentPoint.speed) * 3.6).toFixed(1)} km/h
                </div>
              )}
              {currentPoint.accuracy && (
                <div className="point-accuracy">
                  🎯 ±{parseFloat(currentPoint.accuracy).toFixed(0)}m
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default HistoryViewer;
