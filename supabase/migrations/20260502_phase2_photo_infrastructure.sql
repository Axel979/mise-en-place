-- ============================================================
-- Phase 2: Photo Upload Infrastructure
-- ============================================================
--
-- PURPOSE:
--   Add RLS policies and database columns needed for the
--   unified PhotoUpload component (avatars, cook photos,
--   recipe photos, future post photos).
--
-- BUCKET CREATION:
--   The 'photos' bucket itself must be created via Supabase
--   Dashboard → Storage → New bucket. Settings:
--     - Public: ON
--     - File size limit: 10MB
--     - Allowed MIME types: image/jpeg, image/png, image/webp,
--       image/heic, image/heif
--   Supabase blocks raw INSERT INTO storage.buckets for newer
--   projects. This migration handles RLS policies and column
--   additions only.
--
-- ADDS:
--   - 4 RLS policies on storage.objects for `photos` bucket
--   - photo_url, photo_width, photo_height, photo_dominant_color
--     columns on user_recipes
--   - photo_width, photo_height, photo_dominant_color columns
--     on completed_recipes (photo_url already exists)
--   - avatar_color column on profiles
--
-- DOES NOT TOUCH:
--   - Existing `avatars` bucket and its 4 RLS policies
--   - Existing columns on any table
--   - activity_feed table (being replaced in Phase 3)
--   - No `posts` table (Phase 3)
--
-- ROLLBACK (if needed):
--   DROP POLICY IF EXISTS "photos_public_read" ON storage.objects;
--   DROP POLICY IF EXISTS "photos_insert_own" ON storage.objects;
--   DROP POLICY IF EXISTS "photos_update_own" ON storage.objects;
--   DROP POLICY IF EXISTS "photos_delete_own" ON storage.objects;
--   ALTER TABLE user_recipes DROP COLUMN IF EXISTS photo_url,
--     DROP COLUMN IF EXISTS photo_width,
--     DROP COLUMN IF EXISTS photo_height,
--     DROP COLUMN IF EXISTS photo_dominant_color;
--   ALTER TABLE completed_recipes DROP COLUMN IF EXISTS photo_width,
--     DROP COLUMN IF EXISTS photo_height,
--     DROP COLUMN IF EXISTS photo_dominant_color;
--   ALTER TABLE profiles DROP COLUMN IF EXISTS avatar_color;
-- ============================================================


-- ── 1. RLS policies on storage.objects for photos bucket ────
-- Path convention: {type}/{uid}/{uuid}.{ext}
-- where {type} IN ('cooks', 'recipes', 'posts')

-- Public read access
DROP POLICY IF EXISTS "photos_public_read" ON storage.objects;
CREATE POLICY "photos_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'photos');

-- Authenticated users can upload to their own folder under a valid type
DROP POLICY IF EXISTS "photos_insert_own" ON storage.objects;
CREATE POLICY "photos_insert_own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'photos'
    AND split_part(name, '/', 1) IN ('cooks', 'recipes', 'posts')
    AND split_part(name, '/', 2) = auth.uid()::text
  );

-- Authenticated users can update their own files (with type whitelist)
DROP POLICY IF EXISTS "photos_update_own" ON storage.objects;
CREATE POLICY "photos_update_own"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'photos'
    AND split_part(name, '/', 2) = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'photos'
    AND split_part(name, '/', 1) IN ('cooks', 'recipes', 'posts')
    AND split_part(name, '/', 2) = auth.uid()::text
  );

-- Authenticated users can delete their own files
DROP POLICY IF EXISTS "photos_delete_own" ON storage.objects;
CREATE POLICY "photos_delete_own"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'photos'
    AND split_part(name, '/', 2) = auth.uid()::text
  );


-- ── 2. Add photo columns to user_recipes ────────────────────
ALTER TABLE user_recipes
  ADD COLUMN IF NOT EXISTS photo_url text,
  ADD COLUMN IF NOT EXISTS photo_width int,
  ADD COLUMN IF NOT EXISTS photo_height int,
  ADD COLUMN IF NOT EXISTS photo_dominant_color text;


-- ── 3. Add photo metadata columns to completed_recipes ──────
-- photo_url already exists on this table
ALTER TABLE completed_recipes
  ADD COLUMN IF NOT EXISTS photo_width int,
  ADD COLUMN IF NOT EXISTS photo_height int,
  ADD COLUMN IF NOT EXISTS photo_dominant_color text;


-- ── 4. Add avatar_color to profiles ─────────────────────────
-- Nullable hex string (e.g. '#FF6B3D'). Null = use username-hash auto-pick.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS avatar_color text;
