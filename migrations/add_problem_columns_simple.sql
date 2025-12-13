-- Simple SQL migration to add missing columns to problems table
-- Run this directly in your PostgreSQL client (pgAdmin, psql, etc.)

-- Add constraints column
ALTER TABLE problems ADD COLUMN IF NOT EXISTS constraints TEXT;

-- Add input_format column  
ALTER TABLE problems ADD COLUMN IF NOT EXISTS input_format TEXT;

-- Add output_format column
ALTER TABLE problems ADD COLUMN IF NOT EXISTS output_format TEXT;

-- Make assignment_id nullable
ALTER TABLE problems ALTER COLUMN assignment_id DROP NOT NULL;

