-- ============================================================
-- mise.en.place — Onboarding Migration
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. Enable citext for case-insensitive usernames
CREATE EXTENSION IF NOT EXISTS citext;

-- 2. Create profiles table (drop-safe: skip if exists)
-- NOTE: If profiles already exists from earlier work, run the
-- ALTER TABLE block at the bottom instead of CREATE TABLE.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    CREATE TABLE profiles (
      id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      username    citext UNIQUE NOT NULL,
      goal        text CHECK (goal IN ('daily', '5x_week', '3x_week', 'weekends', 'flexible')),
      dietary     text[] DEFAULT '{}',
      skill_level text CHECK (skill_level IN ('just_starting', 'few_dishes', 'comfortable', 'cook_most_days')),
      onboarded_at timestamptz,
      xp          int DEFAULT 0,
      level       int DEFAULT 1,
      avatar_url  text,
      earned_badges    text[] DEFAULT '{}',
      challenge_progress jsonb DEFAULT '{}',
      cooked_dates     text[] DEFAULT '{}',
      saved_posts      text[] DEFAULT '{}',
      goal_id          text DEFAULT '3x',
      created_at  timestamptz DEFAULT now() NOT NULL,
      updated_at  timestamptz DEFAULT now() NOT NULL
    );
  END IF;
END $$;

-- If profiles already exists, add the new onboarding columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS goal text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dietary text[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS skill_level text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarded_at timestamptz;

-- Add check constraints (safe: drop first if they exist)
DO $$ BEGIN
  ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_goal_check;
  ALTER TABLE profiles ADD CONSTRAINT profiles_goal_check
    CHECK (goal IS NULL OR goal IN ('daily', '5x_week', '3x_week', 'weekends', 'flexible'));
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_skill_level_check;
  ALTER TABLE profiles ADD CONSTRAINT profiles_skill_level_check
    CHECK (skill_level IS NULL OR skill_level IN ('just_starting', 'few_dishes', 'comfortable', 'cook_most_days'));
EXCEPTION WHEN others THEN NULL;
END $$;

-- Make username citext + unique if not already
-- (If username column already exists as text, this converts it)
DO $$ BEGIN
  ALTER TABLE profiles ALTER COLUMN username TYPE citext USING username::citext;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE profiles ADD CONSTRAINT profiles_username_unique UNIQUE (username);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. Index on username for fast availability checks
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles (username);

-- 4. Reserved usernames table
CREATE TABLE IF NOT EXISTS reserved_usernames (
  username citext PRIMARY KEY
);

-- Seed reserved usernames (idempotent: ON CONFLICT DO NOTHING)
INSERT INTO reserved_usernames (username) VALUES
  ('admin'),('administrator'),('support'),('help'),('api'),
  ('mise'),('miseenplace'),('mise_en_place'),('root'),('system'),
  ('staff'),('team'),('moderator'),('mod'),('official'),
  ('hello'),('contact'),('info'),('about'),('privacy'),
  ('terms'),('login'),('signup'),('signin'),('register'),
  ('auth'),('user'),('users'),('profile'),('profiles'),
  ('settings'),('account'),('null'),('undefined'),('test'),('delete')
ON CONFLICT DO NOTHING;

-- 5. Username validation trigger
CREATE OR REPLACE FUNCTION validate_username()
RETURNS TRIGGER AS $$
BEGIN
  -- Length check
  IF length(NEW.username::text) < 3 THEN
    RAISE EXCEPTION 'Username must be at least 3 characters';
  END IF;
  IF length(NEW.username::text) > 20 THEN
    RAISE EXCEPTION 'Username must be 20 characters or less';
  END IF;

  -- Regex: starts with letter, then alphanumeric + underscore + period
  IF NEW.username::text !~ '^[a-zA-Z][a-zA-Z0-9._]{2,19}$' THEN
    RAISE EXCEPTION 'Username must start with a letter and can only contain letters, numbers, dots and underscores';
  END IF;

  -- Reserved check
  IF EXISTS (SELECT 1 FROM reserved_usernames WHERE username = NEW.username) THEN
    RAISE EXCEPTION 'That username is not available';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger (drop first to make idempotent)
DROP TRIGGER IF EXISTS trg_validate_username ON profiles;
CREATE TRIGGER trg_validate_username
  BEFORE INSERT OR UPDATE OF username ON profiles
  FOR EACH ROW EXECUTE FUNCTION validate_username();

-- 6. Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_updated_at ON profiles;
CREATE TRIGGER trg_update_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 7. RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_select_authenticated ON profiles;
CREATE POLICY profiles_select_authenticated ON profiles
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS profiles_insert_own ON profiles;
CREATE POLICY profiles_insert_own ON profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS profiles_update_own ON profiles;
CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS profiles_delete_own ON profiles;
CREATE POLICY profiles_delete_own ON profiles
  FOR DELETE TO authenticated USING (auth.uid() = id);

-- 8. RLS on reserved_usernames (read-only for authenticated)
ALTER TABLE reserved_usernames ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS reserved_select ON reserved_usernames;
CREATE POLICY reserved_select ON reserved_usernames
  FOR SELECT TO authenticated USING (true);

-- ============================================================
-- DONE. Verify with:
--   SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_name = 'profiles' ORDER BY ordinal_position;
-- ============================================================
