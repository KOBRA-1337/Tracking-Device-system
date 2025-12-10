# Mobile App Configuration Guide

## ✅ Configured for Your Network

Your mobile app is now configured to connect to your backend at:
- **LAN IP**: `192.168.100.82:3000`
- **API Version**: v1

## 🔄 Background Location Tracking

The app now supports continuous background location tracking:

### Features Added:
1. **Foreground Service** - Keeps tracking even when app is minimized
2. **Real-time Updates** - Location sent every 30 seconds
3. **Battery Optimized** - Uses distance filter (10 meters) to save battery
4. **Persistent Notification** - Shows tracking status in notification bar

### Required Permissions:
- ✅ Location (Always Allow) - for background tracking
- ✅ Notifications - for foreground service
- ✅ Battery Optimization Exemption - for continuous tracking

## 📱 Setup Steps

### 1. Install Dependencies
```bash
cd mobile
flutter pub get
```

### 2. Build and Install
```bash
# For Android
flutter run

# Or build APK
flutter build apk --release
```

### 3. Grant Permissions (On Device)
When you launch the app:
1. Allow location permission → Select **"Allow all the time"**
2. Allow notification permission
3. If prompted, disable battery optimization for the app

### 4. Start Tracking
The app will automatically:
- Request necessary permissions
- Start foreground service
- Begin sending location updates every 30 seconds
- Show persistent notification with current coordinates

## 🔧 Configuration Files Modified

1. `lib/config/app_config.dart` - Updated API URL to 192.168.100.82
2. `lib/services/background_service.dart` - **NEW** - Background service manager
3. `pubspec.yaml` - Added background service dependencies
4. `android/app/src/main/AndroidManifest.xml` - Added required permissions and service declaration

## ⚙️ How It Works

### Foreground Service
The app runs a foreground service that:
- Shows a persistent notification
- Keeps the app alive even when minimized/screen off
- Tracks location continuously
- Updates notification with current coordinates

### Location Updates
- **Time-based**: Every 30 seconds (configurable in `AppConfig.locationUpdateInterval`)
- **Distance-based**: Every 10 meters of movement
- **Automatic retry**: If network fails, retries on next update

### Battery Optimization
- Uses GPS only when needed
- Combines time and distance filters
- Efficient network requests (only sends when location changes significantly)

## 🛡️ Permissions Explained

| Permission | Purpose |
|-----------|---------|
| ACCESS_FINE_LOCATION | High-accuracy GPS tracking |
| ACCESS_BACKGROUND_LOCATION | Track when app is not visible |
| FOREGROUND_SERVICE | Run background service |
| FOREGROUND_SERVICE_LOCATION | Declare service uses location |
| POST_NOTIFICATIONS | Show tracking notification |
| WAKE_LOCK | Keep device awake for updates |
| INTERNET | Send location to backend |

## 🐛 Troubleshooting

### App stops tracking when screen off
- Go to Settings → Apps → People Tracking → Battery
- Select "Unrestricted" battery usage
- Disable battery optimization

### Location not updating
- Ensure "Allow all the time" permission is granted
- Check notification shows "Location Tracking Active"
- Verify backend is running at 192.168.100.82:3000
- Check mobile device is on same network (192.168.100.x)

### Cannot connect to backend
- Verify PC firewall allows port 3000
- Test connection: `curl http://192.168.100.82:3000/api/v1/health`
- Ensure mobile and PC are on same WiFi network
- Check PC IP hasn't changed (use `ipconfig` on Windows)

## 📊 Network Requirements

- Mobile device must be on same WiFi network as PC
- PC IP: 192.168.100.82
- Backend running on port 3000
- Firewall must allow incoming connections on port 3000

## 🚀 Next Steps

1. Run `flutter pub get` in mobile directory
2. Build and install app on physical device
3. Grant all permissions when prompted
4. Start tracking from app
5. Monitor backend logs for incoming location updates
