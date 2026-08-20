-- Oral presentation session (N1–N6) plus when the session letter was sent
ALTER TABLE abstractions
ADD COLUMN oral_session TEXT;

ALTER TABLE abstractions
ADD COLUMN oral_session_assigned_at INTEGER;

ALTER TABLE abstractions
ADD COLUMN oral_session_email_sent_at INTEGER;

CREATE INDEX IF NOT EXISTS idx_abstractions_oral_session ON abstractions (oral_session);
