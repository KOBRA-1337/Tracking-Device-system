import React, { useState, useRef, useEffect } from 'react';

const LocationSearch = ({ onLocationSelect }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchTimeout = useRef(null);
    const containerRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setShowResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const searchLocation = async (searchQuery) => {
        if (!searchQuery || searchQuery.length < 2) {
            setResults([]);
            return;
        }

        setLoading(true);
        try {
            // Using OpenStreetMap Nominatim API - supports all languages including Arabic
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=8&addressdetails=1`
            );
            const data = await response.json();
            setResults(data);
            setShowResults(true);
        } catch (error) {
            console.error('Location search error:', error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        setQuery(value);

        // Debounce search
        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }
        searchTimeout.current = setTimeout(() => {
            searchLocation(value);
        }, 300);
    };

    const handleSelectLocation = (result) => {
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);

        setQuery(result.display_name.split(',')[0]);
        setShowResults(false);
        setResults([]);

        if (onLocationSelect) {
            onLocationSelect({ lat, lng, name: result.display_name });
        }
    };

    const getLocationIcon = (type) => {
        if (type === 'city' || type === 'town' || type === 'village') {
            return (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
            );
        }
        return (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        );
    };

    return (
        <div ref={containerRef} className="relative pointer-events-auto">
            {/* Search Input */}
            <div className="bg-white/95 backdrop-blur-md border border-zinc-200/60 shadow-lg shadow-zinc-900/10 rounded-xl flex items-center h-11 px-4 gap-3 w-80">
                <svg className="w-4 h-4 text-zinc-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                    type="text"
                    placeholder="Search cities, places..."
                    className="bg-transparent border-none outline-none text-sm text-zinc-700 placeholder-zinc-400 w-full h-full"
                    value={query}
                    onChange={handleInputChange}
                    onFocus={() => results.length > 0 && setShowResults(true)}
                />
                {loading && (
                    <div className="w-4 h-4 border-2 border-zinc-200 border-t-emerald-500 rounded-full animate-spin flex-shrink-0"></div>
                )}
            </div>

            {/* Results Dropdown */}
            {showResults && results.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-md border border-zinc-200/60 rounded-xl shadow-xl shadow-zinc-900/10 overflow-hidden z-50">
                    {results.map((result, idx) => (
                        <button
                            key={result.place_id || idx}
                            onClick={() => handleSelectLocation(result)}
                            className="w-full flex items-start gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors text-left border-b border-zinc-100 last:border-0"
                        >
                            <div className="text-zinc-400 mt-0.5">
                                {getLocationIcon(result.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-zinc-800 truncate">
                                    {result.display_name.split(',')[0]}
                                </p>
                                <p className="text-xs text-zinc-500 truncate">
                                    {result.display_name.split(',').slice(1, 3).join(',')}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* No Results */}
            {showResults && query.length >= 2 && !loading && results.length === 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-md border border-zinc-200/60 rounded-xl shadow-xl shadow-zinc-900/10 p-4 text-center">
                    <p className="text-sm text-zinc-500">No locations found</p>
                </div>
            )}
        </div>
    );
};

export default LocationSearch;
