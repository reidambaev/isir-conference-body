-- Shared "not a duplicate" dismissals (pair keys stored with sorted abstract ids)
-- Local:  npx wrangler d1 execute isir-registrations --local --file=./db/migration_add_abstract_duplicate_dismissals.sql
-- Prod:   npx wrangler d1 execute isir-registrations --remote --file=./db/migration_add_abstract_duplicate_dismissals.sql

CREATE TABLE IF NOT EXISTS abstract_duplicate_dismissals (
  abstract_id_a TEXT NOT NULL,
  abstract_id_b TEXT NOT NULL,
  dismissed_at INTEGER NOT NULL,
  PRIMARY KEY (abstract_id_a, abstract_id_b)
);

CREATE INDEX IF NOT EXISTS idx_abstract_duplicate_dismissals_b
  ON abstract_duplicate_dismissals (abstract_id_b);
