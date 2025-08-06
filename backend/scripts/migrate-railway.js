#!/usr/bin/env node
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Use public URL for Railway database when running locally
const DATABASE_PUBLIC_URL = 'postgresql://postgres:HaLyDDaDnJsYyCxsbRQsbIeptjEtxmUe@shortline.proxy.rlwy.net:28489/railway';

const pool = new Pool({
  connectionString: DATABASE_PUBLIC_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    console.log('Running database migrations on Railway...');
    
    const schemaSQL = fs.readFileSync(
      path.join(__dirname, '../src/db/schema.sql'),
      'utf8'
    );
    
    await pool.query(schemaSQL);
    
    console.log('Railway migrations completed successfully!');
    
    // Show created tables
    const result = await pool.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename;
    `);
    
    console.log('\nCreated tables:');
    result.rows.forEach(row => console.log(`  - ${row.tablename}`));
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    await pool.end();
    process.exit(1);
  }
}

migrate();