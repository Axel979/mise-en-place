-- Soft delete column for profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- Update the SELECT policy: hide soft-deleted profiles from other users
-- Owner can still see their own row (needed for login-time check)
DROP POLICY IF EXISTS profiles_select_authenticated ON profiles;
CREATE POLICY profiles_select_authenticated ON profiles
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL OR id = auth.uid());
