-- Migration: Add currency field to registrations table
-- Run this in Cloudflare D1 to add currency support

ALTER TABLE registrations ADD COLUMN currency TEXT DEFAULT 'USD';
ALTER TABLE registrations ADD COLUMN payment_intent_id TEXT;

-- Update existing records to have USD as default currency
UPDATE registrations SET currency = 'USD' WHERE currency IS NULL;
