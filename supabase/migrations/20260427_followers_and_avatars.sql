-- ============================================================
-- mise.en.place — Followers System + Avatar Storage
-- Run BLOCK A first, then BLOCK B separately if needed.
-- ============================================================


-- ████████████████████████████████████████████████████████████
-- BLOCK A: Follows table + friendship migration + user_recipes
-- ████████████████████████████████████████████████████████████

-- 1. Create follows table
CREATE TABLE IF NOT EXISTS follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK(follower_id != following_id)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);

-- 3. RLS on follows
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS follows_select_authenticated ON follows;
CREATE POLICY follows_select_authenticated ON follows
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS follows_insert_own ON follows;
CREATE POLICY follows_insert_own ON follows
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS follows_delete_own ON follows;
CREATE POLICY follows_delete_own ON follows
  FOR DELETE TO authenticated USING (auth.uid() = follower_id);

-- 4. Migrate accepted friendships to follows (both directions)
INSERT INTO follows (follower_id, following_id)
SELECT user_id, friend_id FROM friendships WHERE status = 'accepted'
ON CONFLICT DO NOTHING;

INSERT INTO follows (follower_id, following_id)
SELECT friend_id, user_id FROM friendships WHERE status = 'accepted'
ON CONFLICT DO NOTHING;

-- 7. Add is_public column to user_recipes
ALTER TABLE user_recipes ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT true;


-- ████████████████████████████████████████████████████████████
-- BLOCK B: Avatars storage bucket + policies
-- ████████████████████████████████████████████████████████████

-- 5. Create avatars bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 6. Storage policies (drop-if-exists then create)
DO $$ BEGIN
  DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
  CREATE POLICY "avatars_public_read"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');
EXCEPTION WHEN others THEN
  RAISE NOTICE 'avatars_public_read policy: %', SQLERRM;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "avatars_insert_own" ON storage.objects;
  CREATE POLICY "avatars_insert_own"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
      bucket_id = 'avatars'
      AND split_part(name, '/', 1) = auth.uid()::text
    );
EXCEPTION WHEN others THEN
  RAISE NOTICE 'avatars_insert_own policy: %', SQLERRM;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "avatars_update_own" ON storage.objects;
  CREATE POLICY "avatars_update_own"
    ON storage.objects FOR UPDATE TO authenticated
    USING (
      bucket_id = 'avatars'
      AND split_part(name, '/', 1) = auth.uid()::text
    );
EXCEPTION WHEN others THEN
  RAISE NOTICE 'avatars_update_own policy: %', SQLERRM;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "avatars_delete_own" ON storage.objects;
  CREATE POLICY "avatars_delete_own"
    ON storage.objects FOR DELETE TO authenticated
    USING (
      bucket_id = 'avatars'
      AND split_part(name, '/', 1) = auth.uid()::text
    );
EXCEPTION WHEN others THEN
  RAISE NOTICE 'avatars_delete_own policy: %', SQLERRM;
END $$;


-- ============================================================
-- VERIFY:
--   SELECT table_name FROM information_schema.tables
--     WHERE table_schema = 'public' AND table_name = 'follows';
--   SELECT policyname, cmd FROM pg_policies WHERE tablename = 'follows';
--   SELECT id, name, public FROM storage.buckets WHERE id = 'avatars';
-- ============================================================
