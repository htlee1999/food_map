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
    tags JSONB DEFAULT '[]', -- Store tags as JSON array e.g., ["thai", "spicy"]
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

-- Create comments table to store reviews for each place
CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    place_id INTEGER REFERENCES places(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create votes table for public thumbs up/down
CREATE TABLE IF NOT EXISTS votes (
    id SERIAL PRIMARY KEY,
    place_id INTEGER NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('up', 'down')),
    voter_id VARCHAR(100) NOT NULL,  -- Browser identifier from localStorage
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(place_id, voter_id)  -- One vote per browser per place
);

-- Cuisine types (dynamic configuration)
CREATE TABLE IF NOT EXISTS cuisines (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tags linked to cuisines (dynamic configuration)
CREATE TABLE IF NOT EXISTS cuisine_tags (
    id SERIAL PRIMARY KEY,
    cuisine_id INTEGER REFERENCES cuisines(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cuisine_id, name)
);

-- Tier ratings (dynamic configuration)
CREATE TABLE IF NOT EXISTS tiers (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE,
    description VARCHAR(255) NOT NULL,
    color_class VARCHAR(100),
    color_hex VARCHAR(20),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_places_name ON places(name);
CREATE INDEX IF NOT EXISTS idx_places_cuisine ON places(cuisine_type);
CREATE INDEX IF NOT EXISTS idx_places_tier ON places(tier);
CREATE INDEX IF NOT EXISTS idx_preferences_user ON preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_preferences_place ON preferences(place_id);
CREATE INDEX IF NOT EXISTS idx_comments_place ON comments(place_id);
CREATE INDEX IF NOT EXISTS idx_votes_place ON votes(place_id);

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

DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
