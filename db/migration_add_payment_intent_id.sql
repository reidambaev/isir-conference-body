-- Migration: Add payment_intent_id for Stripe webhook (registration confirmation)
-- Run this if you get: D1_ERROR: no such column: payment_intent_id

ALTER TABLE registrations ADD COLUMN payment_intent_id TEXT;
