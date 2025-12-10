const { Pool } = require('pg');
const logger = require('./logger');
const CONSTANTS = require('./constants');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Supabase/Heroku
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: CONSTANTS.DB_CONNECTION_TIMEOUT_MS
});

/**
 * Test database connection with retry logic
 * @param {number} retries - Number of retries remaining
 * @returns {Promise<void>}
 */
async function testConnection(retries = CONSTANTS.DB_MAX_RETRIES) {
  let client;
  try {
    client = await pool.connect();
    logger.info('✅ Database connected successfully', {
      host: 'supabase',
      database: 'postgres'
    });
    return true;
  } catch (err) {
    logger.error('❌ Database connection error:', {
      error: err.message,
      retriesLeft: retries - 1
    });

    if (retries > 1) {
      logger.info(`Retrying database connection in ${CONSTANTS.DB_RETRY_DELAY_MS}ms...`);
      await new Promise(resolve => setTimeout(resolve, CONSTANTS.DB_RETRY_DELAY_MS));
      return testConnection(retries - 1);
    }

    throw new Error(`Failed to connect to database after ${CONSTANTS.DB_MAX_RETRIES} attempts: ${err.message}`);
  } finally {
    if (client) client.release();
  }
}

/**
 * Initialize database connection
 * Call this from server.js before starting the server
 */
async function initializeDatabase() {
  await testConnection();
}

/**
 * Wrapper to mimic mysql2 promise execute
 * pg returns { rows, rowCount }
 * mysql2 returns [rows, fields]
 */
pool.execute = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    // logger.debug('Query executed', { text, duration: Date.now() - start, rows: res.rowCount });

    // Normalize return format to match mysql2 [rows, fields] structure for easier migration,
    // OR just return rows and handle it in the code.
    // For this refactor, I will modify the call sites to expect Postgres return format { rows }
    // but to make it easier to grep/replace, I will just return the result object.
    // WAIT: The plan said "Update result destructuring".

    // Actually, to make the refactoring cleaner, let's keep the .execute method as a wrapper 
    // that mimics mysql2 behavior partially OR just return plain pool.query result.
    // IF I maintain [rows] signature it's easier.
    // mysql2: const [rows] = await pool.execute(...)
    // pg: const res = await pool.query(...) -> res.rows

    // Let's make .execute return [res.rows, res] to match [rows, fields] pattern?
    // That saves modifying every single destructuring call!
    return [res.rows, res];
  } catch (error) {
    throw error;
  }
};

module.exports = pool;
module.exports.initializeDatabase = initializeDatabase;

