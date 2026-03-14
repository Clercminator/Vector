-- Fix handle_new_user and ensure profiles table has necessary defaults
-- Addresses Auth 500 Error: "Database error saving new user"

-- 1. Ensure Columns Exist and Have Defaults
-- We use DO blocks to check existence and ALTER to set defaults.

DO $$ BEGIN
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS streak_count INTEGER DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Fix defaults for existing columns just in case
ALTER TABLE profiles ALTER COLUMN level SET DEFAULT 1;
ALTER TABLE profiles ALTER COLUMN points SET DEFAULT 0;
ALTER TABLE profiles ALTER COLUMN streak_count SET DEFAULT 0;
ALTER TABLE profiles ALTER COLUMN bio SET DEFAULT '';
ALTER TABLE profiles ALTER COLUMN avatar_url SET DEFAULT '';
ALTER TABLE profiles ALTER COLUMN credits SET DEFAULT 5;
ALTER TABLE profiles ALTER COLUMN tier SET DEFAULT 'architect';

-- 2. Update handle_new_user to explicitly insert these values
-- CRITICAL FIX: Removed 'full_name' as it appears to be missing from the production table schema.
-- We also ensure search_path is set to public for security
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id, 
    display_name, 
    credits, 
    tier,
    level,
    points,
    streak_count,
    bio,
    avatar_url
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    5,
    'architect',
    1,
    0,
    0,
    '',
    ''
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
