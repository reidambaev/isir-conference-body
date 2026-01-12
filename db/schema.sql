-- ISIR Conference Registration Database Schema
-- Run this in Cloudflare D1 to create the tables
-- Registrations table
CREATE TABLE
    IF NOT EXISTS registrations (
        id TEXT PRIMARY KEY,
        registration_date INTEGER NOT NULL,
        -- Personal Information
        email TEXT NOT NULL,
        first_name TEXT NOT NULL,
        middle_name TEXT,
        last_name TEXT NOT NULL,
        salutation TEXT,
        suffix TEXT,
        institution TEXT,
        credentials TEXT,
        badge_name TEXT,
        pronouns TEXT,
        -- Address
        address1 TEXT,
        address2 TEXT,
        city TEXT,
        state TEXT,
        zip TEXT,
        country TEXT,
        -- Contact
        phone TEXT,
        cell_phone TEXT,
        is_physician TEXT,
        -- Ticket Information
        ticket_type TEXT NOT NULL,
        accompanying_count INTEGER DEFAULT 0,
        ticket_price INTEGER NOT NULL,
        total_price INTEGER NOT NULL,
        is_early_bird INTEGER DEFAULT 0,
        -- Dietary Requirements
        dietary_vegan INTEGER DEFAULT 0,
        dietary_vegetarian INTEGER DEFAULT 0,
        dietary_gluten_free INTEGER DEFAULT 0,
        dietary_kosher INTEGER DEFAULT 0,
        dietary_other INTEGER DEFAULT 0,
        special_assistance INTEGER DEFAULT 0,
        -- Agreements
        policy_agreed INTEGER DEFAULT 0,
        privacy_marketing INTEGER DEFAULT 0,
        privacy_app INTEGER DEFAULT 0,
        opt_out_mailing INTEGER DEFAULT 0,
        -- Payment
        payment_status TEXT DEFAULT 'pending',
        payment_id TEXT,
        payment_date INTEGER,
        -- Membership Info (from ISIR verification)
        membership_level TEXT,
        membership_status TEXT,
        -- Timestamps
        created_at INTEGER DEFAULT (strftime ('%s', 'now') * 1000),
        updated_at INTEGER DEFAULT (strftime ('%s', 'now') * 1000)
    );

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_registrations_email ON registrations (email);

CREATE INDEX IF NOT EXISTS idx_registrations_date ON registrations (registration_date);

CREATE INDEX IF NOT EXISTS idx_registrations_payment_status ON registrations (payment_status);

CREATE INDEX IF NOT EXISTS idx_registrations_ticket_type ON registrations (ticket_type);

-- Accompanying Persons table (optional - for detailed accompanying person info)
CREATE TABLE
    IF NOT EXISTS accompanying_persons (
        id TEXT PRIMARY KEY,
        registration_id TEXT NOT NULL,
        name TEXT NOT NULL,
        dietary_requirements TEXT,
        created_at INTEGER DEFAULT (strftime ('%s', 'now') * 1000),
        FOREIGN KEY (registration_id) REFERENCES registrations (id)
    );

CREATE INDEX IF NOT EXISTS idx_accompanying_registration ON accompanying_persons (registration_id);