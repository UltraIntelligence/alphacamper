-- Alphacamper v1.2 — Add phone column for SMS notifications
-- Run this in Supabase SQL Editor

ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
