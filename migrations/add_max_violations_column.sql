-- Add max_violations column to assignments table
ALTER TABLE assignments 
ADD COLUMN IF NOT EXISTS max_violations INTEGER DEFAULT 5;

