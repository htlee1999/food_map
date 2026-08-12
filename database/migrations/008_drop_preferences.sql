-- Migration 008: drop the unused preferences table
-- It was scaffolded for "future multi-user support" but never got endpoints
-- or UI; real multi-user support landed as users/ratings/groups instead.

DROP TABLE IF EXISTS preferences;
