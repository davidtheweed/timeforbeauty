-- Add worker column to appointments table
-- Run this in Supabase SQL Editor

-- Add worker column
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS worker TEXT;

-- Add duration column for task duration
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS duration INTEGER;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_worker ON appointments(worker);
CREATE INDEX IF NOT EXISTS idx_appointments_worker_date ON appointments(worker, appointment_date);

-- Update existing appointments to have default worker (radnik1)
UPDATE appointments SET worker = 'radnik1' WHERE worker IS NULL;

