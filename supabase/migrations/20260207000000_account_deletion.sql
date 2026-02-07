-- 1. Create table to track deleted users
CREATE TABLE IF NOT EXISTS public.deleted_users (
    email TEXT PRIMARY KEY,
    deleted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Secure the table (no public access, only via functions)
ALTER TABLE public.deleted_users ENABLE ROW LEVEL SECURITY;

-- 2. Function to delete own account
CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth 
AS $$
DECLARE
    v_user_email TEXT;
BEGIN
    -- Get email of executing user
    SELECT email INTO v_user_email FROM auth.users WHERE id = auth.uid();
    
    IF v_user_email IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    -- Log deletion for abuse prevention
    INSERT INTO public.deleted_users (email) VALUES (v_user_email)
    ON CONFLICT (email) DO UPDATE SET deleted_at = NOW();

    -- Delete the user
    DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_own_account() TO authenticated;

-- 3. Update handle_new_user to check for abuse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  initial_credits INTEGER;
BEGIN
  -- Check if user was previously deleted
  IF EXISTS (SELECT 1 FROM public.deleted_users WHERE email = new.email) THEN
    initial_credits := 0; -- ABUSE PREVENTION: 0 credits for returning users
  ELSE
    initial_credits := 5; -- Default value
  END IF;

  INSERT INTO public.profiles (
    user_id, 
    display_name, 
    credits, 
    extra_credits,
    credits_expires_at,
    tier
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    initial_credits,
    0,
    now() + interval '5 weeks',
    'architect'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
