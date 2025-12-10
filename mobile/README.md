# Mobile App - Smart People Tracking

Flutter cross-platform mobile application for location tracking.

## 📚 Documentation

- **[Quick Start Guide](QUICK_START.md)** - Get started in 5 minutes
- **[Complete Setup Guide](MOBILE_SETUP_GUIDE.md)** - Detailed setup instructions
- **[Configuration](lib/config/app_config.dart)** - App configuration file

## 🚀 Quick Start

### 1. Install Flutter
Follow instructions at [flutter.dev](https://flutter.dev/docs/get-started/install)

### 2. Install Dependencies
```bash
flutter pub get
```

### 3. Configure API URL
Edit `lib/config/app_config.dart`:
```dart
// Android Emulator
static const String apiBaseUrl = 'http://10.0.2.2:3000/api';

// iOS Simulator
static const String apiBaseUrl = 'http://localhost:3000/api';

// Physical Device
static const String apiBaseUrl = 'http://YOUR_IP:3000/api';
```

### 4. Run the App
```bash
flutter run
```

## 📱 Features

- ✅ User authentication (Login/Register)
- ✅ Real-time GPS tracking
- ✅ Start/Stop/Pause location sharing
- ✅ Background location updates
- ✅ Automatic location updates (every 30 seconds)
- ✅ Location accuracy display
- ✅ Speed tracking

## ⚙️ Configuration

All configuration is centralized in `lib/config/app_config.dart`:

- **API Base URL** - Backend server address
- **Location Update Interval** - How often to send location (default: 30 seconds)
- **Minimum Distance** - Minimum movement to trigger update (default: 10 meters)
- **Location Accuracy** - GPS accuracy level

## 🔐 Permissions

The app requires location permissions:
- **Android:** Configured in `android/app/src/main/AndroidManifest.xml`
- **iOS:** Configured in `ios/Runner/Info.plist`

**First Launch:**
- App will request location permissions
- Grant "Allow Always" for background tracking

## 🏗️ Building for Production

### Android APK
```bash
flutter build apk --release
```
Output: `build/app/outputs/flutter-apk/app-release.apk`

### Android App Bundle (Google Play)
```bash
flutter build appbundle --release
```
Output: `build/app/outputs/bundle/release/app-release.aab`

### iOS (macOS only)
```bash
flutter build ios --release
```
Then open in Xcode to archive and upload.

## 🐛 Troubleshooting

### Common Issues

**"Unable to connect to server"**
- Check backend is running
- Verify API URL in `app_config.dart`
- Check firewall settings
- For physical device: Ensure same Wi-Fi network

**"Location permission denied"**
- Go to device Settings → Apps → Your App → Permissions
- Enable Location permission
- Select "Allow Always"

**"Build failed"**
```bash
flutter clean
flutter pub get
flutter run
```

See [MOBILE_SETUP_GUIDE.md](MOBILE_SETUP_GUIDE.md) for detailed troubleshooting.

## 📖 More Information

- **Setup Guide:** [MOBILE_SETUP_GUIDE.md](MOBILE_SETUP_GUIDE.md)
- **Quick Start:** [QUICK_START.md](QUICK_START.md)
- **Flutter Docs:** [flutter.dev](https://flutter.dev)

## 🔗 Related

- **Backend API:** See `../backend/README.md`
- **Web Dashboard:** See `../frontend/README.md`
- **Main README:** See `../README.md`

