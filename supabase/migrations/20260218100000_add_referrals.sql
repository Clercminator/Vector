-- Add referrer_code to profiles if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referrer_code TEXT;

-- Create referrers table for partner management
CREATE TABLE IF NOT EXISTS referrers (
    code TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id), -- Optional: link to a user if the partner is also a user
    display_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Index for faster lookups on profiles(referrer_code)
CREATE INDEX IF NOT EXISTS idx_profiles_referrer_code ON profiles(referrer_code);

-- RLS for referrers (Public read, Admin write)
ALTER TABLE referrers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Referrers are public read" ON referrers;
CREATE POLICY "Referrers are public read" ON referrers
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can insert/update referrers" ON referrers;
CREATE POLICY "Admins can insert/update referrers" ON referrers
    FOR ALL USING (
        exists (select 1 from profiles where user_id = auth.uid() and is_admin = true)
    );
