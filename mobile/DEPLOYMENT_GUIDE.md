# Mobile App Deployment Guide

## 📱 How to Share/Deploy the Mobile App

There are several ways to share the Flutter mobile app with another PC or device:

---

## Option 1: Build APK File (Recommended for Android)

Build an APK file that can be installed on any Android device.

### Steps:

1. **Build the APK:**
```bash
cd mobile
flutter build apk --release
```

This creates: `build/app/outputs/flutter-apk/app-release.apk`

2. **Transfer the APK:**
   - **Via USB:** Copy the APK to your phone/device via USB
   - **Via Email:** Email the APK to yourself (if under 25MB)
   - **Via Cloud Storage:** Upload to Google Drive, Dropbox, etc.
   - **Via Network Share:** Share over network/Hamachi
   - **Via ADB:** `adb install app-release.apk`

3. **Install on Device:**
   - Enable "Install from Unknown Sources" in Android settings
   - Open the APK file on the device
   - Tap "Install"

### APK Location:
```
mobile/build/app/outputs/flutter-apk/app-release.apk
```

---

## Option 2: Build App Bundle (For Google Play Store)

If you want to publish to Google Play Store:

```bash
cd mobile
flutter build appbundle --release
```

Output: `build/app/outputs/bundle/release/app-release.aab`

---

## Option 3: Share Project Code (For Development)

If you want to develop on another PC:

### Method A: Git Repository
1. Initialize git (if not already):
```bash
cd mobile
git init
git add .
git commit -m "Initial commit"
```

2. Push to GitHub/GitLab/Bitbucket
3. Clone on other PC

### Method B: Copy Project Folder
1. Copy the entire `mobile/` folder
2. On the other PC:
```bash
cd mobile
flutter pub get
flutter run
```

### Method C: Zip and Transfer
1. Zip the `mobile/` folder
2. Transfer via:
   - USB drive
   - Network share (Hamachi)
   - Cloud storage
   - Email (if small enough)

3. On the other PC:
   - Extract the zip
   - Run `flutter pub get`
   - Run `flutter run`

---

## Option 4: Direct Install via ADB (USB Connection)

If you have the device connected via USB:

```bash
cd mobile
flutter build apk --release
adb install build/app/outputs/flutter-apk/app-release.apk
```

---

## Option 5: Share via Network (Hamachi)

Since you're using Hamachi, you can share files directly:

### On Server PC (25.10.65.46):

1. **Build the APK:**
```bash
cd mobile
flutter build apk --release
```

2. **Share the folder:**
   - Right-click `mobile/build/app/outputs/flutter-apk/`
   - Properties → Sharing → Share
   - Or use Windows File Sharing

3. **Access from Other PC:**
   - Open File Explorer
   - Go to: `\\25.10.65.46\shared_folder`
   - Copy `app-release.apk`

---

## 📋 Pre-Deployment Checklist

Before building for release:

### 1. Update API Configuration
Make sure `mobile/lib/config/app_config.dart` has the correct API URL:
```dart
static const String apiBaseUrl = 'http://25.10.65.46:3000/api';
```

### 2. Update App Version (Optional)
Edit `mobile/pubspec.yaml`:
```yaml
version: 1.0.1+2  # Increment version number
```

### 3. Build Release APK
```bash
cd mobile
flutter clean
flutter pub get
flutter build apk --release
```

### 4. Test the APK
Install on a test device first to make sure it works.

---

## 🔧 Troubleshooting

### APK Won't Install
- Enable "Install from Unknown Sources" in Android settings
- Check if device architecture matches (arm64-v8a, armeabi-v7a, x86_64)
- Try building for specific architecture:
  ```bash
  flutter build apk --release --target-platform android-arm64
  ```

### APK Too Large
- Use split APKs:
  ```bash
  flutter build apk --split-per-abi
  ```
  This creates separate APKs for each architecture (smaller files)

### Build Errors
- Make sure Flutter is up to date: `flutter upgrade`
- Clean build: `flutter clean && flutter pub get`
- Check Android SDK is properly installed

---

## 📱 Installation Instructions for End Users

### Android Device:

1. **Download the APK** to your device
2. **Enable Unknown Sources:**
   - Settings → Security → Unknown Sources (enable)
   - Or: Settings → Apps → Special Access → Install Unknown Apps
3. **Open the APK file** from Downloads
4. **Tap "Install"**
5. **Open the app** and login

### First Launch:
- Grant location permissions when prompted
- Select "Allow all the time" for background tracking
- Login with credentials

---

## 🚀 Quick Commands Reference

```bash
# Build release APK
flutter build apk --release

# Build split APKs (smaller, architecture-specific)
flutter build apk --split-per-abi

# Build for specific architecture
flutter build apk --release --target-platform android-arm64

# Build app bundle (for Play Store)
flutter build appbundle --release

# Install directly via ADB
flutter install --release
```

---

## 📦 File Sizes

- **Full APK:** ~30-50 MB (includes all architectures)
- **Split APK (arm64):** ~15-25 MB (most common)
- **Split APK (armeabi):** ~15-25 MB (older devices)

---

## 💡 Tips

1. **For Testing:** Use `flutter run --release` to test release mode
2. **For Distribution:** Build APK and share via your preferred method
3. **For Updates:** Increment version number in `pubspec.yaml`
4. **For Multiple Devices:** Use split APKs to reduce file size

---

## 🔐 Security Note

⚠️ **Important:** The APK contains the API URL. If you change the backend IP, you'll need to rebuild the APK with the new IP address in `app_config.dart`.

---

## Next Steps

1. ✅ Build the APK: `flutter build apk --release`
2. ✅ Transfer to device/other PC
3. ✅ Install and test
4. ✅ Verify connection to backend works



