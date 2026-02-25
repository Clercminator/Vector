-- Tracker Batch 3: Data export, multiple reminders, panic button, dashboard customization,
-- weekly/monthly digest, goal templates, sharing/accountability.
-- Run after batch 2 (20260226000000_tracker_batch2_features.sql).

-- 1. Dashboard / tracker customization: user preferences on profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tracker_preferences JSONB DEFAULT '{}'::jsonb;
-- e.g. { "show_streaks": true, "show_score": true, "show_heatmap": true, "default_view": "grid" }

-- 2. Digest preferences: weekly/monthly summary (sending requires Edge Function + cron)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS digest_frequency TEXT DEFAULT 'off'
  CHECK (digest_frequency IN ('off', 'weekly', 'monthly'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS digest_day_of_week INTEGER DEFAULT 0;  -- 0=Sun .. 6=Sat
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS digest_day_of_month INTEGER DEFAULT 1; -- 1-28
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS digest_last_sent_at TIMESTAMPTZ;

-- 3. Multiple reminders per plan (replaces single reminder on blueprint_tracker)
CREATE TABLE IF NOT EXISTS blueprint_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_time TEXT NOT NULL,  -- HH:mm 24h
  reminder_days JSONB DEFAULT '[]'::jsonb,  -- ["mon","tue",...] or ["*"] for any day
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blueprint_reminders_blueprint_id ON blueprint_reminders(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_blueprint_reminders_user_id ON blueprint_reminders(user_id);

ALTER TABLE blueprint_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own reminders" ON blueprint_reminders;
CREATE POLICY "Users can view own reminders" ON blueprint_reminders
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own reminders" ON blueprint_reminders;
CREATE POLICY "Users can insert own reminders" ON blueprint_reminders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own reminders" ON blueprint_reminders;
CREATE POLICY "Users can update own reminders" ON blueprint_reminders
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own reminders" ON blueprint_reminders;
CREATE POLICY "Users can delete own reminders" ON blueprint_reminders
  FOR DELETE USING (auth.uid() = user_id);

-- Enforce max 3 reminders per blueprint (application layer; optional DB trigger)
-- CREATE UNIQUE INDEX ... or CHECK via trigger. Skipped for flexibility.

-- 4. Support / panic button: configurable crisis resources (admin-curated)
CREATE TABLE IF NOT EXISTS support_resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  resource_type TEXT NOT NULL DEFAULT 'general' CHECK (resource_type IN ('panic', 'crisis', 'general')),
  sort_order INTEGER DEFAULT 0,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default crisis resources (examples; adjust for your region/audience)
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM support_resources) = 0 THEN
    INSERT INTO support_resources (label, url, resource_type, sort_order) VALUES
      ('Crisis Text Line (US)', 'https://www.crisistextline.org/', 'crisis', 1),
      ('National Suicide Prevention Lifeline (US)', 'https://988lifeline.org/', 'crisis', 2),
      ('Find a Therapist', 'https://www.psychologytoday.com/us/therapists', 'general', 10);
  END IF;
END $$;

ALTER TABLE support_resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read support resources" ON support_resources;
CREATE POLICY "Anyone can read support resources" ON support_resources
  FOR SELECT USING (enabled = true);

-- 5. Goal templates: predefined sub-goals / task bundles for quick setup
CREATE TABLE IF NOT EXISTS goal_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT true,  -- built-in vs user-created
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS goal_template_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES goal_templates(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('sub_goal', 'task')),
  title TEXT NOT NULL,
  target_count INTEGER,   -- for task (e.g. 2)
  target_offset_days INTEGER,  -- for sub_goal: days from today (e.g. 7 = "in 1 week")
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_goal_template_items_template_id ON goal_template_items(template_id);

-- Seed example templates
DO $$
DECLARE
  tid UUID;
BEGIN
  IF (SELECT COUNT(*) FROM goal_templates WHERE name = 'Morning Routine') = 0 THEN
    INSERT INTO goal_templates (name, description, is_system) VALUES
      ('Morning Routine', 'Meditation, stretch, journal', true)
      RETURNING id INTO tid;
    INSERT INTO goal_template_items (template_id, item_type, title, target_count, target_offset_days, sort_order) VALUES
      (tid, 'task', 'Meditate 10 min', 1, NULL, 1),
      (tid, 'task', 'Stretch 5 min', 1, NULL, 2),
      (tid, 'task', 'Journal 5 min', 1, NULL, 3),
      (tid, 'sub_goal', 'Complete morning routine every day', NULL, 7, 4);
  END IF;

  IF (SELECT COUNT(*) FROM goal_templates WHERE name = 'Fitness Week') = 0 THEN
    INSERT INTO goal_templates (name, description, is_system) VALUES
      ('Fitness Week', 'Workouts per week', true)
      RETURNING id INTO tid;
    INSERT INTO goal_template_items (template_id, item_type, title, target_count, target_offset_days, sort_order) VALUES
      (tid, 'task', 'Workout', 3, NULL, 1),
      (tid, 'sub_goal', 'Hit 3 workouts this week', NULL, 7, 2);
  END IF;
END $$;

-- goal_templates and goal_template_items: system templates are public read
ALTER TABLE goal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_template_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read system goal templates" ON goal_templates;
CREATE POLICY "Anyone can read system goal templates" ON goal_templates
  FOR SELECT USING (is_system = true);

DROP POLICY IF EXISTS "Anyone can read goal template items" ON goal_template_items;
CREATE POLICY "Anyone can read goal template items" ON goal_template_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM goal_templates gt WHERE gt.id = goal_template_items.template_id AND gt.is_system = true)
  );

-- 6. Sharing / accountability: view-only share links
CREATE TABLE IF NOT EXISTS blueprint_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_token UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  permission TEXT NOT NULL DEFAULT 'view' CHECK (permission IN ('view')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blueprint_shares_share_token ON blueprint_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_blueprint_shares_blueprint_id ON blueprint_shares(blueprint_id);

ALTER TABLE blueprint_shares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can view own shares" ON blueprint_shares;
CREATE POLICY "Owners can view own shares" ON blueprint_shares
  FOR SELECT USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can insert own shares" ON blueprint_shares;
CREATE POLICY "Owners can insert own shares" ON blueprint_shares
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can update own shares" ON blueprint_shares;
CREATE POLICY "Owners can update own shares" ON blueprint_shares
  FOR UPDATE USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can delete own shares" ON blueprint_shares;
CREATE POLICY "Owners can delete own shares" ON blueprint_shares
  FOR DELETE USING (auth.uid() = owner_id);

-- RPC for public read-by-token (called by Edge Function or anon client with token)
-- Viewers use token to fetch shared blueprint + tracker; RLS blocks direct access.
-- Implement via Edge Function: get_shared_blueprint(token) -> returns blueprint, tracker, logs if valid.
