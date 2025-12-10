# MySQL Setup Guide

This guide will help you set up MySQL for the Smart People Tracking Application.

## Prerequisites

- MySQL Server installed (MySQL 8.0 or higher)
- MySQL root access (or a user with database creation privileges)
- Command line access to MySQL

## Step-by-Step Setup

### Step 1: Check MySQL Installation

First, verify that MySQL is installed and running:

**Windows:**
```bash
mysql --version
```

**Linux/Mac:**
```bash
mysql --version
# or
mysqladmin --version
```

If MySQL is not installed, download it from: https://dev.mysql.com/downloads/mysql/

### Step 2: Start MySQL Service

Make sure MySQL service is running:

**Windows:**
- Open Services (Win + R, type `services.msc`)
- Find "MySQL" service
- Right-click and select "Start" if not running

**Linux:**
```bash
sudo systemctl start mysql
# or
sudo service mysql start
```

**Mac:**
```bash
brew services start mysql
# or use MySQL preference pane
```

### Step 3: Access MySQL

Open MySQL command line:

```bash
mysql -u root -p
```

Enter your MySQL root password when prompted.

### Step 4: Create Database

In the MySQL command line, run:

```sql
CREATE DATABASE IF NOT EXISTS people_tracking_db;
```

Verify the database was created:

```sql
SHOW DATABASES;
```

You should see `people_tracking_db` in the list.

Exit MySQL:
```sql
EXIT;
```

### Step 5: Run Database Schema

From your project root directory, run:

**Windows (Command Prompt):**
```bash
mysql -u root -p people_tracking_db < backend\database\schema.sql
```

**Windows (PowerShell):**
```bash
Get-Content backend\database\schema.sql | mysql -u root -p people_tracking_db
```

**Linux/Mac:**
```bash
mysql -u root -p people_tracking_db < backend/database/schema.sql
```

Enter your MySQL password when prompted.

This will create all the required tables:
- `users` - User accounts
- `locations` - GPS location data
- `geofences` - Safe zone boundaries
- `user_geofences` - User-geofence relationships
- `alerts` - Notification alerts
- `sessions` - User sessions

### Step 6: Verify Tables

Verify that tables were created:

```bash
mysql -u root -p people_tracking_db -e "SHOW TABLES;"
```

You should see all 6 tables listed.

### Step 7: Configure Backend

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create `.env` file (copy from example):
```bash
# Windows
copy .env.example .env

# Linux/Mac
cp .env.example .env
```

3. Edit `.env` file with your MySQL credentials:
```env
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=people_tracking_db

# JWT Secret (change this to a random string)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Email Configuration (optional, for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

**Important:** Replace `your_mysql_password_here` with your actual MySQL root password!

### Step 8: Install Backend Dependencies

```bash
npm install
```

### Step 9: Create Admin User

Run the admin setup script:

```bash
npm run setup-admin
```

This will create an admin user with:
- **Username:** `admin`
- **Password:** `admin123`
- **Email:** `admin@tracking.com`

⚠️ **Important:** Change this password in production!

### Step 10: Test Database Connection

Start the backend server:

```bash
npm start
```

If everything is set up correctly, you should see:
```
✅ Database connected successfully
🚀 Server running on port 3000
```

## Troubleshooting

### Error: "Access denied for user 'root'@'localhost'"

**Solution:**
1. Check your MySQL password
2. Try resetting MySQL root password
3. Or create a new MySQL user with proper permissions:

```sql
CREATE USER 'tracking_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON people_tracking_db.* TO 'tracking_user'@'localhost';
FLUSH PRIVILEGES;
```

Then update `.env`:
```env
DB_USER=tracking_user
DB_PASSWORD=your_password
```

### Error: "Cannot connect to MySQL server"

**Solution:**
1. Check if MySQL service is running
2. Verify MySQL is listening on port 3306 (default)
3. Check firewall settings
4. Verify `DB_HOST` in `.env` is correct

### Error: "Database 'people_tracking_db' doesn't exist"

**Solution:**
1. Create the database manually:
```sql
CREATE DATABASE people_tracking_db;
```
2. Then run the schema file again

### Error: "Table already exists"

**Solution:**
This is normal if you've run the schema before. The schema uses `CREATE TABLE IF NOT EXISTS`, so it won't cause issues.

If you want to start fresh:
```sql
DROP DATABASE people_tracking_db;
CREATE DATABASE people_tracking_db;
```
Then run the schema file again.

### Error: "Unknown database 'people_tracking_db'"

**Solution:**
Make sure you created the database first (Step 4) before running the schema.

## Quick Setup Script (Alternative)

If you prefer, you can run all SQL commands at once:

```bash
mysql -u root -p << EOF
CREATE DATABASE IF NOT EXISTS people_tracking_db;
USE people_tracking_db;
SOURCE backend/database/schema.sql;
EOF
```

## Verification Checklist

- [ ] MySQL is installed and running
- [ ] Database `people_tracking_db` exists
- [ ] All 6 tables are created
- [ ] `.env` file is configured with correct credentials
- [ ] Backend dependencies are installed
- [ ] Admin user is created
- [ ] Backend server starts without errors

## Next Steps

Once MySQL is set up:
1. Start the backend server: `npm start`
2. Start the frontend: `cd frontend && npm install && npm run dev`
3. Start the mobile app: `cd mobile && flutter pub get && flutter run`

## Need Help?

If you're still having issues:
1. Check MySQL error logs
2. Verify your MySQL version (should be 8.0+)
3. Check that all ports are available (MySQL: 3306, Backend: 3000)
4. Review the backend server logs for specific error messages

