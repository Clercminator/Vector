-- 1. Add extra_credits and credits_expires_at to profiles
ALTER TABLE "public"."profiles" 
ADD COLUMN IF NOT EXISTS "extra_credits" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "credits_expires_at" TIMESTAMPTZ;

-- 2. Backfill existing users
-- For existing users, set extra_credits to 0 (default handled above really)
-- Set credits_expires_at to created_at + 5 weeks
UPDATE "public"."profiles"
SET "credits_expires_at" = "created_at" + interval '5 weeks'
WHERE "credits_expires_at" IS NULL;

-- 3. Update handle_new_user Trigger Function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
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
    5,                              -- Default normal credits
    0,                              -- Default extra credits
    now() + interval '5 weeks',     -- Expires in 5 weeks
    'architect'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Redefine decrement_credits to handle expiration and extra credits
CREATE OR REPLACE FUNCTION decrement_credits(amount_to_deduct INTEGER DEFAULT 1)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_credits INTEGER;
    current_extra_credits INTEGER;
    current_expires_at TIMESTAMPTZ;
    valid_regular_credits INTEGER;
    remaining_deduction INTEGER;
    new_regular_credits INTEGER;
    new_extra_credits INTEGER;
BEGIN
    -- Get current profile data
    SELECT credits, extra_credits, credits_expires_at 
    INTO current_credits, current_extra_credits, current_expires_at
    FROM profiles
    WHERE user_id = auth.uid();

    IF current_credits IS NULL THEN
        RAISE EXCEPTION 'User profile not found';
    END IF;

    -- Calculate valid regular credits
    IF current_expires_at < now() THEN
        valid_regular_credits := 0;
    ELSE
        valid_regular_credits := current_credits;
    END IF;

    -- Check total availability
    IF (valid_regular_credits + current_extra_credits) < amount_to_deduct THEN
        RAISE EXCEPTION 'Insufficient credits';
    END IF;

    remaining_deduction := amount_to_deduct;

    -- Deduct from regular credits first
    IF valid_regular_credits >= remaining_deduction THEN
        new_regular_credits := valid_regular_credits - remaining_deduction;
        remaining_deduction := 0;
        new_extra_credits := current_extra_credits;
    ELSE
        -- Consume all valid regular credits
        remaining_deduction := remaining_deduction - valid_regular_credits;
        new_regular_credits := 0;
        
        -- Deduct remainder from extra credits
        new_extra_credits := current_extra_credits - remaining_deduction;
    END IF;

    -- Update the profile
    -- Note: If credits were expired, we effectively reset them to 0 (or whatever remains)
    -- effectively clearing the expire "state" by setting the value to what is valid.
    -- However, we preserve the expiration date as it defines the 'batch' of regular credits.
    -- If they are expired, they are gone. We update the count to reflect reality if we want,
    -- or just decrement from the 'valid' portion. 
    -- Simpler approach: Update 'credits' to new_regular_credits. 
    
    UPDATE profiles
    SET 
        credits = new_regular_credits,
        extra_credits = new_extra_credits
    WHERE user_id = auth.uid();

    RETURN new_regular_credits + new_extra_credits;
END;
$$;

-- 5. Add Admin function to manage extra credits
CREATE OR REPLACE FUNCTION manage_extra_credits(target_user_id UUID, amount INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    is_admin_user BOOLEAN;
    new_total INTEGER;
    user_exists BOOLEAN;
BEGIN
    -- Check if executing user is admin
    SELECT is_admin INTO is_admin_user
    FROM profiles
    WHERE user_id = auth.uid();

    IF is_admin_user IS NOT TRUE THEN
        RAISE EXCEPTION 'Access denied: Admin only';
    END IF;

    -- Check if target user exists
    SELECT EXISTS(SELECT 1 FROM profiles WHERE user_id = target_user_id) INTO user_exists;
    IF NOT user_exists THEN
        RAISE EXCEPTION 'Target user not found';
    END IF;

    -- Update extra credits
    UPDATE profiles
    SET extra_credits = extra_credits + amount
    WHERE user_id = target_user_id
    RETURNING extra_credits INTO new_total;

    IF new_total < 0 THEN
         -- Rollback if negative? Or allow debt? Usually non-negative.
         -- Let's clamp to 0 or raise error. 
         -- Raising error for now to be safe.
         RAISE EXCEPTION 'Resulting extra credits cannot be negative';
    END IF;

    RETURN jsonb_build_object(
        'user_id', target_user_id,
        'added_amount', amount,
        'new_extra_credit_balance', new_total
    );
END;
$$;

-- Grant permissions for the new/updated functions
GRANT EXECUTE ON FUNCTION decrement_credits(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION manage_extra_credits(UUID, INTEGER) TO authenticated;
