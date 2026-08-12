-- Migration 007: created_by on places (friend groups feature, phase 4)
-- NULL = admin/editorial place, shown on the public map.
-- Set = friend-added place, visible only to the creator and their groups.
-- (No FK to users: places should outlive a deleted account, and the users
-- table is created later in schema.sql than places.)
-- Note: schema.sql also contains this change; this file documents it
-- for existing databases. Running `pnpm migrate` applies schema.sql and is enough.

ALTER TABLE places ADD COLUMN IF NOT EXISTS created_by INTEGER;
