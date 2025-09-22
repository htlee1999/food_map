-- Database schema for Singapore Food Tracker
-- This file contains the SQL schema for creating the necessary tables

-- Create places table
CREATE TABLE IF NOT EXISTS places (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    coords JSONB NOT NULL, -- Store latitude and longitude as JSON
    description TEXT,
    cuisine_type VARCHAR(100),
    price_range VARCHAR(20),
    tier VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create preferences table to store user preferences
CREATE TABLE IF NOT EXISTS preferences (
    id SERIAL PRIMARY KEY,
    place_id INTEGER REFERENCES places(id) ON DELETE CASCADE,
    user_id VARCHAR(100) DEFAULT 'default_user', -- For future multi-user support
    visited BOOLEAN DEFAULT FALSE,
    want_to_visit BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(place_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_places_name ON places(name);
CREATE INDEX IF NOT EXISTS idx_places_cuisine ON places(cuisine_type);
CREATE INDEX IF NOT EXISTS idx_places_tier ON places(tier);
CREATE INDEX IF NOT EXISTS idx_preferences_user ON preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_preferences_place ON preferences(place_id);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at (drop first if exists)
DROP TRIGGER IF EXISTS update_places_updated_at ON places;
CREATE TRIGGER update_places_updated_at BEFORE UPDATE ON places
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_preferences_updated_at ON preferences;
CREATE TRIGGER update_preferences_updated_at BEFORE UPDATE ON preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
