-- Migration: Admin-created remaining-balance invoices (post-registration Stripe)
CREATE TABLE
    IF NOT EXISTS registration_balance_invoices (
        id TEXT PRIMARY KEY,
        registration_id TEXT NOT NULL,
        amount_usd REAL NOT NULL,
        reason TEXT,
        payment_status TEXT DEFAULT 'pending',
        payment_intent_id TEXT,
        payment_date INTEGER,
        created_by TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        cancelled_at INTEGER,
        FOREIGN KEY (registration_id) REFERENCES registrations (id)
    );

CREATE INDEX IF NOT EXISTS idx_balance_invoices_registration ON registration_balance_invoices (registration_id);

CREATE INDEX IF NOT EXISTS idx_balance_invoices_payment_intent ON registration_balance_invoices (payment_intent_id);

CREATE INDEX IF NOT EXISTS idx_balance_invoices_status ON registration_balance_invoices (payment_status);
