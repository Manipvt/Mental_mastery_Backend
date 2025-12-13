-- Migration: Add missing columns to problems table
-- Run this migration to add constraints, input_format, and output_format columns
-- Also make assignment_id nullable to allow problems without assignments

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add constraints column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'problems' 
                   AND column_name = 'constraints') THEN
        ALTER TABLE problems ADD COLUMN constraints TEXT;
        RAISE NOTICE 'Added constraints column';
    ELSE
        RAISE NOTICE 'constraints column already exists';
    END IF;

    -- Add input_format column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'problems' 
                   AND column_name = 'input_format') THEN
        ALTER TABLE problems ADD COLUMN input_format TEXT;
        RAISE NOTICE 'Added input_format column';
    ELSE
        RAISE NOTICE 'input_format column already exists';
    END IF;

    -- Add output_format column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'problems' 
                   AND column_name = 'output_format') THEN
        ALTER TABLE problems ADD COLUMN output_format TEXT;
        RAISE NOTICE 'Added output_format column';
    ELSE
        RAISE NOTICE 'output_format column already exists';
    END IF;
END $$;

-- Make assignment_id nullable (if not already nullable)
-- Check if column is currently NOT NULL before altering
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'problems' 
        AND column_name = 'assignment_id' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE problems ALTER COLUMN assignment_id DROP NOT NULL;
        RAISE NOTICE 'Made assignment_id nullable';
    ELSE
        RAISE NOTICE 'assignment_id is already nullable';
    END IF;
END $$;

