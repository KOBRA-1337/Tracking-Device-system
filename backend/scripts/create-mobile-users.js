/**
 * Script to create mobile user accounts
 * Run with: node scripts/create-mobile-users.js
 */

const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = require('../config/database');

const MOBILE_USERS = [
    { username: 'kobra', full_name: 'KOBRA', email: 'kobra@mobile.local' },
    { username: 'haider', full_name: 'HAIDER', email: 'haider@mobile.local' },
    { username: 'huda', full_name: 'HUDA', email: 'huda@mobile.local' },
    { username: 'kanar', full_name: 'KANAR', email: 'kanar@mobile.local' },
    { username: 'sarah', full_name: 'SARAH', email: 'sarah@mobile.local' },
];

// Default password for all mobile users (can be changed later)
const DEFAULT_PASSWORD = 'mobile123';

async function createMobileUsers() {
    console.log('Creating mobile user accounts...\n');

    try {
        // Hash the default password
        const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

        for (const user of MOBILE_USERS) {
            try {
                // Check if user already exists
                const [existing] = await pool.execute(
                    'SELECT id FROM users WHERE username = $1 OR email = $2',
                    [user.username, user.email]
                );

                if (existing.length > 0) {
                    console.log(`⚠️  User "${user.full_name}" already exists (ID: ${existing[0].id})`);
                    continue;
                }

                // Insert new user
                const [result] = await pool.execute(
                    `INSERT INTO users (username, email, password_hash, full_name, role, is_active) 
           VALUES ($1, $2, $3, $4, 'user', TRUE) RETURNING id`,
                    [user.username, user.email, passwordHash, user.full_name]
                );

                console.log(`✅ Created user "${user.full_name}" (ID: ${result[0].id})`);
                console.log(`   Username: ${user.username}`);
                console.log(`   Password: ${DEFAULT_PASSWORD}`);
                console.log('');
            } catch (error) {
                console.error(`❌ Failed to create user "${user.full_name}":`, error.message);
            }
        }

        console.log('\n========================================');
        console.log('Mobile User Accounts Summary:');
        console.log('========================================');
        console.log('Default password for all users: ' + DEFAULT_PASSWORD);
        console.log('');
        console.log('Users can log in to the mobile app with:');
        MOBILE_USERS.forEach(user => {
            console.log(`  - Username: ${user.username}, Password: ${DEFAULT_PASSWORD}`);
        });
        console.log('========================================\n');

    } catch (error) {
        console.error('Error creating users:', error);
    } finally {
        process.exit(0);
    }
}

createMobileUsers();
