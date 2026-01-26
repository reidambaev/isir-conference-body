-- Migration: Add corresponding author fields to abstractions table
-- Run this in Cloudflare D1 to add corresponding author tracking
-- Add corresponding author name column
ALTER TABLE abstractions
ADD COLUMN corresponding_name TEXT;

-- Add corresponding author email column
ALTER TABLE abstractions
ADD COLUMN corresponding_email TEXT;

-- Note: For existing records, you may want to set corresponding_name and corresponding_email
-- to match presenter_name and presenter_email if needed:
-- UPDATE abstractions SET corresponding_name = presenter_name, corresponding_email = presenter_email WHERE corresponding_name IS NULL;