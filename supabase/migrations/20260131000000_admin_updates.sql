-- Add admin flag to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Add moderation fields to community_templates
ALTER TABLE community_templates ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved'; -- 'pending', 'approved', 'rejected'
ALTER TABLE community_templates ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- RLS Updates for Admin access
-- We use a policy that checks the profiles table for the is_admin flag

-- 1. Profiles: Admins can view and update all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = true));

-- 2. Community Templates: Admins can manage all templates
DROP POLICY IF EXISTS "Admins can select all templates" ON community_templates;
CREATE POLICY "Admins can select all templates"
  ON community_templates FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "Admins can update all templates" ON community_templates;
CREATE POLICY "Admins can update all templates"
  ON community_templates FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "Admins can delete all templates" ON community_templates;
CREATE POLICY "Admins can delete all templates"
  ON community_templates FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = true));

-- 3. Template Votes: Admins can see all votes
DROP POLICY IF EXISTS "Admins can view all votes" ON template_votes;
CREATE POLICY "Admins can view all votes"
  ON template_votes FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = true));

-- 4. Blueprints: Admins can view all blueprints (for support)
DROP POLICY IF EXISTS "Admins can view all blueprints" ON blueprints;
CREATE POLICY "Admins can view all blueprints"
  ON blueprints FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = true));
