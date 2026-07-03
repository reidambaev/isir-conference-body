-- Migration: Sponsorship inquiry contact form submissions
-- Run: npx wrangler d1 execute isir-registrations --local --file=./db/migration_add_sponsorship_inquiries.sql
-- Prod: npx wrangler d1 execute isir-registrations --file=./db/migration_add_sponsorship_inquiries.sql

CREATE TABLE IF NOT EXISTS sponsorship_inquiries (
    id TEXT PRIMARY KEY,
    company TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    interest TEXT NOT NULL,
    package_interest TEXT,
    message TEXT,
    status TEXT DEFAULT 'pending',
    created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
    updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
);

CREATE INDEX IF NOT EXISTS idx_sponsorship_inquiries_email ON sponsorship_inquiries (email);
CREATE INDEX IF NOT EXISTS idx_sponsorship_inquiries_status ON sponsorship_inquiries (status);
CREATE INDEX IF NOT EXISTS idx_sponsorship_inquiries_date ON sponsorship_inquiries (created_at);
