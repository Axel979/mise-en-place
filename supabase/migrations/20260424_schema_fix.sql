-- ============================================================
-- mise.en.place — Schema Fix: dietary column type + test data wipe
-- Run this in the Supabase SQL Editor
-- ============================================================

-- ┌──────────────────────────────────────────────────────────┐
-- │  VERIFICATION QUERY — Run this first to see what will    │
-- │  be affected before executing the rest:                  │
-- │                                                          │
-- │  SELECT 'profiles' AS table_name, count(*) FROM profiles │
-- │  UNION ALL SELECT 'activity_feed', count(*) FROM activity_feed │
-- │  UNION ALL SELECT 'completed_recipes', count(*) FROM completed_recipes │
-- │  UNION ALL SELECT 'user_recipes', count(*) FROM user_recipes │
-- │  UNION ALL SELECT 'friendships', count(*) FROM friendships; │
-- └──────────────────────────────────────────────────────────┘

-- ============================================================
-- ██  DESTRUCTIVE OPERATIONS — ALL TEST DATA WILL BE DELETED  ██
-- ============================================================
-- Tables deleted (order matters due to foreign keys):
--   1. activity_feed    (references profiles.id via user_id)
--   2. completed_recipes (references profiles.id via user_id)
--   3. user_recipes      (references profiles.id via user_id)
--   4. friendships       (references profiles.id via user_id + friend_id)
--   5. profiles          (references auth.users.id)
-- ============================================================

DELETE FROM activity_feed;
DELETE FROM completed_recipes;
DELETE FROM user_recipes;
DELETE FROM friendships;
DELETE FROM profiles;

-- ============================================================
-- SCHEMA FIX: Drop old columns with wrong types, recreate them
-- ============================================================

-- Drop the old columns (constraint is dropped automatically with the column)
ALTER TABLE profiles DROP COLUMN IF EXISTS dietary;
ALTER TABLE profiles DROP COLUMN IF EXISTS skill_level;

-- Recreate with correct types
ALTER TABLE profiles ADD COLUMN dietary text[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN skill_level text;

-- Re-add check constraint on skill_level
ALTER TABLE profiles ADD CONSTRAINT profiles_skill_level_check
  CHECK (skill_level IS NULL OR skill_level IN ('just_starting', 'few_dishes', 'comfortable', 'cook_most_days'));

-- ============================================================
-- VERIFICATION — Run after migration to confirm column types
-- ============================================================
-- SELECT column_name, data_type, udt_name
-- FROM information_schema.columns
-- WHERE table_name = 'profiles'
-- ORDER BY ordinal_position;
