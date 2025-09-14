const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // needed for Supabase
});

// 🧩 Test DB connection on startup
(async () => {
  try {
    await pool.query('SELECT NOW()');
    console.log('connection successful');
  } catch (err) {
    console.error('connection failed:', err.message);
  }
})();

module.exports = pool;
