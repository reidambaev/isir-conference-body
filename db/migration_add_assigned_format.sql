-- Committee-assigned presentation format (oral vs poster), separate from author preference
ALTER TABLE abstractions
ADD COLUMN assigned_format TEXT;

ALTER TABLE abstractions
ADD COLUMN format_assigned_at INTEGER;
