# Mobile App Connection Troubleshooting

## 🔴 Connection Timeout Error

If you see: `Connection timed out (OS Error: Connection timed out, errno = 110)`

This means the mobile device cannot reach the backend server at `25.10.65.46:3000`.

---

## ✅ Step-by-Step Troubleshooting

### Step 1: Verify Backend is Running

**On the server PC (25.10.65.46):**

1. Check if backend is running:
```bash
cd backend
npm start
```

You should see:
```
🚀 Server running on http://0.0.0.0:3000
📡 Accessible via Hamachi IP: http://25.10.65.46:3000
```

2. Test from server PC browser:
   - Open: `http://localhost:3000/api/health`
   - Should return: `{"status":"OK","message":"Server is running"}`

### Step 2: Test from Mobile Device Browser

**On the mobile device:**

1. Open a web browser (Chrome/Safari)
2. Navigate to: `http://25.10.65.46:3000/api/health`
3. If this works → Backend is accessible, issue is in the app
4. If this fails → Network/firewall issue

### Step 3: Check Firewall

**On the server PC (25.10.65.46):**

Windows Firewall might be blocking port 3000. Fix it:

**Option A: Command Line (Run as Administrator)**
```powershell
netsh advfirewall firewall add rule name="Node.js Backend" dir=in action=allow protocol=TCP localport=3000
```

**Option B: Windows Firewall GUI**
1. Open "Windows Defender Firewall"
2. Click "Advanced settings"
3. Click "Inbound Rules" → "New Rule"
4. Select "Port" → Next
5. Select "TCP" → Enter port "3000" → Next
6. Select "Allow the connection" → Next
7. Check all profiles → Next
8. Name: "Node.js Backend" → Finish

### Step 4: Verify Hamachi Connection

**On both PCs:**

1. Open Hamachi
2. Verify both PCs show as "Online" and connected
3. Check Hamachi IP addresses:
   - Server PC: Should be `25.10.65.46`
   - Other PC: Should be in the same network (25.x.x.x)

**Test connectivity:**
- From server PC: `ping [other-pc-hamachi-ip]`
- From mobile device: Try pinging `25.10.65.46` (if possible)

### Step 5: Check Mobile Device Network

**On the mobile device:**

1. **Wi-Fi Connection:**
   - Make sure device is connected to Wi-Fi
   - Some mobile networks block local IP addresses
   - Try switching Wi-Fi networks

2. **Mobile Data:**
   - Mobile data usually won't work with Hamachi
   - Use Wi-Fi only

3. **VPN/Proxy:**
   - Disable any VPN on the mobile device
   - Disable proxy settings

### Step 6: Verify API URL in App

**Check the configuration:**

The app should be using: `http://25.10.65.46:3000/api`

File: `mobile/lib/config/app_config.dart`
```dart
static const String apiBaseUrl = 'http://25.10.65.46:3000/api';
```

**If you changed the IP, rebuild the app:**
```bash
cd mobile
flutter clean
flutter pub get
flutter run
```

---

## 🔧 Quick Fixes

### Fix 1: Restart Backend
```bash
cd backend
# Stop current server (Ctrl+C)
npm start
```

### Fix 2: Check Backend Logs
Look for connection attempts in the backend console. If you don't see any, the request isn't reaching the server.

### Fix 3: Test with curl (if available on mobile)
```bash
curl http://25.10.65.46:3000/api/health
```

### Fix 4: Use IP from Other PC
If the mobile device is on the same network as the other PC (not the server), you might need to:
1. Get the other PC's Hamachi IP
2. Update the app config to use that IP
3. Make sure the other PC can reach the server

---

## 🌐 Network Configuration Checklist

- [ ] Backend running on server PC
- [ ] Backend accessible from `http://localhost:3000/api/health`
- [ ] Firewall allows port 3000 (inbound)
- [ ] Hamachi shows both PCs as "Online"
- [ ] Mobile device on Wi-Fi (not mobile data)
- [ ] Mobile device can access `http://25.10.65.46:3000/api/health` in browser
- [ ] App config has correct IP: `25.10.65.46`
- [ ] App rebuilt after config change

---

## 🧪 Test Commands

### From Server PC:
```bash
# Test backend locally
curl http://localhost:3000/api/health

# Test from Hamachi IP
curl http://25.10.65.46:3000/api/health
```

### From Mobile Device Browser:
```
http://25.10.65.46:3000/api/health
```

If this works in browser but not in app → App configuration issue
If this doesn't work in browser → Network/firewall issue

---

## 💡 Alternative Solutions

### Solution 1: Use Other PC as Proxy
If mobile device can reach the other PC but not the server:
1. Set up a proxy on the other PC
2. Configure mobile app to use proxy IP

### Solution 2: Use ngrok (Temporary Public URL)
For testing only:
```bash
# On server PC
ngrok http 3000
# Use the ngrok URL in app config
```

### Solution 3: Port Forwarding
If using router, forward port 3000 to server PC's local IP.

---

## 📱 Mobile Device Specific Issues

### Android:
- Check "Private DNS" settings (disable if enabled)
- Check if "Private Wi-Fi Address" is enabled (may cause issues)
- Try disabling "Wi-Fi Assistant" or similar features

### iOS:
- Check "Private Wi-Fi Address" in Wi-Fi settings
- Disable "Limit IP Address Tracking"
- Try resetting network settings

---

## 🔍 Debug Steps

1. **Check backend logs** - Are requests reaching the server?
2. **Check mobile device logs** - Use `flutter logs` or Android Studio
3. **Test with browser** - Can browser reach the API?
4. **Test with ping** - Can device ping the server IP?
5. **Check firewall logs** - Are connections being blocked?

---

## ✅ Success Indicators

When everything works:
- Backend shows: `Client connected` in logs
- Mobile app logs in successfully
- No timeout errors
- Location updates are sent

---

## 🆘 Still Not Working?

If none of the above works:

1. **Check if mobile device is on the same Hamachi network**
   - Mobile devices usually can't join Hamachi directly
   - You may need to use the other PC's IP instead

2. **Try using the other PC's Hamachi IP**
   - Get the other PC's Hamachi IP
   - Update app config to use that IP
   - Make sure that PC can reach the server

3. **Use a public IP or domain**
   - Set up port forwarding
   - Use a dynamic DNS service
   - Or use a cloud server

---

## Quick Reference

| Issue | Solution |
|-------|----------|
| Connection timeout | Check firewall, verify backend running |
| Can't reach server | Test in browser first |
| Works in browser, not app | Rebuild app with correct IP |
| Mobile device on different network | Use other PC's IP or set up VPN |
| Firewall blocking | Add inbound rule for port 3000 |



