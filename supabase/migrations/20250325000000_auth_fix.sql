-- Authentication Fix Migration
-- This migration fixes issues with the authentication system
-- and ensures admin accounts are properly created

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Clear any existing data to avoid conflicts (be careful with this in production!)
-- Only uncomment this if you want to start fresh
/*
DO $$
BEGIN
  -- Delete from all tables with foreign key relationships first
  DELETE FROM shift_feedback;
  DELETE FROM shift_locations;
  DELETE FROM shifts;
  DELETE FROM staff_trainings;
  DELETE FROM staff_qualifications;
  DELETE FROM staff_documents;
  DELETE FROM care_home_managers;
  DELETE FROM cost_centers;
  DELETE FROM care_homes;
  DELETE FROM agency_admins;
  DELETE FROM profiles;
  DELETE FROM agencies;
  DELETE FROM super_admin;
END $$;
*/

-- Create tables if they don't exist
-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'staff')),
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for the profiles table
DO $$ 
BEGIN
  -- Drop existing policies
  EXECUTE (
    SELECT string_agg(
      format('DROP POLICY IF EXISTS %I ON profiles;', policyname),
      E'\n'
    )
    FROM pg_policies 
    WHERE tablename = 'profiles'
  );
  
  -- Re-create policies
  CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    TO authenticated
    USING (id = auth.uid());
  
  CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());
  
  CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid());
  
  CREATE POLICY "Admins can view all profiles"
    ON profiles FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
    );
END $$;

-- Create admin user if it doesn't exist
DO $$
DECLARE
  admin_id uuid;
  admin_exists boolean;
BEGIN
  -- Check if admin user already exists
  SELECT EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE email = 'admin@boltcw.com'
  ) INTO admin_exists;
  
  -- Only create admin if it doesn't exist
  IF NOT admin_exists THEN
    -- Create admin user in auth.users
    admin_id := gen_random_uuid();
    
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      aud,
      role,
      created_at,
      updated_at,
      confirmation_token,
      email_change_token_new,
      recovery_token
    ) VALUES (
      admin_id,
      '00000000-0000-0000-0000-000000000000',
      'admin@boltcw.com',
      crypt('SecureAdminPassword!', gen_salt('bf')),
      now(),
      jsonb_build_object(
        'provider', 'email',
        'providers', ARRAY['email']::text[],
        'role', 'admin'
      ),
      jsonb_build_object(
        'full_name', 'System Administrator',
        'role', 'admin'
      ),
      'authenticated',
      'authenticated',
      now(),
      now(),
      encode(gen_random_bytes(32), 'base64'),
      encode(gen_random_bytes(32), 'base64'),
      encode(gen_random_bytes(32), 'base64')
    );
    
    -- Create admin profile
    INSERT INTO profiles (
      id,
      email,
      full_name,
      role,
      is_available,
      created_at,
      updated_at
    ) VALUES (
      admin_id,
      'admin@boltcw.com',
      'System Administrator',
      'admin',
      true,
      now(),
      now()
    );
    
    RAISE NOTICE 'Admin user created: admin@boltcw.com';
  ELSE
    RAISE NOTICE 'Admin user already exists, skipping creation';
  END IF;
END $$;

-- Create test user for easy testing
DO $$
DECLARE
  test_id uuid;
  test_exists boolean;
BEGIN
  -- Check if test user already exists
  SELECT EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE email = 'test@boltcw.com'
  ) INTO test_exists;
  
  -- Only create test user if it doesn't exist
  IF NOT test_exists THEN
    -- Create test user in auth.users
    test_id := gen_random_uuid();
    
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      aud,
      role,
      created_at,
      updated_at,
      confirmation_token,
      email_change_token_new,
      recovery_token
    ) VALUES (
      test_id,
      '00000000-0000-0000-0000-000000000000',
      'test@boltcw.com',
      crypt('Testing123!', gen_salt('bf')),
      now(),
      jsonb_build_object(
        'provider', 'email',
        'providers', ARRAY['email']::text[],
        'role', 'manager'
      ),
      jsonb_build_object(
        'full_name', 'Test Manager',
        'role', 'manager'
      ),
      'authenticated',
      'authenticated',
      now(),
      now(),
      encode(gen_random_bytes(32), 'base64'),
      encode(gen_random_bytes(32), 'base64'),
      encode(gen_random_bytes(32), 'base64')
    );
    
    -- Create test profile
    INSERT INTO profiles (
      id,
      email,
      full_name,
      role,
      is_available,
      created_at,
      updated_at
    ) VALUES (
      test_id,
      'test@boltcw.com',
      'Test Manager',
      'manager',
      true,
      now(),
      now()
    );
    
    RAISE NOTICE 'Test user created: test@boltcw.com';
  ELSE
    RAISE NOTICE 'Test user already exists, skipping creation';
  END IF;
END $$;

-- Configure email confirmation settings to not require confirmation for testing
UPDATE auth.config
SET email_confirm_required = false
WHERE id = 1;