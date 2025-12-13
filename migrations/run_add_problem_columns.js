const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../config/config.env') });
const { query } = require('../config/db');

async function runMigration() {
  try {
    console.log('Running migration: Add problem columns...');
    console.log('This will add: constraints, input_format, output_format columns');
    console.log('And make assignment_id nullable\n');
    
    // Read and execute the migration
    const migrationPath = path.join(__dirname, 'add_problem_columns.sql');
    const migration = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the entire migration as one query (it uses DO blocks)
    await query(migration);
    
    console.log('\n✓ Migration completed successfully!');
    console.log('✓ Added columns: constraints, input_format, output_format');
    console.log('✓ Made assignment_id nullable');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Migration failed:', error.message);
    if (error.message.includes('already exists') || error.message.includes('duplicate')) {
      console.log('⚠ Some columns may already exist. This is okay.');
      console.log('✓ Migration completed (some columns were already present)');
      process.exit(0);
    } else {
      console.error('Full error:', error);
      process.exit(1);
    }
  }
}

runMigration();

