-- Migration: Track post-registration accompanying person add-on purchases
CREATE TABLE
    IF NOT EXISTS accompanying_purchases (
        id TEXT PRIMARY KEY,
        registration_id TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price INTEGER NOT NULL,
        total_price INTEGER NOT NULL,
        is_early_bird INTEGER DEFAULT 0,
        payment_status TEXT DEFAULT 'pending',
        payment_intent_id TEXT,
        payment_date INTEGER,
        guest_names TEXT,
        created_at INTEGER DEFAULT (strftime ('%s', 'now') * 1000),
        updated_at INTEGER DEFAULT (strftime ('%s', 'now') * 1000),
        FOREIGN KEY (registration_id) REFERENCES registrations (id)
    );

CREATE INDEX IF NOT EXISTS idx_accompanying_purchases_registration ON accompanying_purchases (registration_id);

CREATE INDEX IF NOT EXISTS idx_accompanying_purchases_payment_intent ON accompanying_purchases (payment_intent_id);
