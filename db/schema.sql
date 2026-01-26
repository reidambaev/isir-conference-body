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
        department TEXT,
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
        gala_dinner INTEGER DEFAULT 0,
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

-- Visa Requests table
CREATE TABLE
    IF NOT EXISTS visa_requests (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        name TEXT NOT NULL,
        country TEXT NOT NULL,
        notes TEXT,
        status TEXT DEFAULT 'pending',
        created_at INTEGER DEFAULT (strftime ('%s', 'now') * 1000),
        updated_at INTEGER DEFAULT (strftime ('%s', 'now') * 1000)
    );

-- Abstract Submissions table
CREATE TABLE
    IF NOT EXISTS abstractions (
        id TEXT PRIMARY KEY,
        submission_date INTEGER NOT NULL,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        keywords TEXT NOT NULL,
        abstract TEXT NOT NULL,
        word_count INTEGER NOT NULL,
        presentation_preference TEXT NOT NULL,
        presenter_role TEXT,
        presenter_name TEXT NOT NULL,
        presenter_email TEXT NOT NULL,
        corresponding_name TEXT,
        corresponding_email TEXT,
        corresponding_author_id TEXT,
        conflict_of_interest TEXT,
        conflict_details TEXT,
        affiliations TEXT,
        status TEXT DEFAULT 'submitted',
        reviewer_notes TEXT,
        acceptance_status TEXT DEFAULT 'pending',
        created_at INTEGER DEFAULT (strftime ('%s', 'now') * 1000),
        updated_at INTEGER DEFAULT (strftime ('%s', 'now') * 1000)
    );

-- Affiliations table (normalized, linked to abstractions)
CREATE TABLE
    IF NOT EXISTS affiliations (
        id TEXT PRIMARY KEY,
        abstract_id TEXT NOT NULL,
        author_name TEXT NOT NULL,
        department TEXT,
        institution TEXT NOT NULL,
        city TEXT NOT NULL,
        country TEXT NOT NULL,
        position INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime ('%s', 'now') * 1000),
        FOREIGN KEY (abstract_id) REFERENCES abstractions (id)
    );

-- Authors table (normalized, linked to abstractions)
CREATE TABLE
    IF NOT EXISTS authors (
        id TEXT PRIMARY KEY,
        abstract_id TEXT NOT NULL,
        first_name TEXT NOT NULL,
        middle_name TEXT,
        last_name TEXT NOT NULL,
        email TEXT,
        is_presenter INTEGER DEFAULT 0,
        is_corresponding INTEGER DEFAULT 0,
        position INTEGER NOT NULL,
        created_at INTEGER DEFAULT (strftime ('%s', 'now') * 1000),
        FOREIGN KEY (abstract_id) REFERENCES abstractions (id)
    );

CREATE INDEX IF NOT EXISTS idx_affiliations_abstract ON affiliations (abstract_id);

CREATE INDEX IF NOT EXISTS idx_affiliations_institution ON affiliations (institution);

CREATE INDEX IF NOT EXISTS idx_affiliations_country ON affiliations (country);

CREATE INDEX IF NOT EXISTS idx_authors_abstract ON authors (abstract_id);

CREATE INDEX IF NOT EXISTS idx_authors_email ON authors (email);

CREATE INDEX IF NOT EXISTS idx_authors_presenter ON authors (is_presenter);

CREATE INDEX IF NOT EXISTS idx_abstractions_email ON abstractions (presenter_email);

CREATE INDEX IF NOT EXISTS idx_abstractions_status ON abstractions (acceptance_status);

CREATE INDEX IF NOT EXISTS idx_abstractions_category ON abstractions (category);

CREATE INDEX IF NOT EXISTS idx_abstractions_date ON abstractions (submission_date);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_registrations_email ON registrations (email);

CREATE INDEX IF NOT EXISTS idx_registrations_date ON registrations (registration_date);

CREATE INDEX IF NOT EXISTS idx_registrations_payment_status ON registrations (payment_status);

CREATE INDEX IF NOT EXISTS idx_registrations_ticket_type ON registrations (ticket_type);

CREATE INDEX IF NOT EXISTS idx_visa_requests_email ON visa_requests (email);

CREATE INDEX IF NOT EXISTS idx_visa_requests_status ON visa_requests (status);

CREATE INDEX IF NOT EXISTS idx_visa_requests_date ON visa_requests (created_at);