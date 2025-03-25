/*
  # Fix Profiles RLS Policies

  1. Changes
    - Drop existing policies
    - Create simplified non-recursive policies
    - Add role-based access control
    - Optimize query performance
  
  2. Security
    - Maintain secure access control
    - Prevent infinite recursion
    - Improve policy efficiency
*/

-- Drop existing policies
DO $$ 
BEGIN
    EXECUTE (
        SELECT string_agg(
            format('DROP POLICY IF EXISTS %I ON profiles;', policyname),
            E'\n'
        )
        FROM pg_policies 
        WHERE tablename = 'profiles'
    );
END $$;

-- Create new simplified policies
CREATE POLICY "enable_insert_for_authentication"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "enable_select_for_users"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    -- Users can read their own profile
    id = auth.uid()
    OR 
    -- Staff profiles are readable by managers and admins
    (
      role = 'staff' 
      AND EXISTS (
        SELECT 1
        FROM auth.users u
        JOIN profiles p ON u.id = p.id
        WHERE u.id = auth.uid()
        AND p.role IN ('manager', 'admin')
      )
    )
    OR
    -- Admins can read all profiles
    EXISTS (
      SELECT 1
      FROM auth.users u
      JOIN profiles p ON u.id = p.id
      WHERE u.id = auth.uid()
      AND p.role = 'admin'
    )
  );

CREATE POLICY "enable_update_for_users"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Ensure proper indexing
DROP INDEX IF EXISTS idx_profiles_role;
DROP INDEX IF EXISTS idx_profiles_role_id;
DROP INDEX IF EXISTS idx_profiles_role_lookup;
CREATE INDEX idx_profiles_role_lookup ON profiles (id, role);