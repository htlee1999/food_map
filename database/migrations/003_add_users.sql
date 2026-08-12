-- Migration 003: user accounts for Google sign-in (friend groups feature, phase 1)
-- Note: schema.sql also contains this table; this file documents the change
-- for existing databases. Running `pnpm migrate` applies schema.sql and is enough.

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    google_sub VARCHAR(64) NOT NULL UNIQUE, -- Google's stable account identifier
    email VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
