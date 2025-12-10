import React, { useEffect, useMemo } from 'react';
import api from '../services/api';

const HistoryTimeline = ({
    selectedUser,
    historyDateRange,
    setHistoryDateRange,
    historyData,
    onHistoryLoad,
    playbackPosition,
    playbackIndex,
    setPlaybackIndex,
    isPlaying,
    setIsPlaying,
    playbackSpeed,
    setPlaybackSpeed,
    onClose
}) => {
    // Load history when user or date range changes
    useEffect(() => {
        if (selectedUser && historyDateRange.start && historyDateRange.end) {
            loadHistory();
        }
    }, [selectedUser, historyDateRange.start, historyDateRange.end]);

    // Set default date range if not set
    useEffect(() => {
        if (selectedUser && !historyDateRange.start) {
            const now = new Date();
            const start = new Date(now);
            start.setHours(0, 0, 0, 0);

            setHistoryDateRange({
                start: formatDateTimeLocal(start),
                end: formatDateTimeLocal(now)
            });
        }
    }, [selectedUser]);

    const formatDateTimeLocal = (date) => {
        const pad = (n) => n.toString().padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    };

    const loadHistory = async () => {
        try {
            const response = await api.get(`/locations/history/${selectedUser}`, {
                params: {
                    startDate: historyDateRange.start,
                    endDate: historyDateRange.end,
                    limit: 1000
                }
            });

            const sortedHistory = (response.data.locations || []).sort(
                (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
            );

            onHistoryLoad(sortedHistory);
        } catch (error) {
            console.error('Error loading history:', error);
        }
    };

    // Format time for display
    const formatTime = (date) => {
        if (!date) return '--:--';
        const d = new Date(date);
        return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    // Get time labels for timeline
    const timeLabels = useMemo(() => {
        if (historyData.length < 2) return [];
        const first = new Date(historyData[0].timestamp);
        const last = new Date(historyData[historyData.length - 1].timestamp);
        const duration = last - first;

        const labels = [];
        for (let i = 0; i <= 4; i++) {
            const time = new Date(first.getTime() + (duration * i / 4));
            labels.push(formatTime(time));
        }
        return labels;
    }, [historyData]);

    // Current progress percentage
    const progress = historyData.length > 1
        ? (playbackIndex / (historyData.length - 1)) * 100
        : 0;

    // Handle slider change
    const handleSliderChange = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percent = Math.max(0, Math.min(1, x / rect.width));
        const newIndex = Math.round(percent * (historyData.length - 1));
        setPlaybackIndex(newIndex);
    };

    // Quick date presets
    const setPreset = (preset) => {
        const now = new Date();
        let start = new Date();

        switch (preset) {
            case 'hour':
                start.setHours(now.getHours() - 1);
                break;
            case '6hours':
                start.setHours(now.getHours() - 6);
                break;
            case 'today':
                start.setHours(0, 0, 0, 0);
                break;
            case 'yesterday':
                start.setDate(now.getDate() - 1);
                start.setHours(0, 0, 0, 0);
                now.setDate(now.getDate() - 1);
                now.setHours(23, 59, 59, 999);
                break;
            default:
                break;
        }

        setHistoryDateRange({
            start: formatDateTimeLocal(start),
            end: formatDateTimeLocal(now)
        });
    };

    // Speed options
    const speeds = [1, 2, 4, 8];

    if (!selectedUser) {
        return null;
    }

    return (
        <div className="absolute bottom-8 left-8 right-8 z-30 flex justify-center">
            <div className="bg-white/95 backdrop-blur-xl border border-zinc-200/80 shadow-2xl shadow-zinc-900/10 rounded-2xl p-4 w-full max-w-4xl">
                {historyData.length === 0 ? (
                    // Date picker view
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <p className="text-sm font-medium text-zinc-700 mb-2">Select time range:</p>
                            <div className="flex items-center gap-2">
                                <input
                                    type="datetime-local"
                                    value={historyDateRange.start || ''}
                                    onChange={(e) => setHistoryDateRange(prev => ({ ...prev, start: e.target.value }))}
                                    className="bg-zinc-100 border border-zinc-200 rounded-lg px-3 py-1.5 text-sm text-zinc-700"
                                />
                                <span className="text-zinc-400">to</span>
                                <input
                                    type="datetime-local"
                                    value={historyDateRange.end || ''}
                                    onChange={(e) => setHistoryDateRange(prev => ({ ...prev, end: e.target.value }))}
                                    className="bg-zinc-100 border border-zinc-200 rounded-lg px-3 py-1.5 text-sm text-zinc-700"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setPreset('hour')} className="px-3 py-1.5 text-xs font-medium bg-zinc-100 hover:bg-zinc-200 rounded-lg text-zinc-700">Last Hour</button>
                            <button onClick={() => setPreset('6hours')} className="px-3 py-1.5 text-xs font-medium bg-zinc-100 hover:bg-zinc-200 rounded-lg text-zinc-700">6 Hours</button>
                            <button onClick={() => setPreset('today')} className="px-3 py-1.5 text-xs font-medium bg-zinc-100 hover:bg-zinc-200 rounded-lg text-zinc-700">Today</button>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-zinc-400 hover:text-zinc-700 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                ) : (
                    // Playback controls
                    <div className="flex items-center gap-4">
                        {/* Play/Pause Button */}
                        <button
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="w-10 h-10 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white flex items-center justify-center flex-shrink-0 shadow-lg transition-transform hover:scale-105 active:scale-95"
                        >
                            {isPlaying ? (
                                <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                                </svg>
                            ) : (
                                <svg className="w-[18px] h-[18px] ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            )}
                        </button>

                        {/* Speed Control */}
                        <div className="flex items-center gap-1">
                            {speeds.map(s => (
                                <button
                                    key={s}
                                    onClick={() => setPlaybackSpeed(s)}
                                    className={`text-xs font-semibold px-2 py-1 rounded cursor-pointer transition-colors ${playbackSpeed === s
                                            ? 'bg-indigo-500 text-white'
                                            : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                                        }`}
                                >
                                    {s}x
                                </button>
                            ))}
                        </div>

                        {/* Timeline Scrubber */}
                        <div className="flex-1 flex flex-col justify-center relative">
                            {/* Time Labels */}
                            <div className="flex justify-between text-[10px] text-zinc-400 font-medium tracking-tight mb-1">
                                {timeLabels.map((label, i) => (
                                    <span key={i}>{label}</span>
                                ))}
                            </div>

                            {/* Slider Container */}
                            <div
                                className="relative h-6 flex items-center group cursor-pointer"
                                onClick={handleSliderChange}
                            >
                                {/* Track Background */}
                                <div className="absolute left-0 right-0 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                                    {/* Progress */}
                                    <div
                                        className="h-full bg-indigo-500 transition-all duration-100"
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>

                                {/* Thumb */}
                                <div
                                    className="absolute w-4 h-4 bg-white border-2 border-indigo-500 shadow-md rounded-full z-20 hover:scale-110 transition-transform"
                                    style={{ left: `calc(${progress}% - 8px)` }}
                                ></div>
                            </div>
                        </div>

                        {/* Current Time Display */}
                        <div className="flex flex-col items-end min-w-[80px]">
                            <span className="text-sm font-semibold text-zinc-800 tabular-nums tracking-tight">
                                {playbackPosition ? formatTime(playbackPosition.timestamp) : '--:--'}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-medium">
                                {playbackIndex + 1} / {historyData.length} points
                            </span>
                        </div>

                        <div className="h-8 w-px bg-zinc-200 mx-2"></div>

                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="text-zinc-400 hover:text-zinc-700 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HistoryTimeline;
