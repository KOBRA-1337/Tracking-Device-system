# Migration to OpenStreetMap

This document describes the migration from Google Maps to OpenStreetMap.

## Changes Made

### 1. Dependencies Updated
- **Removed:** `@react-google-maps/api`
- **Added:** `leaflet` and `react-leaflet`

### 2. MapView Component
- Completely rewritten to use Leaflet instead of Google Maps
- Uses OpenStreetMap tile layers (free, no API key required)
- All functionality preserved:
  - Real-time location markers
  - Geofence circles
  - History path polylines
  - Popups with location information

### 3. Configuration
- Removed Google Maps API key requirement
- No `.env` configuration needed for maps
- Leaflet CSS added to `index.html`

### 4. Documentation
- Updated README.md to reflect OpenStreetMap usage
- Removed Google Maps API key setup instructions
- Updated troubleshooting section

## Benefits

✅ **Free** - No API key required
✅ **No usage limits** - Unlike Google Maps free tier
✅ **Open source** - Community-driven
✅ **Same functionality** - All features work the same
✅ **Easier setup** - One less configuration step

## Installation

After pulling the changes, run:

```bash
cd frontend
npm install
```

The new dependencies (leaflet, react-leaflet) will be installed automatically.

## Marker Icons

The app uses colored markers from the `leaflet-color-markers` project. If you encounter issues with marker icons not loading:

1. Check your internet connection (icons are loaded from CDN)
2. Alternatively, you can host the marker icons locally
3. The default Leaflet markers will be used as fallback

## Tile Servers

The app uses the default OpenStreetMap tile server. If you need to use a different tile provider:

1. Edit `frontend/src/components/MapView.jsx`
2. Change the `url` prop in the `<TileLayer>` component
3. Popular alternatives:
   - Mapbox (requires API key)
   - CartoDB
   - Stamen
   - Your own tile server

## Testing

After migration, test the following:
- [ ] Map loads correctly
- [ ] Location markers appear
- [ ] Geofences display as circles
- [ ] History path shows correctly
- [ ] Popups work when clicking markers
- [ ] Real-time updates work via Socket.IO

## Rollback

If you need to rollback to Google Maps:
1. Restore the previous `MapView.jsx`
2. Reinstall `@react-google-maps/api`
3. Remove `leaflet` and `react-leaflet`
4. Restore Google Maps API key configuration

