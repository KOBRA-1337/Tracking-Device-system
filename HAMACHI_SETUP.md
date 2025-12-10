# Hamachi VPN Setup Guide

## Overview
This guide explains how to configure the Smart People Tracking application to work over a Hamachi VPN network.

## Prerequisites
- Hamachi installed and running on both PCs
- Both PCs connected to the same Hamachi network
- Hamachi IPv4 address: `25.10.65.46` (your PC)

## Configuration Steps

### 1. Backend Server (PC with IP 25.10.65.46)

The backend server is already configured to listen on all network interfaces (`0.0.0.0`), which means it will accept connections from:
- Localhost (127.0.0.1)
- Local network (192.168.x.x)
- Hamachi network (25.x.x.x)

**Start the backend:**
```bash
cd backend
npm start
```

You should see:
```
🚀 Server running on http://0.0.0.0:3000
📡 Accessible via Hamachi IP: http://25.10.65.46:3000
```

### 2. Mobile App Configuration

The mobile app is already configured to use your Hamachi IP address:
- **API URL:** `http://25.10.65.46:3000/api`

**File:** `mobile/lib/config/app_config.dart`

If you need to change it:
```dart
static const String apiBaseUrl = 'http://25.10.65.46:3000/api';
```

### 3. Frontend Dashboard (React)

If you're accessing the React dashboard from the other PC:

**Option A: Access via Hamachi IP**
- Open browser on the other PC
- Navigate to: `http://25.10.65.46:5173` (or whatever port Vite uses)

**Option B: Update Socket.IO connection**
If the dashboard is running on the other PC, update the Socket.IO URL in:
`frontend/src/components/MapView.jsx`

The Socket.IO connection automatically detects the hostname, but if needed, you can hardcode:
```javascript
const socketUrl = 'http://25.10.65.46:3000';
```

## Testing the Connection

### From Mobile App (Other PC/Device)
1. Make sure both PCs are connected to the same Hamachi network
2. On the mobile device, ensure it can reach the Hamachi IP
3. Try logging in with the mobile app
4. Check if location updates are being sent

### From React Dashboard (Other PC)
1. Start the backend on PC with IP `25.10.65.46`
2. Start the frontend: `cd frontend && npm run dev`
3. Access from the other PC: `http://25.10.65.46:5173`
4. Login and check if real-time updates work

## Troubleshooting

### Connection Issues

1. **Check Hamachi Connection**
   - Verify both PCs show as "Online" in Hamachi
   - Ping the Hamachi IP: `ping 25.10.65.46`

2. **Check Firewall**
   - Windows Firewall might block port 3000
   - Allow Node.js through firewall or open port 3000
   - Command: `netsh advfirewall firewall add rule name="Node.js" dir=in action=allow protocol=TCP localport=3000`

3. **Check Backend is Running**
   - On the server PC, verify: `http://localhost:3000/api/health`
   - Should return: `{"status":"OK","message":"Server is running"}`

4. **Test from Other PC**
   - Open browser on other PC
   - Navigate to: `http://25.10.65.46:3000/api/health`
   - Should return the same JSON response

5. **Mobile App Connection**
   - Check mobile device can reach Hamachi IP
   - If using Android, ensure device has internet access
   - Try accessing `http://25.10.65.46:3000/api/health` from mobile browser

### Socket.IO Connection Issues

If real-time updates don't work:
1. Check browser console for Socket.IO errors
2. Verify CORS is enabled in backend (already configured)
3. Check that Socket.IO port (3000) is accessible

## Network Configuration

### Backend Server
- **Port:** 3000
- **Host:** 0.0.0.0 (all interfaces)
- **Hamachi IP:** 25.10.65.46

### Frontend (Vite)
- **Port:** 5173 (default)
- **Host:** Usually localhost, but can be configured

### Mobile App
- **API Base URL:** `http://25.10.65.46:3000/api`
- **Socket.IO:** `http://25.10.65.46:3000`

## Security Notes

⚠️ **Important:** When using Hamachi or exposing your server:
- The backend currently allows CORS from all origins (`origin: "*"`)
- Consider restricting CORS in production
- Use HTTPS in production
- Consider adding authentication for API endpoints

## Quick Reference

| Component | URL/Address |
|-----------|-------------|
| Backend API | `http://25.10.65.46:3000/api` |
| Backend Health | `http://25.10.65.46:3000/api/health` |
| Socket.IO | `http://25.10.65.46:3000` |
| Frontend (if exposed) | `http://25.10.65.46:5173` |
| Mobile API Config | `mobile/lib/config/app_config.dart` |

## Next Steps

1. ✅ Backend configured to listen on all interfaces
2. ✅ Mobile app configured with Hamachi IP
3. ⏭️ Test connection from mobile device
4. ⏭️ Test connection from other PC's browser
5. ⏭️ Verify real-time updates work

If you encounter any issues, check the troubleshooting section above.



