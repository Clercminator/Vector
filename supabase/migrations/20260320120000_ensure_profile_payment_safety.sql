-- Ensure every auth user has a profiles row (signup trigger, payments, and client self-heal).
-- Prevents webhooks from silently doing nothing when increment_credits updates 0 rows.

-- 1) Core: create profile from auth.users if missing (same rules as handle_new_user)
CREATE OR REPLACE FUNCTION public.ensure_profile_for_user(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted_count INTEGER;
BEGIN
  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = p_user_id) THEN
    RETURN;
  END IF;

  INSERT INTO public.profiles (
    user_id,
    display_name,
    credits,
    extra_credits,
    credits_expires_at,
    tier
  )
  SELECT
    u.id,
    COALESCE(
      NULLIF(trim(u.raw_user_meta_data->>'full_name'), ''),
      NULLIF(trim(u.raw_user_meta_data->>'name'), ''),
      u.email,
      'User'
    ),
    CASE
      WHEN EXISTS (SELECT 1 FROM public.deleted_users d WHERE d.email IS NOT DISTINCT FROM u.email) THEN 0
      ELSE 1
    END,
    0,
    now() + interval '5 weeks',
    'architect'
  FROM auth.users u
  WHERE u.id = p_user_id;

  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  IF inserted_count = 0 THEN
    RAISE EXCEPTION 'ensure_profile_for_user: no auth.users row for user_id %', p_user_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_profile_for_user(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_profile_for_user(UUID) TO service_role;

-- 2) Authenticated users can heal their own missing profile (OAuth / trigger failures)
CREATE OR REPLACE FUNCTION public.ensure_my_profile()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  PERFORM public.ensure_profile_for_user(auth.uid());
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_my_profile() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_my_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_my_profile() TO service_role;

-- 3) Signup trigger: single code path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.ensure_profile_for_user(NEW.id);
  RETURN NEW;
END;
$$;

-- 4) Payment path: always ensure profile before adding credits
CREATE OR REPLACE FUNCTION public.increment_credits(target_user_id UUID, amount_to_add INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_credits INTEGER;
BEGIN
  PERFORM public.ensure_profile_for_user(target_user_id);

  UPDATE public.profiles
  SET credits = credits + amount_to_add
  WHERE user_id = target_user_id
  RETURNING credits INTO new_credits;

  IF new_credits IS NULL THEN
    RAISE EXCEPTION 'increment_credits: no profile row after ensure for user_id %', target_user_id;
  END IF;

  RETURN new_credits;
END;
$$;

-- 5) Backfill: auth users without profiles (one-time repair)
INSERT INTO public.profiles (
  user_id,
  display_name,
  credits,
  extra_credits,
  credits_expires_at,
  tier
)
SELECT
  u.id,
  COALESCE(
    NULLIF(trim(u.raw_user_meta_data->>'full_name'), ''),
    NULLIF(trim(u.raw_user_meta_data->>'name'), ''),
    u.email,
    'User'
  ),
  CASE
    WHEN EXISTS (SELECT 1 FROM public.deleted_users d WHERE d.email IS NOT DISTINCT FROM u.email) THEN 0
    ELSE 1
  END,
  0,
  now() + interval '5 weeks',
  'architect'
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = u.id)
ON CONFLICT (user_id) DO NOTHING;
