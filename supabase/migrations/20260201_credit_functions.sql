-- Credit Management RPC Functions
-- Securely handle credit deduction and increment.

-- Drop existing functions to allow parameter renaming/updates and avoid ambiguity
DROP FUNCTION IF EXISTS decrement_credits(INTEGER);
DROP FUNCTION IF EXISTS decrement_credits(); -- Drop potential no-arg variant
DROP FUNCTION IF EXISTS increment_credits(UUID, INTEGER);

-- 1. Decrement Credits (Security: authenticated user only)
CREATE OR REPLACE FUNCTION decrement_credits(amount_to_deduct INTEGER DEFAULT 1)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges to update profiles
SET search_path = public
AS $$
DECLARE
    current_credits INTEGER;
BEGIN
    -- Get current credits for the authenticated user
    SELECT credits INTO current_credits
    FROM profiles
    WHERE user_id = auth.uid();

    IF current_credits IS NULL THEN
        RAISE EXCEPTION 'User profile not found';
    END IF;

    IF current_credits < amount_to_deduct THEN
        RAISE EXCEPTION 'Insufficient credits';
    END IF;

    -- Deduct credits
    UPDATE profiles
    SET credits = credits - amount_to_deduct
    WHERE user_id = auth.uid();

    RETURN current_credits - amount_to_deduct;
END;
$$;

-- 2. Increment Credits (Security: service_role or admin typically, used by webhooks)
CREATE OR REPLACE FUNCTION increment_credits(target_user_id UUID, amount_to_add INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_credits INTEGER;
BEGIN
    UPDATE profiles
    SET credits = credits + amount_to_add
    WHERE user_id = target_user_id
    RETURNING credits INTO new_credits;

    RETURN new_credits;
END;
$$;

-- Ensure RLS allows the decrement_credits to be called by users
-- (Actually RPCs are not covered by RLS in the same way, SECURITY DEFINER handles it)
-- We must be specific with arguments to avoid "function name is not unique" errors if overloads exist
GRANT EXECUTE ON FUNCTION decrement_credits(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_credits(UUID, INTEGER) TO service_role;
