-- Goal/Plan Tracker: execution tracking and journaling for blueprints
-- Tables: blueprint_tracker (one per tracked blueprint), goal_logs (journal, check-ins, step completions)

-- 1. blueprint_tracker: one row per blueprint that has been "tracked"
CREATE TABLE IF NOT EXISTS blueprint_tracker (
  blueprint_id UUID PRIMARY KEY REFERENCES blueprints(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_kind TEXT NOT NULL DEFAULT 'finite' CHECK (plan_kind IN ('finite', 'infinite')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'abandoned')),
  progress_pct INTEGER DEFAULT 0 CHECK (progress_pct >= 0 AND progress_pct <= 100),
  completed_step_ids JSONB DEFAULT '[]'::jsonb,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blueprint_tracker_user_id ON blueprint_tracker(user_id);
CREATE INDEX IF NOT EXISTS idx_blueprint_tracker_last_activity ON blueprint_tracker(last_activity_at DESC);

ALTER TABLE blueprint_tracker ENABLE ROW LEVEL SECURITY;

-- RLS: users can only access their own tracker rows
DROP POLICY IF EXISTS "Users can view own tracker" ON blueprint_tracker;
CREATE POLICY "Users can view own tracker" ON blueprint_tracker
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own tracker" ON blueprint_tracker;
CREATE POLICY "Users can insert own tracker" ON blueprint_tracker
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own tracker" ON blueprint_tracker;
CREATE POLICY "Users can update own tracker" ON blueprint_tracker
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own tracker" ON blueprint_tracker;
CREATE POLICY "Users can delete own tracker" ON blueprint_tracker
  FOR DELETE USING (auth.uid() = user_id);

-- 2. goal_logs: journal entries, check-ins, step-done events
CREATE TABLE IF NOT EXISTS goal_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('journal', 'check_in', 'step_done')),
  content TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_goal_logs_blueprint_id ON goal_logs(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_goal_logs_user_id ON goal_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_logs_created_at ON goal_logs(blueprint_id, created_at DESC);

ALTER TABLE goal_logs ENABLE ROW LEVEL SECURITY;

-- RLS: users can only access logs for blueprints they own
DROP POLICY IF EXISTS "Users can view own goal logs" ON goal_logs;
CREATE POLICY "Users can view own goal logs" ON goal_logs
  FOR SELECT USING (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM blueprints b WHERE b.id = goal_logs.blueprint_id AND b.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert own goal logs" ON goal_logs;
CREATE POLICY "Users can insert own goal logs" ON goal_logs
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM blueprints b WHERE b.id = goal_logs.blueprint_id AND b.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update own goal logs" ON goal_logs;
CREATE POLICY "Users can update own goal logs" ON goal_logs
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own goal logs" ON goal_logs;
CREATE POLICY "Users can delete own goal logs" ON goal_logs
  FOR DELETE USING (auth.uid() = user_id);

-- Optional: trigger to keep blueprint_tracker.last_activity_at and updated_at in sync when goal_logs are inserted
CREATE OR REPLACE FUNCTION goal_logs_update_tracker_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE blueprint_tracker
  SET last_activity_at = NEW.created_at,
      updated_at = NEW.created_at
  WHERE blueprint_id = NEW.blueprint_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_goal_log_insert_update_tracker ON goal_logs;
CREATE TRIGGER on_goal_log_insert_update_tracker
  AFTER INSERT ON goal_logs
  FOR EACH ROW EXECUTE PROCEDURE goal_logs_update_tracker_activity();
