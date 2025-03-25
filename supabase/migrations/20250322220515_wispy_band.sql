/*
  # Add Registration Codes and Relationships

  1. New Columns
    - Add registration_code to agencies and care_homes
    - Add unique constraint on registration codes
  
  2. New Tables
    - care_home_managers junction table for manager-care home relationships
  
  3. Security
    - Enable RLS on new table
    - Add appropriate policies
*/

-- Add registration codes
ALTER TABLE agencies
ADD COLUMN registration_code text UNIQUE;

ALTER TABLE care_homes
ADD COLUMN registration_code text UNIQUE;

-- Create care home managers table
CREATE TABLE IF NOT EXISTS care_home_managers (
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  care_home_id uuid REFERENCES care_homes(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (profile_id, care_home_id)
);

-- Enable RLS
ALTER TABLE care_home_managers ENABLE ROW LEVEL SECURITY;

-- Policies for care home managers
CREATE POLICY "Managers can view their own care homes"
  ON care_home_managers
  FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

-- Function to check if user is a manager of a care home
CREATE OR REPLACE FUNCTION is_care_home_manager(care_home_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM care_home_managers 
    WHERE profile_id = auth.uid() 
    AND care_home_id = $1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;