# Physical Device Setup Guide

## Quick Fix for Connection Error

When running the app on a **physical Android device**, you need to use your **computer's IP address** instead of `localhost`.

### Step 1: Find Your Computer's IP Address

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" - it will look like `192.168.1.100`

**macOS/Linux:**
```bash
ifconfig
```
Look for "inet" address - it will look like `192.168.1.100`

### Step 2: Update Mobile App Configuration

Edit `mobile/lib/config/app_config.dart`:

```dart
// Change this line:
static const String apiBaseUrl = 'http://localhost:3000/api';

// To this (replace with YOUR IP):
static const String apiBaseUrl = 'http://192.168.1.100:3000/api';
```

**Replace `192.168.1.100` with your actual IP address!**

### Step 3: Ensure Same Network

- Your computer and phone must be on the **same Wi-Fi network**
- Both devices must be connected to the same router

### Step 4: Verify Backend is Running

1. **Start backend:**
   ```bash
   cd backend
   npm start
   ```

2. **Test from your phone's browser:**
   - Open browser on your phone
   - Go to: `http://YOUR_IP:3000/api/health`
   - Should see: `{"status":"OK","message":"Server is running"}`
   - If this doesn't work, check firewall settings

### Step 5: Rebuild and Run

```bash
cd mobile
flutter clean
flutter pub get
flutter run
```

### Step 6: Check Firewall (If Still Not Working)

**Windows:**
1. Go to Windows Defender Firewall
2. Allow Node.js through firewall
3. Or temporarily disable firewall to test

**macOS:**
```bash
# Allow incoming connections on port 3000
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/node
```

**Linux:**
```bash
sudo ufw allow 3000
```

## Example Configuration

If your computer's IP is `192.168.1.105`:

```dart
// mobile/lib/config/app_config.dart
static const String apiBaseUrl = 'http://192.168.1.105:3000/api';
```

## Troubleshooting

### "Connection refused"
- ✅ Backend is running on your computer
- ✅ Both devices on same Wi-Fi
- ✅ IP address is correct
- ✅ Firewall allows port 3000

### "Network is unreachable"
- Check Wi-Fi connection
- Verify IP address is correct
- Try pinging your computer from phone

### Still not working?
1. Test backend from phone browser first
2. Check backend console for connection attempts
3. Verify backend is listening on `0.0.0.0` (not just `localhost`)

## Quick Reference

| Device Type | API URL |
|------------|---------|
| Android Emulator | `http://10.0.2.2:3000/api` |
| iOS Simulator | `http://localhost:3000/api` |
| Physical Device | `http://YOUR_COMPUTER_IP:3000/api` |


