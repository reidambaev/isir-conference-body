-- Enforce one registration per email.
-- This migration is safe to run on existing DBs that may already have duplicates.
-- Policy: keep the most recent registration per email (by registration_date, then id).

-- 1) Normalize stored emails (lowercase + trim) to prevent case/whitespace duplicates.
UPDATE registrations
SET email = lower(trim(email))
WHERE email IS NOT NULL;

-- 2) Remove duplicates so we can add a unique index.
-- Delete any row that has a "newer" row with the same normalized email.
DELETE FROM registrations AS r1
WHERE r1.email IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM registrations AS r2
    WHERE r2.email IS NOT NULL
      AND lower(trim(r2.email)) = lower(trim(r1.email))
      AND (
        r2.registration_date > r1.registration_date
        OR (r2.registration_date = r1.registration_date AND r2.id > r1.id)
      )
  );

-- 3) Now enforce uniqueness at the DB level.
CREATE UNIQUE INDEX IF NOT EXISTS uq_registrations_email ON registrations (email);

