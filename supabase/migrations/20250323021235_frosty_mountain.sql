/*
  # Create Admin User with Proper Authentication

  1. Changes
    - Clean up any existing admin user
    - Create admin user with proper credentials
    - Set up admin profile with correct metadata
  
  2. Security
    - Use secure password hashing
    - Set proper role and metadata
    - Enable email confirmation
*/

-- First, clean up any existing admin user to avoid conflicts
DO $$
BEGIN
  -- Delete from profiles first due to foreign key constraint
  DELETE FROM public.profiles WHERE email = 'admin@example.com';
  -- Then delete from auth.users
  DELETE FROM auth.users WHERE email = 'admin@example.com';
END $$;

-- Create new admin user
DO $$
DECLARE
  admin_id uuid := gen_random_uuid();
BEGIN
  -- Insert into auth.users with proper metadata
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
    recovery_token,
    is_super_admin
  ) VALUES (
    admin_id,
    '00000000-0000-0000-0000-000000000000',
    'admin@example.com',
    crypt('SecurePassword123!', gen_salt('bf')),
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
    encode(gen_random_bytes(32), 'base64'),
    true
  );

  -- Create the admin profile
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    is_available,
    created_at,
    updated_at
  ) VALUES (
    admin_id,
    'admin@example.com',
    'System Administrator',
    'admin',
    true,
    now(),
    now()
  );

  -- Update email_confirmed_at to ensure the user can sign in
  UPDATE auth.users
  SET email_confirmed_at = now(),
      last_sign_in_at = now()
  WHERE id = admin_id;
END $$;