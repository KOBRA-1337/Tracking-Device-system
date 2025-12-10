const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

async function setupAdmin() {
  let connection;

  try {
    // Connect to database
    // Connect to database
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    connection = await pool.connect();

    console.log('✅ Connected to database');

    // Hash password
    const password = 'admin123'; // Default password
    const passwordHash = await bcrypt.hash(password, 10);

    // Check if admin exists
    const res1 = await connection.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      ['admin', 'admin@tracking.com']
    );
    const existing = res1.rows;

    if (existing.length > 0) {
      // Update existing admin
      await connection.query(
        'UPDATE users SET password_hash = $1 WHERE username = $2',
        [passwordHash, 'admin']
      );
      console.log('✅ Admin user password updated');
      console.log('   Username: admin');
      console.log('   Password: admin123');
      console.log('   ⚠️  Please change this password in production!');
    } else {
      // Create new admin
      await connection.query(
        `INSERT INTO users (username, email, password_hash, full_name, role) 
         VALUES ($1, $2, $3, $4, $5)`,
        ['admin', 'admin@tracking.com', passwordHash, 'Administrator', 'admin']
      );
      console.log('✅ Admin user created');
      console.log('   Username: admin');
      console.log('   Password: admin123');
      console.log('   ⚠️  Please change this password in production!');
    }

  } catch (error) {
    console.error('❌ Error setting up admin:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      connection.release();
      await connection.end(); // Or pool.end() if using pool directly
    }
  }
}

setupAdmin();

