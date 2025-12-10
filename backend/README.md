# Backend API - Smart People Tracking

Node.js/Express backend server with MySQL database.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`:
```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=people_tracking_db
JWT_SECRET=your_secret_key
```

3. Run database schema:
```bash
mysql -u root -p people_tracking_db < database/schema.sql
```

4. Start server:
```bash
npm start
# or
npm run dev
```

## API Documentation

See main README.md for endpoint documentation.

## Project Structure

```
backend/
├── config/          # Database configuration
├── database/        # SQL schema files
├── middleware/      # Auth middleware
├── routes/          # API route handlers
├── utils/           # Utility functions (geofencing, notifications)
├── server.js        # Main server file
└── package.json     # Dependencies
```

