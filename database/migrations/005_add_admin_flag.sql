-- Migration 005: is_admin flag on users (friend groups feature, phase 3)
-- Note: schema.sql also contains this change; this file documents it
-- for existing databases. Running `pnpm migrate` applies schema.sql and is enough.

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
