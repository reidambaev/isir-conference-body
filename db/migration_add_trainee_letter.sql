-- Migration: Add trainee letter support to registrations table
-- Run this in Cloudflare D1 to add the trainee letter column
-- Add trainee_letter_url column to store the R2 file path
ALTER TABLE registrations ADD COLUMN trainee_letter_url TEXT;

-- Add trainee_letter_status for admin review workflow
ALTER TABLE registrations ADD COLUMN trainee_letter_status TEXT DEFAULT 'pending';

-- Values: 'pending', 'approved', 'rejected', 'not_required'
-- Add trainee_letter_uploaded_at timestamp
ALTER TABLE registrations ADD COLUMN trainee_letter_uploaded_at INTEGER;

-- Create index for filtering by trainee letter status
CREATE INDEX IF NOT EXISTS idx_registrations_trainee_letter_status ON registrations (trainee_letter_status);