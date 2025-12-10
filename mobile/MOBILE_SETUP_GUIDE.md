# Mobile App Setup Guide - Smart People Tracking

Complete guide to set up and run the Flutter mobile application for users.

## 📱 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Running the App](#running-the-app)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)
7. [Building for Production](#building-for-production)

---

## Prerequisites

### 1. Flutter SDK Installation

**Check if Flutter is installed:**
```bash
flutter --version
```

If Flutter is not installed, follow these steps:

#### Windows:
1. Download Flutter SDK from [flutter.dev](https://flutter.dev/docs/get-started/install/windows)
2. Extract the zip file to `C:\src\flutter`
3. Add Flutter to PATH:
   - Search for "Environment Variables" in Windows
   - Edit "Path" variable
   - Add: `C:\src\flutter\bin`
4. Verify installation:
   ```bash
   flutter doctor
   ```

#### macOS:
1. Download Flutter SDK from [flutter.dev](https://flutter.dev/docs/get-started/install/macos)
2. Extract to desired location:
   ```bash
   cd ~/development
   unzip ~/Downloads/flutter_macos_*.zip
   ```
3. Add to PATH:
   ```bash
   export PATH="$PATH:`pwd`/flutter/bin"
   ```
4. Make it permanent by adding to `~/.zshrc` or `~/.bash_profile`
5. Verify installation:
   ```bash
   flutter doctor
   ```

#### Linux:
1. Download Flutter SDK from [flutter.dev](https://flutter.dev/docs/get-started/install/linux)
2. Extract to desired location:
   ```bash
   cd ~/development
   tar xf ~/Downloads/flutter_linux_*.tar.xz
   ```
3. Add to PATH:
   ```bash
   export PATH="$PATH:`pwd`/flutter/bin"
   ```
4. Verify installation:
   ```bash
   flutter doctor
   ```

### 2. Android Studio / Xcode

**For Android Development:**
- Install [Android Studio](https://developer.android.com/studio)
- Install Android SDK and Android SDK Platform-Tools
- Set up an Android emulator or connect a physical device

**For iOS Development (macOS only):**
- Install [Xcode](https://developer.apple.com/xcode/)
- Install Xcode Command Line Tools:
  ```bash
  xcode-select --install
  ```
- Install CocoaPods:
  ```bash
  sudo gem install cocoapods
  ```

### 3. Backend Server

**Important:** Make sure your backend server is running before starting the mobile app!

1. Start the backend server:
   ```bash
   cd backend
   npm start
   ```
2. Verify it's running at `http://localhost:3000`
3. Test the API:
   ```bash
   curl http://localhost:3000/api/health
   ```

---

## Installation

### Step 1: Navigate to Mobile Directory

```bash
cd mobile
```

### Step 2: Install Dependencies

```bash
flutter pub get
```

This will install all required packages:
- `http` - HTTP requests
- `shared_preferences` - Local storage
- `geolocator` - GPS location
- `permission_handler` - Permission management
- `socket_io_client` - Real-time updates
- `flutter_local_notifications` - Notifications

### Step 3: Verify Flutter Setup

```bash
flutter doctor
```

Fix any issues shown by `flutter doctor` before proceeding.

---

## Configuration

### API Base URL Configuration

The mobile app needs to know where your backend server is running. You need to configure the API base URL based on how you're running the app.

#### Option 1: Quick Configuration (Edit Files Directly)

1. **Edit `lib/services/auth_service.dart`:**
   ```dart
   static const String baseUrl = 'http://YOUR_IP:3000/api';
   ```

2. **Edit `lib/services/location_service.dart`:**
   ```dart
   static const String baseUrl = 'http://YOUR_IP:3000/api';
   ```

#### Option 2: Find Your Computer's IP Address

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" under your active network adapter.

**macOS/Linux:**
```bash
ifconfig
```
or
```bash
ip addr show
```
Look for "inet" address (usually starts with 192.168.x.x or 10.0.x.x)

#### Configuration for Different Scenarios

##### 1. Android Emulator
```dart
static const String baseUrl = 'http://10.0.2.2:3000/api';
```
**Note:** `10.0.2.2` is a special IP that Android emulator uses to access the host machine's localhost.

##### 2. iOS Simulator (macOS)
```dart
static const String baseUrl = 'http://localhost:3000/api';
```
**Note:** iOS simulator can access localhost directly.

##### 3. Physical Device (Same Network)
```dart
static const String baseUrl = 'http://192.168.1.XXX:3000/api';
```
**Note:** Replace `XXX` with your computer's IP address. Both your computer and phone must be on the same Wi-Fi network.

##### 4. Physical Device (Different Network)
If your backend is deployed (e.g., Heroku, AWS, etc.):
```dart
static const String baseUrl = 'https://your-backend-url.com/api';
```

### Example Configuration

**For physical Android device on same network:**
```dart
// lib/services/auth_service.dart
static const String baseUrl = 'http://192.168.1.100:3000/api';

// lib/services/location_service.dart
static const String baseUrl = 'http://192.168.1.100:3000/api';
```

---

## Running the App

### Step 1: Check Connected Devices

**List all connected devices/emulators:**
```bash
flutter devices
```

You should see output like:
```
2 connected devices:

sdk gphone64 arm64 (mobile) • emulator-5554 • android-arm64  • Android 13 (API 33)
iPhone 14 Pro (mobile)      • 12345678-1234  • ios           • com.apple.CoreSimulator.SimRuntime.iOS-16-2
```

### Step 2: Start an Emulator (If Needed)

**Android:**
1. Open Android Studio
2. Go to Tools → Device Manager
3. Click "Create Device" or start an existing emulator
4. Or use command line:
   ```bash
   emulator -avd <emulator_name>
   ```

**iOS (macOS only):**
```bash
open -a Simulator
```

### Step 3: Run the App

**Run on default device:**
```bash
flutter run
```

**Run on specific device:**
```bash
flutter run -d <device_id>
```

**Run in release mode (faster):**
```bash
flutter run --release
```

**Run with hot reload enabled (default):**
- Press `r` in terminal to hot reload
- Press `R` to hot restart
- Press `q` to quit

### Step 4: First Launch

1. **Grant Permissions:**
   - The app will request location permissions
   - Tap "Allow" or "Allow While Using App"
   - For background tracking, select "Allow Always"

2. **Create Account or Login:**
   - Tap "Register" to create a new account
   - Or login with existing credentials:
     - Username: `admin`
     - Password: `admin123`

3. **Start Tracking:**
   - Tap "Start Tracking" button
   - Your location will be sent to the server
   - You can pause or stop tracking anytime

---

## Testing

### Test Checklist

- [ ] App launches without errors
- [ ] Can register a new user
- [ ] Can login with existing credentials
- [ ] Location permission is requested
- [ ] Can start location tracking
- [ ] Location updates are sent to server
- [ ] Can pause tracking
- [ ] Can stop tracking
- [ ] Location appears on web dashboard
- [ ] Can logout successfully

### Test Location Tracking

1. **Start Tracking:**
   - Open the app
   - Login
   - Tap "Start Tracking"
   - Verify status shows "Tracking active"

2. **Verify on Dashboard:**
   - Open web dashboard in browser
   - Login as admin
   - Check if your location appears on the map
   - Location should update every 30 seconds

3. **Test Pause/Resume:**
   - Tap "Pause Tracking"
   - Verify status shows "Tracking paused"
   - Tap "Resume Tracking"
   - Verify tracking resumes

4. **Test Stop:**
   - Tap "Stop Tracking"
   - Verify status shows "Tracking stopped"
   - Location should no longer update on dashboard

---

## Troubleshooting

### Issue: "Unable to connect to server"

**Solutions:**
1. **Check backend is running:**
   ```bash
   curl http://localhost:3000/api/health
   ```

2. **Check API URL configuration:**
   - Verify the IP address is correct
   - For physical device, ensure both devices are on same network
   - Check firewall settings

3. **Test API connection:**
   ```bash
   # From your phone's browser or computer
   curl http://YOUR_IP:3000/api/health
   ```

### Issue: "Location permission denied"

**Solutions:**
1. **Android:**
   - Go to Settings → Apps → Your App → Permissions
   - Enable "Location" permission
   - Select "Allow all the time" for background tracking

2. **iOS:**
   - Go to Settings → Privacy → Location Services
   - Enable location services
   - Select your app and choose "Always"

3. **Reinstall app:**
   ```bash
   flutter clean
   flutter pub get
   flutter run
   ```

### Issue: "Location not updating"

**Solutions:**
1. **Check GPS is enabled:**
   - Enable location services on your device
   - Enable GPS/Wi-Fi location

2. **Check app permissions:**
   - Verify location permission is granted
   - For background tracking, need "Always" permission

3. **Check backend logs:**
   - Look at backend server console
   - Verify location data is being received

4. **Test in different location:**
   - Move to an open area
   - GPS works better outdoors

### Issue: "Build failed" or "Gradle error"

**Solutions:**
1. **Clean build:**
   ```bash
   flutter clean
   flutter pub get
   ```

2. **Update dependencies:**
   ```bash
   flutter pub upgrade
   ```

3. **Check Android SDK:**
   - Open Android Studio
   - Go to SDK Manager
   - Ensure Android SDK is installed
   - Ensure Android SDK Platform-Tools is installed

4. **Check Java version:**
   ```bash
   java -version
   ```
   Should be Java 11 or higher

### Issue: "SocketException: Failed host lookup"

**Solutions:**
1. **Check internet connection**
2. **Verify API URL is correct**
3. **Check if backend allows CORS:**
   - Backend should allow requests from mobile app
   - Check `backend/server.js` CORS configuration

### Issue: "App crashes on startup"

**Solutions:**
1. **Check Flutter version:**
   ```bash
   flutter --version
   ```
   Should be Flutter 3.0 or higher

2. **Check dependencies:**
   ```bash
   flutter pub get
   ```

3. **Check device compatibility:**
   - Android: API level 21 or higher
   - iOS: iOS 11.0 or higher

4. **Check logs:**
   ```bash
   flutter run --verbose
   ```

### Issue: "Cannot find device"

**Solutions:**
1. **Enable USB Debugging (Android):**
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times
   - Go back to Settings → Developer Options
   - Enable "USB Debugging"

2. **Trust computer (iOS):**
   - When connecting iPhone, tap "Trust" on the device

3. **Check USB connection:**
   - Try different USB cable
   - Try different USB port

---

## Building for Production

### Android APK

**Build APK:**
```bash
flutter build apk --release
```

**Build APK for specific architectures:**
```bash
# 32-bit
flutter build apk --release --target-platform android-arm

# 64-bit
flutter build apk --release --target-platform android-arm64

# Both
flutter build apk --release --split-per-abi
```

**Output location:**
```
build/app/outputs/flutter-apk/app-release.apk
```

**Install APK:**
```bash
adb install build/app/outputs/flutter-apk/app-release.apk
```

### Android App Bundle (for Google Play)

```bash
flutter build appbundle --release
```

**Output location:**
```
build/app/outputs/bundle/release/app-release.aab
```

### iOS (macOS only)

**Build for iOS:**
```bash
flutter build ios --release
```

**Open in Xcode:**
```bash
open ios/Runner.xcworkspace
```

**Archive and upload to App Store:**
1. Open Xcode
2. Product → Archive
3. Distribute App
4. Follow App Store Connect instructions

---

## Configuration File (Advanced)

For easier configuration, you can create a configuration file:

### Create `lib/config/app_config.dart`:

```dart
class AppConfig {
  // Change this based on your setup
  static const String apiBaseUrl = 'http://192.168.1.100:3000/api';
  
  // Development
  static const String devApiUrl = 'http://localhost:3000/api';
  
  // Production
  static const String prodApiUrl = 'https://your-backend.com/api';
  
  // Get API URL based on environment
  static String getApiUrl() {
    // You can use environment variables or build flavors
    const bool isProduction = bool.fromEnvironment('dart.vm.product');
    return isProduction ? prodApiUrl : devApiUrl;
  }
}
```

Then update your services to use:
```dart
static final String baseUrl = AppConfig.getApiUrl();
```

---

## Next Steps

1. **Customize App:**
   - Update app name in `pubspec.yaml`
   - Update app icon
   - Update app theme colors

2. **Add Features:**
   - Push notifications
   - Offline mode
   - Location history
   - Geofence alerts

3. **Deploy:**
   - Build release APK/IPA
   - Distribute to users
   - Upload to app stores

---

## Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Check backend server logs
3. Check Flutter documentation: [flutter.dev](https://flutter.dev)
4. Check app logs: `flutter run --verbose`

---

## Quick Reference

### Common Commands

```bash
# Install dependencies
flutter pub get

# Run app
flutter run

# Build APK
flutter build apk --release

# Check devices
flutter devices

# Check Flutter setup
flutter doctor

# Clean build
flutter clean

# Update dependencies
flutter pub upgrade
```

### API URL Configuration

| Scenario | API URL |
|----------|---------|
| Android Emulator | `http://10.0.2.2:3000/api` |
| iOS Simulator | `http://localhost:3000/api` |
| Physical Device | `http://YOUR_IP:3000/api` |
| Production | `https://your-backend.com/api` |

---

**Happy Tracking! 🚀📍**

