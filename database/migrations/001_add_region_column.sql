-- Migration: Add region column to places table
-- Created: 2026-01-27
-- Description: Adds region classification for Singapore places

-- Add region column to places table
ALTER TABLE places ADD COLUMN IF NOT EXISTS region VARCHAR(20);

-- Add index for region column
CREATE INDEX IF NOT EXISTS idx_places_region ON places(region);

-- Comment on column
COMMENT ON COLUMN places.region IS 'Singapore region: Central, East, West, North, North-East';
