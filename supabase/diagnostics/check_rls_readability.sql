-- ============================================================
-- DIAGNOSTIC: Can authenticated users read the tables that
-- username validation depends on?
-- Run each query separately in the Supabase SQL Editor.
-- ============================================================


-- ── TEST 1: Do the tables exist? ──────────────────────────
-- Expected: Both 'profiles' and 'reserved_usernames' appear.
-- If either is missing, the Supabase client returns a 404-like
-- error that the JS code silently swallows.

SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'reserved_usernames')
ORDER BY table_name;


-- ── TEST 2: Is RLS enabled on both tables? ────────────────
-- Expected: Both rows show relrowsecurity = true.
-- If RLS is enabled but no policy grants access, all SELECTs
-- return empty results (not errors!) — the silent failure mode.

SELECT relname, relrowsecurity
FROM pg_class
WHERE relname IN ('profiles', 'reserved_usernames');


-- ── TEST 3: What policies exist? ──────────────────────────
-- Expected: You should see at minimum:
--   profiles:            profiles_select_authenticated (SELECT, permissive)
--   reserved_usernames:  reserved_select              (SELECT, permissive)
-- If either SELECT policy is missing, the table is unreadable
-- via the client SDK even for logged-in users.

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual         -- this is the USING clause
FROM pg_policies
WHERE tablename IN ('profiles', 'reserved_usernames')
ORDER BY tablename, policyname;


-- ── TEST 4: Simulate an authenticated user reading ────────
-- This switches to the 'authenticated' role (what Supabase
-- uses for logged-in users) and tries to read both tables.
-- Expected: reserved count > 0, profiles count >= 0.
-- If either returns 0 unexpectedly, RLS is blocking.
--
-- NOTE: Run this as a single block. The RESET ROLE at the end
-- is critical — don't skip it or your SQL editor session
-- stays in the restricted role.

BEGIN;
  -- Simulate an authenticated user (any valid UUID works)
  SET LOCAL role = 'authenticated';
  SET LOCAL request.jwt.claims = '{"sub": "00000000-0000-0000-0000-000000000000", "role": "authenticated"}';

  SELECT 'reserved_usernames' AS table_name, count(*) AS row_count
  FROM reserved_usernames
  UNION ALL
  SELECT 'profiles', count(*)
  FROM profiles;
ROLLBACK;
-- ROLLBACK resets the role automatically. Safe even if the
-- queries above fail.


-- ── TEST 5: Check the dietary column type ─────────────────
-- Expected: dietary should show data_type = 'ARRAY', udt_name = '_text'
-- If it shows 'text' (not ARRAY), the schema fix migration
-- hasn't been run yet, and the onboarding final UPDATE will 400.

SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('dietary', 'skill_level', 'goal', 'onboarded_at')
ORDER BY column_name;


-- ── TEST 6: Does the obscenity-relevant query pattern work? ─
-- This mimics exactly what isUsernameAvailable() does:
-- a .eq() lookup on reserved_usernames, then a .eq() on profiles.
-- Run as authenticated to confirm the query shape works.

BEGIN;
  SET LOCAL role = 'authenticated';
  SET LOCAL request.jwt.claims = '{"sub": "00000000-0000-0000-0000-000000000000", "role": "authenticated"}';

  -- This should return NULL (no match), not an error
  SELECT username FROM reserved_usernames WHERE username = 'testuser123' LIMIT 1;

  -- This should return NULL (no match), not an error
  SELECT id FROM profiles WHERE username = 'testuser123' LIMIT 1;
ROLLBACK;
