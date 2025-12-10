# Quick Start Guide

Get the Smart People Tracking Application up and running in minutes!

## Prerequisites Check

- [ ] Node.js installed (v16+)
- [ ] MySQL installed and running
- [ ] Flutter SDK installed (for mobile app)
- [ ] No API keys needed (uses free OpenStreetMap)

## 5-Minute Setup

### Step 1: Database (2 minutes)

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE people_tracking_db;"

# Run schema
mysql -u root -p people_tracking_db < backend/database/schema.sql
```

### Step 2: Backend (2 minutes)

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run setup-admin
npm start
```

### Step 3: Frontend (1 minute)

```bash
cd frontend
npm install
npm run dev
```

### Step 4: Mobile App (Optional)

```bash
cd mobile
flutter pub get
# Update API base URL in lib/services/*.dart
flutter run
```

## Test It Out

1. **Web Dashboard:** Open http://localhost:3001
   - Login with: `admin` / `admin123`

2. **Mobile App:** Run on device/emulator
   - Register a new user or login
   - Start tracking your location

3. **View on Dashboard:** 
   - See real-time location on map
   - Create geofences
   - View location history

## Common Issues

**Backend won't start?**
- Check MySQL is running: `mysql -u root -p`
- Verify `.env` file exists and has correct DB credentials

**Map not loading?**
- Check internet connection (OpenStreetMap requires internet)
- Clear browser cache
- Check browser console for errors

**Mobile can't connect?**
- For Android emulator: Use `http://10.0.2.2:3000/api`
- For physical device: Use your computer's IP address
- Ensure backend is running and accessible

## Next Steps

- Change default admin password
- Configure email notifications
- Set up production environment
- Review security settings

For detailed documentation, see [README.md](README.md)

