-- Migration: Opening / Welcome Reception attendance on registrations
-- Run in Cloudflare D1 if the table was created before this column existed.

ALTER TABLE registrations ADD COLUMN opening_reception_attending INTEGER DEFAULT 0;
