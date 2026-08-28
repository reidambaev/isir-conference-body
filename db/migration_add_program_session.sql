-- Invited speaker program session (S1–S21, PF, President / Population Forums)
-- Local:  npx wrangler d1 execute isir-registrations --local --file=./db/migration_add_program_session.sql
-- Prod:   npx wrangler d1 execute isir-registrations --remote --file=./db/migration_add_program_session.sql
ALTER TABLE abstractions
ADD COLUMN program_session TEXT;

ALTER TABLE abstractions
ADD COLUMN program_session_assigned_at INTEGER;

CREATE INDEX IF NOT EXISTS idx_abstractions_program_session ON abstractions (program_session);
