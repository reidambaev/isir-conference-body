-- Add stored congress days for Korean local day-pass registrations (JSON array of Fri/Sat/Sun keys).
ALTER TABLE registrations ADD COLUMN day_pass_days TEXT;
