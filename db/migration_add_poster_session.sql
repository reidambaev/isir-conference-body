-- Poster session (#1 / #2) plus when the poster session letter was sent
ALTER TABLE abstractions
ADD COLUMN poster_session TEXT;

ALTER TABLE abstractions
ADD COLUMN poster_session_assigned_at INTEGER;

ALTER TABLE abstractions
ADD COLUMN poster_session_email_sent_at INTEGER;

CREATE INDEX IF NOT EXISTS idx_abstractions_poster_session ON abstractions (poster_session);
