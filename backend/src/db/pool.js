const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.on('connect', () => {
  console.log('Database connected');
});

pool.on('error', (err) => {
  console.error('Database connection error:', err);
  process.exit(-1);
});

module.exports = { pool };