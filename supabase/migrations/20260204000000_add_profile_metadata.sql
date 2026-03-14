-- Add metadata column to profiles for storing extended user info (demographics, hobbies, etc.)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
