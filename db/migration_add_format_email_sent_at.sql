-- Tracks when oral/poster selection notification email was sent
ALTER TABLE abstractions
ADD COLUMN format_email_sent_at INTEGER;
