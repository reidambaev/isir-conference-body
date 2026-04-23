-- Run once on existing D1 databases to store speaker name parts separately.
ALTER TABLE speaker_profile_submissions ADD COLUMN first_name TEXT;
ALTER TABLE speaker_profile_submissions ADD COLUMN middle_name TEXT;
ALTER TABLE speaker_profile_submissions ADD COLUMN last_name TEXT;
