# 🚀 Smart People Tracking Application

A comprehensive system for tracking people's locations in real-time, designed for **family security** (tracking children or seniors) and **logistics companies** (tracking delivery staff or vehicles).

## 📋 Project Overview

This project consists of three main components:

1. **Backend API** - Node.js/Express server with MySQL database
2. **Web Dashboard** - React-based admin interface
3. **Mobile App** - Flutter cross-platform application

## 🛠️ Technology Stack

- **Backend:** Node.js, Express.js, MySQL
- **Frontend:** React, Vite, Google Maps API
- **Mobile:** Flutter (Dart)
- **Real-time:** Socket.IO
- **Authentication:** JWT (JSON Web Tokens)

## 📁 Project Structure

```
.
├── backend/          # Node.js/Express API server
├── frontend/         # React web dashboard
├── mobile/           # Flutter mobile application
└── README.md         # This file
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v16 or higher)
- **MySQL** (v8.0 or higher)
- **Flutter SDK** (v3.0 or higher)
- **No API keys required** (uses free OpenStreetMap tiles)

### 1. Database Setup

**Detailed MySQL setup instructions are in [MYSQL_SETUP.md](MYSQL_SETUP.md)**

Quick setup:

1. Make sure MySQL is installed and running
2. Create the database:
```sql
CREATE DATABASE IF NOT EXISTS people_tracking_db;
```

3. Run the schema file:
```bash
# Windows (PowerShell)
Get-Content backend\database\schema.sql | mysql -u root -p people_tracking_db

# Linux/Mac
mysql -u root -p people_tracking_db < backend/database/schema.sql
```

**Note:** You'll be prompted for your MySQL root password.

### 2. Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Update `.env` with your database credentials:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=people_tracking_db
JWT_SECRET=your_super_secret_jwt_key
```

5. Create the admin user:
```bash
npm run setup-admin
```

6. Start the server:
```bash
npm start
# or for development with auto-reload:
npm run dev
```

The backend will run on `http://localhost:3000`

### 3. Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3001`

### 4. Mobile App Setup

**📱 Detailed mobile setup instructions are in [mobile/MOBILE_SETUP_GUIDE.md](mobile/MOBILE_SETUP_GUIDE.md)**

**Quick setup:**

1. Navigate to the mobile directory:
```bash
cd mobile
```

2. Install dependencies:
```bash
flutter pub get
```

3. Configure API URL in `lib/config/app_config.dart`:
   ```dart
   // For Android emulator:
   static const String apiBaseUrl = 'http://10.0.2.2:3000/api';
   
   // For iOS simulator:
   static const String apiBaseUrl = 'http://localhost:3000/api';
   
   // For physical device (find your IP first):
   static const String apiBaseUrl = 'http://192.168.1.XXX:3000/api';
   ```

4. Run the app:
```bash
flutter run
```

**📚 For detailed setup, troubleshooting, and production builds, see:**
- [mobile/QUICK_START.md](mobile/QUICK_START.md) - Quick start guide
- [mobile/MOBILE_SETUP_GUIDE.md](mobile/MOBILE_SETUP_GUIDE.md) - Complete setup guide

## 🔐 Default Credentials

After running the database schema, a default admin user is created:

- **Username:** `admin`
- **Password:** `admin123` ⚠️ **Change this in production!**

## 📱 Features

### Mobile App (Flutter)
- ✅ User authentication (Login/Register)
- ✅ Real-time GPS location tracking
- ✅ Start/Stop/Pause location sharing
- ✅ Automatic location updates every 30 seconds
- ✅ Background location tracking support

### Web Dashboard (React)
- ✅ Admin authentication
- ✅ Real-time location display on OpenStreetMap
- ✅ Geofencing (create safe zones)
- ✅ Movement history tracking
- ✅ Alert system for geofence entry/exit
- ✅ User management (admin only)

### Backend API
- ✅ RESTful API endpoints
- ✅ JWT authentication
- ✅ Real-time updates via Socket.IO
- ✅ Geofencing detection
- ✅ Email notifications (configurable)
- ✅ Location history storage

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - Logout user

### Locations
- `POST /api/locations` - Submit location data
- `GET /api/locations/current/:userId` - Get current location
- `GET /api/locations/history/:userId` - Get location history
- `GET /api/locations/all` - Get all users' locations (admin)

### Geofences
- `POST /api/geofences` - Create geofence (admin)
- `GET /api/geofences` - Get all geofences
- `GET /api/geofences/:id` - Get specific geofence
- `PUT /api/geofences/:id` - Update geofence (admin)
- `DELETE /api/geofences/:id` - Delete geofence (admin)

### Alerts
- `GET /api/alerts` - Get user alerts
- `GET /api/alerts/all` - Get all alerts (admin)
- `PATCH /api/alerts/:id/read` - Mark alert as read
- `DELETE /api/alerts/:id` - Delete alert

## 🔔 Geofencing

Geofencing allows you to create virtual boundaries. When a tracked user enters or exits a geofence, an alert is automatically generated.

### How it works:
1. Admin creates a geofence on the web dashboard
2. Admin assigns users to the geofence
3. When a user's location crosses the boundary, an alert is created
4. Notifications are sent (email, SMS - configurable)

## 🔒 Security Considerations

- ⚠️ Change default admin password
- ⚠️ Use strong JWT_SECRET in production
- ⚠️ Enable HTTPS in production
- ⚠️ Configure CORS properly for production
- ⚠️ Use environment variables for sensitive data
- ⚠️ Implement rate limiting
- ⚠️ Add input validation and sanitization

## 📝 Development Notes

### Backend
- Uses `mysql2` for database connections with connection pooling
- JWT tokens expire after 7 days
- Location updates are sent every 30 seconds by default
- Socket.IO is used for real-time location updates

### Frontend
- Uses Vite for fast development
- OpenStreetMap with Leaflet for map visualization (no API key required)
- Socket.IO client for real-time updates
- React Router for navigation

### Mobile
- Uses Geolocator package for GPS tracking
- Location updates every 30 seconds or when movement > 10 meters
- Requires location permissions on both Android and iOS

## 🐛 Troubleshooting

### Backend won't start
- Check MySQL is running
- Verify database credentials in `.env`
- Ensure database exists

### Frontend map not loading
- Check browser console for errors
- Verify internet connection (OpenStreetMap tiles require internet)
- Clear browser cache if tiles don't load

### Mobile app can't connect
- Verify backend is running
- Check API base URL matches your setup
- For physical devices, ensure phone and computer are on same network
- Check firewall settings

### Location not updating
- Grant location permissions
- Check GPS is enabled on device
- Verify backend is receiving requests (check server logs)

## 📄 License

This project is for educational purposes.

## 🤝 Contributing

This is a graduation project. Contributions and suggestions are welcome!

## 📧 Support

For issues or questions, please check the troubleshooting section or review the code documentation.

---

**Note:** This application is designed for legitimate tracking purposes (family safety, logistics). Ensure compliance with privacy laws and regulations in your jurisdiction.

