-- Test Script for Extra Credits
-- Run this in Supabase SQL Editor to verify logic

BEGIN;

-- 1. Create a dummy user
INSERT INTO auth.users (id, email) VALUES ('00000000-0000-0000-0000-000000000001', 'test@example.com') ON CONFLICT DO NOTHING;

-- Profile should be created by trigger
-- Check default values
DO $$
DECLARE
    u_credits INTEGER;
    u_extra INTEGER;
    u_expiry TIMESTAMPTZ;
BEGIN
    SELECT credits, extra_credits, credits_expires_at 
    INTO u_credits, u_extra, u_expiry
    FROM profiles
    WHERE user_id = '00000000-0000-0000-0000-000000000001';

    ASSERT u_credits = 5, 'Default credits should be 5';
    ASSERT u_extra = 0, 'Default extra credits should be 0';
    ASSERT u_expiry > now(), 'Expiry should be in future';
    ASSERT u_expiry < (now() + interval '6 weeks'), 'Expiry should be approx 5 weeks';
END $$;

-- 2. Test Decrement (Normal credits first)
-- Mock auth.uid() is harder in pure SQL block without extensions, 
-- so skipping direct RPC call test in this simple block unless we use set_config.
-- We will simulate logic by updating profile directly to test consumption rules if we were to port logic here,
-- but better to test the actual function.

-- Let's try to simulate calling the function as the user.
-- Note: set_config('request.jwt.claim.sub', ...) works for RLS but RPC `auth.uid()` might rely on actual JWT.
-- If `auth.uid()` wraps `current_setting`, this works.
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);

-- Deduct 2 credits. Should come from normal.
SELECT decrement_credits(2);

DO $$
DECLARE
    u_credits INTEGER;
BEGIN
    SELECT credits INTO u_credits FROM profiles WHERE user_id = '00000000-0000-0000-0000-000000000001';
    ASSERT u_credits = 3, 'Should have 3 credits left';
END $$;

-- 3. Add Extra Credits (As Admin)
-- Need to make user admin first?? 
-- Or just manually update for test.
UPDATE profiles SET is_admin = true WHERE user_id = '00000000-0000-0000-0000-000000000001';

-- Add 10 extra credits to self
SELECT manage_extra_credits('00000000-0000-0000-0000-000000000001', 10);

DO $$
DECLARE
    u_extra INTEGER;
BEGIN
    SELECT extra_credits INTO u_extra FROM profiles WHERE user_id = '00000000-0000-0000-0000-000000000001';
    ASSERT u_extra = 10, 'Should have 10 extra credits';
END $$;

-- 4. Consume Mixed
-- Have 3 normal, 10 extra. Burn 5.
-- Should take 3 normal (leaving 0) and 2 extra (leaving 8).
SELECT decrement_credits(5);

DO $$
DECLARE
    u_credits INTEGER;
    u_extra INTEGER;
BEGIN
    SELECT credits, extra_credits INTO u_credits, u_extra
    FROM profiles
    WHERE user_id = '00000000-0000-0000-0000-000000000001';

    ASSERT u_credits = 0, 'Normal credits should be exhausted';
    ASSERT u_extra = 8, 'Extra credits should be 8';
END $$;

ROLLBACK;
-- ROLLBACK ensures no garbage is left
