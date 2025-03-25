/*
  # Create Admin User

  1. Changes
    - Create admin user with proper credentials
    - Set up admin profile
    - Configure proper permissions
  
  2. Security
    - Use secure password hashing
    - Set proper role and metadata
*/

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
    WHERE email = 'admin@example.com'
  ) INTO admin_exists;

  -- Only create admin if it doesn't exist
  IF NOT admin_exists THEN
    admin_id := gen_random_uuid();
    
    -- Insert into auth.users
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
  END IF;
END $$;