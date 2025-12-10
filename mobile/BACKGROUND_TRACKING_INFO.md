# Background Location Tracking - Important Information

## ⚠️ Android Background Limitations

**Important:** Android 8.0+ has strict background limitations. The current implementation will:

✅ **Works when app is:**
- Open and visible
- Minimized (in recent apps)
- Screen is on

❌ **Stops when:**
- App is swiped away from recent apps
- Device is in Doze mode (screen off for long time)
- Battery saver is enabled

## 🔧 For True 24/7 Background Tracking

To track location even when app is closed, you need a **Foreground Service**. However, this requires:

1. **Additional Setup:**
   - Native Android code modifications
   - Persistent notification (Android requirement)
   - Battery optimization whitelist

2. **User Experience Trade-offs:**
   - Permanent notification showing "App is tracking your location"
   - Higher battery consumption
   - More complex setup

## 📱 Current Behavior

The app currently uses:
- **Position Stream**: Updates every 10 meters of movement
- **Timer Backup**: Updates every 30 seconds
- **Runs in background** as long as:
  - App is in recent apps (not swiped away)
  - Screen is on OR device not in deep sleep

## 💡 Recommendations

### For Testing:
- Keep app in recent apps (don't swipe away)
- Keep screen on or check frequently
- Disable battery optimization for the app

### For Production:
If you need true 24/7 tracking:
1. Implement Android Foreground Service
2. Show permanent notification
3. Request battery optimization exemption
4. Consider implementing WorkManager for periodic updates

## 🔋 Battery Optimization Settings

To improve background tracking:

1. **Disable Battery Optimization:**
   - Settings → Apps → People Tracking → Battery → Unrestricted

2. **Allow Background Activity:**
   - Settings → Apps → People Tracking → Battery → Background restriction → Unrestricted

3. **Lock App in Recent Apps:**
   - Recent apps → Long press app → Lock

## ✅ What's Working Now

- ✅ Real-time tracking when app is open
- ✅ Continues when minimized (not swiped away)
- ✅ Distance-based updates (every 10m)
- ✅ Time-based updates (every 30s)
- ✅ Automatic resume on app restart
- ✅ "Always allow" location permission support

The current setup is optimal for **active tracking scenarios** where users keep the app running or check it regularly.
