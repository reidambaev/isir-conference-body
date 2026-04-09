-- Migration: Add meal attendance fields to registrations table
-- Run this in Cloudflare D1 to support lunch/dinner day selections and gala attendance.

ALTER TABLE registrations ADD COLUMN gala_dinner_attending INTEGER DEFAULT 0;
ALTER TABLE registrations ADD COLUMN lunch_days TEXT;
ALTER TABLE registrations ADD COLUMN dinner_days TEXT;
