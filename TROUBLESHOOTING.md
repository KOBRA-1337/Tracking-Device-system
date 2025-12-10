# Troubleshooting Guide

## React Dashboard Shows Blank Page

### Issue: Blank white page when accessing dashboard

**Solution:**
1. **Check browser console (F12)** - Look for JavaScript errors
2. **Verify backend is running:**
   ```bash
   # In backend folder
   npm start
   ```
3. **Test backend API:**
   - Open: `http://localhost:3000/api/health`
   - Should see: `{"status":"OK","message":"Server is running"}`
4. **Clear browser cache:**
   - Press `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
5. **Check if dependencies are installed:**
   ```bash
   cd frontend
   npm install
   ```

---

## 500 Error on /api/alerts

### Issue: Console shows repeated 500 errors for alerts endpoint

**Possible Causes:**
1. **Database table doesn't exist** - Alerts table not created
2. **Database connection issue**
3. **User not authenticated properly**

**Solutions:**

1. **Verify database schema was run:**
   ```bash
   # Make sure you ran the schema
   mysql -u root -p people_tracking_db < backend/database/schema.sql
   ```

2. **Check if alerts table exists:**
   ```sql
   mysql -u root -p people_tracking_db
   USE people_tracking_db;
   SHOW TABLES;
   ```
   Should see `alerts` in the list.

3. **Check backend console** - Look for the actual error message
   - The error will show what's wrong (table missing, connection issue, etc.)

4. **The app will still work** - Alerts just won't load if there's an issue
   - This is now handled gracefully - the app won't crash

---

## Backend Not Starting

### Issue: Backend server won't start

**Check:**
1. **MySQL is running:**
   ```bash
   # Windows
   # Check Services for MySQL
   
   # Linux/Mac
   sudo systemctl status mysql
   ```

2. **Database credentials in .env:**
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=people_tracking_db
   ```

3. **Database exists:**
   ```sql
   SHOW DATABASES;
   ```
   Should see `people_tracking_db`

4. **Dependencies installed:**
   ```bash
   cd backend
   npm install
   ```

---

## Mobile App Can't Connect

### Issue: Mobile app shows "Unable to connect to server"

**Solutions:**
1. **Check backend is running** on your computer
2. **Verify API URL** in `mobile/lib/config/app_config.dart`
3. **For physical device:**
   - Find your computer's IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
   - Update API URL: `http://YOUR_IP:3000/api`
   - Ensure phone and computer are on same Wi-Fi
4. **Check firewall** - Allow port 3000

---

## Map Not Loading

### Issue: Map shows blank or doesn't load

**Solutions:**
1. **Check internet connection** - OpenStreetMap requires internet
2. **Check browser console** for errors
3. **Clear browser cache**
4. **Verify Leaflet CSS is loading** - Check Network tab in DevTools

---

## Login Not Working

### Issue: Can't login to dashboard

**Solutions:**
1. **Check backend is running**
2. **Verify admin user exists:**
   ```bash
   cd backend
   npm run setup-admin
   ```
3. **Default credentials:**
   - Username: `admin`
   - Password: `admin123`
4. **Check backend console** for login errors

---

## Common Error Messages

### "ER_NO_SUCH_TABLE"
- **Cause:** Database table doesn't exist
- **Solution:** Run database schema: `mysql -u root -p people_tracking_db < backend/database/schema.sql`

### "Access denied for user"
- **Cause:** Wrong MySQL credentials
- **Solution:** Check `.env` file in backend folder

### "Cannot connect to MySQL server"
- **Cause:** MySQL service not running
- **Solution:** Start MySQL service

### "Port 3000 already in use"
- **Cause:** Another process using port 3000
- **Solution:** 
  - Kill the process: `npx kill-port 3000`
  - Or change port in `.env`: `PORT=3001`

---

## Still Having Issues?

1. **Check all services are running:**
   - MySQL ✓
   - Backend (port 3000) ✓
   - Frontend (port 3001) ✓

2. **Check browser console (F12)** for errors

3. **Check backend console** for server errors

4. **Verify database:**
   ```sql
   mysql -u root -p people_tracking_db
   SHOW TABLES;
   SELECT * FROM users;
   ```

5. **Restart everything:**
   ```bash
   # Stop all services (Ctrl+C)
   # Then restart:
   # Terminal 1: Backend
   cd backend && npm start
   
   # Terminal 2: Frontend  
   cd frontend && npm run dev
   ```

