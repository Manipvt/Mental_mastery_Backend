const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../config/config.env') });
const { query } = require('../config/db');

async function runMigration() {
  try {
    console.log('Running migration: Add max_violations column to assignments...\n');
    
    // Read and execute the migration
    const migrationPath = path.join(__dirname, 'add_max_violations_column.sql');
    const migration = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await query(migration);
    
    console.log('✓ Migration completed successfully!');
    console.log('✓ Added max_violations column to assignments table');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Migration failed:', error.message);
    if (error.message.includes('already exists') || error.message.includes('duplicate')) {
      console.log('⚠ Column may already exist. This is okay.');
      console.log('✓ Migration completed (column was already present)');
      process.exit(0);
    } else {
      console.error('Full error:', error);
      process.exit(1);
    }
  }
}

runMigration();

