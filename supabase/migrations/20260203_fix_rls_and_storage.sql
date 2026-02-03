-- Fix Infinite Recursion by using a SECURITY DEFINER function for admin checks
-- This bypasses the RLS on the profiles table when checking for admin status
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM profiles
    WHERE user_id = auth.uid()
    AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop recursive policies
DROP POLICY IF EXISTS "Admins can view all payments" ON payments;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can select all templates" ON community_templates;
DROP POLICY IF EXISTS "Admins can update all templates" ON community_templates;
DROP POLICY IF EXISTS "Admins can delete all templates" ON community_templates;
DROP POLICY IF EXISTS "Admins can view all votes" ON template_votes;
DROP POLICY IF EXISTS "Admins can view all blueprints" ON blueprints;

-- Recreate policies using is_admin()

-- Payments
CREATE POLICY "Admins can view all payments"
  ON payments FOR SELECT
  USING (public.is_admin());

-- Profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (public.is_admin());

-- Community Templates
CREATE POLICY "Admins can select all templates"
  ON community_templates FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update all templates"
  ON community_templates FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete all templates"
  ON community_templates FOR DELETE
  USING (public.is_admin());

-- Template Votes
CREATE POLICY "Admins can view all votes"
  ON template_votes FOR SELECT
  USING (public.is_admin());

-- Blueprints
CREATE POLICY "Admins can view all blueprints"
  ON blueprints FOR SELECT
  USING (public.is_admin());


-- Storage: Avatars
-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'avatars' );

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid() = (storage.foldername(name))[1]::uuid
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    auth.uid() = (storage.foldername(name))[1]::uuid
  );

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    auth.uid() = (storage.foldername(name))[1]::uuid
  );
