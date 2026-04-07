-- Support one-time extra-credit top-ups without mutating subscription tiers.

CREATE OR REPLACE FUNCTION public.increment_extra_credits(target_user_id UUID, amount_to_add INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_extra_credits INTEGER;
BEGIN
  PERFORM public.ensure_profile_for_user(target_user_id);

  UPDATE public.profiles
  SET extra_credits = extra_credits + GREATEST(amount_to_add, 0)
  WHERE user_id = target_user_id
  RETURNING extra_credits INTO new_extra_credits;

  IF new_extra_credits IS NULL THEN
    RAISE EXCEPTION 'increment_extra_credits: no profile row after ensure for user_id %', target_user_id;
  END IF;

  RETURN new_extra_credits;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_extra_credits(UUID, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_extra_credits(UUID, INTEGER) TO service_role;