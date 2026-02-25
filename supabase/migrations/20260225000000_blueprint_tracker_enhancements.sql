-- Blueprint Tracker Enhancements: custom question, color, reminders, frequency
-- Add columns to blueprint_tracker for the most relevant tracking features (per competitive analysis).
-- Run after 20260224000000_blueprint_tracker_and_goal_logs.sql.

-- 1. Custom tracking question (e.g. "Did you follow step 1?")
ALTER TABLE blueprint_tracker
  ADD COLUMN IF NOT EXISTS tracking_question TEXT;

-- 2. Per-plan color (hex, e.g. '#EA4335') for calendars, charts, cards
ALTER TABLE blueprint_tracker
  ADD COLUMN IF NOT EXISTS color TEXT;

-- 3. Reminders: time (HH:mm 24h), days (JSONB array), enabled
-- reminder_days: ["mon","tue","wed","thu","fri","sat","sun"] or ["*"] for any day
ALTER TABLE blueprint_tracker
  ADD COLUMN IF NOT EXISTS reminder_time TEXT;

ALTER TABLE blueprint_tracker
  ADD COLUMN IF NOT EXISTS reminder_days JSONB DEFAULT '[]'::jsonb;

ALTER TABLE blueprint_tracker
  ADD COLUMN IF NOT EXISTS reminder_enabled BOOLEAN DEFAULT false;

-- 4. Frequency: how often the habit/plan should be tracked
ALTER TABLE blueprint_tracker
  ADD COLUMN IF NOT EXISTS frequency TEXT DEFAULT 'daily'
  CHECK (frequency IN ('daily', 'weekly', 'custom'));
