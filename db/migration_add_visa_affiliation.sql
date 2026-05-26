-- Migration: Affiliation for visa invitation letter requests
-- Run: npx wrangler d1 execute isir-registrations --local --file=./db/migration_add_visa_affiliation.sql

ALTER TABLE visa_requests ADD COLUMN affiliation TEXT;
