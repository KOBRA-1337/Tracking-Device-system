# Quick Start Guide - Mobile App

Get the mobile app running in 5 minutes!

## 🚀 Quick Setup

### Step 1: Prerequisites Check

```bash
# Check Flutter installation
flutter --version

# Check Flutter setup
flutter doctor
```

**Fix any issues shown by `flutter doctor` before proceeding.**

### Step 2: Install Dependencies

```bash
cd mobile
flutter pub get
```

### Step 3: Configure API URL

**Edit `lib/config/app_config.dart`:**

```dart
// For Android Emulator:
static const String apiBaseUrl = 'http://10.0.2.2:3000/api';

// For iOS Simulator:
static const String apiBaseUrl = 'http://localhost:3000/api';

// For Physical Device (find your IP first):
// Windows: ipconfig
// macOS/Linux: ifconfig
static const String apiBaseUrl = 'http://192.168.1.XXX:3000/api';
```

### Step 4: Start Backend Server

```bash
# In another terminal
cd backend
npm start
```

**Verify backend is running:**
- Open browser: `http://localhost:3000/api/health`
- Should see: `{"status":"OK","message":"Server is running"}`

### Step 5: Run the App

```bash
# List available devices
flutter devices

# Run on default device
flutter run

# Or run on specific device
flutter run -d <device_id>
```

### Step 6: Test the App

1. **Grant Permissions:**
   - Allow location permissions when prompted
   - Select "Allow Always" for background tracking

2. **Create Account:**
   - Tap "Register"
   - Fill in username, email, password
   - Tap "Register"

3. **Login:**
   - Or login with: `admin` / `admin123`

4. **Start Tracking:**
   - Tap "Start Tracking"
   - Verify status shows "Tracking active"
   - Check web dashboard to see your location

## 📱 Common Configurations

### Android Emulator
```dart
// lib/config/app_config.dart
static const String apiBaseUrl = 'http://10.0.2.2:3000/api';
```

### iOS Simulator
```dart
// lib/config/app_config.dart
static const String apiBaseUrl = 'http://localhost:3000/api';
```

### Physical Device (Same Wi-Fi)

1. **Find your computer's IP:**
   ```bash
   # Windows
   ipconfig
   
   # macOS/Linux
   ifconfig
   ```

2. **Update config:**
   ```dart
   // lib/config/app_config.dart
   static const String apiBaseUrl = 'http://192.168.1.100:3000/api';
   ```
   Replace `100` with your actual IP.

3. **Ensure same network:**
   - Computer and phone must be on same Wi-Fi
   - Check firewall allows connections on port 3000

## 🔧 Troubleshooting

### "Unable to connect to server"

1. Check backend is running: `curl http://localhost:3000/api/health`
2. Verify API URL in `lib/config/app_config.dart`
3. Check firewall settings
4. For physical device: Ensure same Wi-Fi network

### "Location permission denied"

1. Go to device Settings → Apps → Your App → Permissions
2. Enable Location permission
3. Select "Allow Always" for background tracking

### "Build failed"

```bash
flutter clean
flutter pub get
flutter run
```

## 📚 Next Steps

- Read full setup guide: [MOBILE_SETUP_GUIDE.md](MOBILE_SETUP_GUIDE.md)
- Customize app configuration: [lib/config/app_config.dart](lib/config/app_config.dart)
- Build for production: See [MOBILE_SETUP_GUIDE.md](MOBILE_SETUP_GUIDE.md#building-for-production)

## 🎯 Testing Checklist

- [ ] App launches without errors
- [ ] Can register new user
- [ ] Can login
- [ ] Location permission granted
- [ ] Can start tracking
- [ ] Location appears on web dashboard
- [ ] Can pause/resume tracking
- [ ] Can stop tracking

---

**Need help?** Check [MOBILE_SETUP_GUIDE.md](MOBILE_SETUP_GUIDE.md) for detailed instructions.

