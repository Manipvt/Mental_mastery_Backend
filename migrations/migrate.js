require('dotenv').config({ path: '../config/config.env' });
const fs = require('fs');
const path = require('path');
const { query } = require('../config/db');

async function runMigrations() {
  try {
    console.log('Running database migrations...');
    
    // Read and execute schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await query(schema);
    console.log('Schema migration completed');
    
    // Read and execute seed data
    const seedPath = path.join(__dirname, 'seed.sql');
    const seed = fs.readFileSync(seedPath, 'utf8');
    await query(seed);
    console.log('Seed data migration completed');
    
    console.log('All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
