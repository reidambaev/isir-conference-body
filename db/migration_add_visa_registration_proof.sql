-- Migration: Congress/abstract proof columns for visa requests
-- Run: npx wrangler d1 execute isir-registrations --remote --file=./db/migration_add_visa_registration_proof.sql
-- (Use --local instead of --remote for local D1)

ALTER TABLE visa_requests ADD COLUMN registration_proof_r2_key TEXT;
ALTER TABLE visa_requests ADD COLUMN registration_proof_filename TEXT;
