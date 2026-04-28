-- Update user_recipes SELECT policy: allow owner OR public recipes
-- Existing policy name from Supabase dashboard: "users can read own recipes"

DROP POLICY IF EXISTS "users can read own recipes" ON user_recipes;
CREATE POLICY user_recipes_select_own_or_public ON user_recipes
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_public = true);
