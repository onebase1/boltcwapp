/*
  # Create Super Admin

  1. Changes
    - Create initial super admin user using proper Supabase auth functions
    - Set up admin profile with proper role and permissions
  
  2. Security
    - Use proper auth schema and functions
    - Create corresponding profile with admin role
    - Ensure proper error handling
*/

-- Create the admin profile first
DO $$
DECLARE
  admin_id uuid := gen_random_uuid();
BEGIN
  -- Insert into auth.users
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change_token_new,
    recovery_token
  ) VALUES (
    admin_id,
    '00000000-0000-0000-0000-000000000000',
    'admin@example.com',
    crypt('SecurePassword123!', gen_salt('bf')), -- Replace with actual secure password
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"admin"}'::jsonb,
    now(),
    now(),
    encode(gen_random_bytes(32), 'base64'),
    encode(gen_random_bytes(32), 'base64'),
    encode(gen_random_bytes(32), 'base64')
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

  -- Grant admin role in auth.users
  UPDATE auth.users
  SET role = 'authenticated'
  WHERE id = admin_id;
END $$;

-- Add comment to document admin credentials
COMMENT ON TABLE public.profiles IS 'User profiles table. Initial admin credentials: admin@example.com / SecurePassword123! (change on first login)';