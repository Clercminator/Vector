-- Run this in Supabase SQL Editor to extend credits or add bonus plans.
-- Replace YOUR_USER_EMAIL with your actual email (e.g. edmundoclerc7@gmail.com).
--
-- Option A: Extend expiration (restores your regular plans)
UPDATE profiles
SET credits_expires_at = NOW() + INTERVAL '1 year'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'YOUR_USER_EMAIL' LIMIT 1);

-- Option B: Add bonus plans (never expire)
UPDATE profiles
SET extra_credits = COALESCE(extra_credits, 0) + 5
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'YOUR_USER_EMAIL' LIMIT 1);

-- Option C: Both (extend + add bonus)
-- UPDATE profiles
-- SET credits_expires_at = NOW() + INTERVAL '1 year', extra_credits = COALESCE(extra_credits, 0) + 5
-- WHERE user_id = (SELECT id FROM auth.users WHERE email = 'YOUR_USER_EMAIL' LIMIT 1);
