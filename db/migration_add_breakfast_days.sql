-- Migration: Store weekend breakfast selections (Fri–Sun) separately from legacy dinner_days.
-- Run in Cloudflare D1. New registrations write breakfast_days; dinner_days may remain on older rows.

ALTER TABLE registrations ADD COLUMN breakfast_days TEXT;
