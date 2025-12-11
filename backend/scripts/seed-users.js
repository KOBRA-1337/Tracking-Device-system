const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

const users = [
    { username: 'Abbas', email: 'abbas@tracking.com' },
    { username: 'Haider', email: 'haider@tracking.com' },
    { username: 'Kanar', email: 'kanar@tracking.com' },
    { username: 'Sarah', email: 'sarah@tracking.com' },
    { username: 'Huda', email: 'huda@tracking.com' },
    { username: 'Test', email: 'test@tracking.com' },
];

async function seedUsers() {
    let pool;
    let connection;

    try {
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });
        connection = await pool.connect();
        console.log('✅ Connected to database');

        for (const user of users) {
            const password = `${user.username.toLowerCase()}123`;
            const passwordHash = await bcrypt.hash(password, 10);

            const res = await connection.query(
                'SELECT id FROM users WHERE username = $1',
                [user.username]
            );

            if (res.rows.length > 0) {
                await connection.query(
                    'UPDATE users SET password_hash = $1 WHERE username = $2',
                    [passwordHash, user.username]
                );
                console.log(`Updated user: ${user.username} (Password: ${password})`);
            } else {
                await connection.query(
                    `INSERT INTO users (username, email, password_hash, full_name, role) 
           VALUES ($1, $2, $3, $4, $5)`,
                    [user.username, user.email, passwordHash, user.username, 'user']
                );
                console.log(`Created user: ${user.username} (Password: ${password})`);
            }
        }

    } catch (error) {
        console.error('❌ Error seeding users:', error.message);
    } finally {
        if (connection) {
            connection.release();
            await pool.end();
        }
    }
}

seedUsers();
