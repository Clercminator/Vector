-- Tracker Batch 2: High + Medium priority features
-- Run after 20260224000000_blueprint_tracker_and_goal_logs.sql and 20260225000000_blueprint_tracker_enhancements.sql.
-- Features: sub-goals, related tasks, relapse/setback, savings, tags, motivational content.

-- 1. Relapse / setback logging: add 'setback' to goal_logs.kind
ALTER TABLE goal_logs DROP CONSTRAINT IF EXISTS goal_logs_kind_check;
ALTER TABLE goal_logs ADD CONSTRAINT goal_logs_kind_check
  CHECK (kind IN ('journal', 'check_in', 'step_done', 'setback'));

-- 2. Savings / quantified progress: baseline, unit, enabled on blueprint_tracker
ALTER TABLE blueprint_tracker ADD COLUMN IF NOT EXISTS savings_baseline NUMERIC DEFAULT 1;
ALTER TABLE blueprint_tracker ADD COLUMN IF NOT EXISTS savings_unit TEXT DEFAULT 'hours'
  CHECK (savings_unit IN ('hours', 'minutes', 'days', 'dollars', 'points'));
ALTER TABLE blueprint_tracker ADD COLUMN IF NOT EXISTS savings_enabled BOOLEAN DEFAULT false;

-- 3. Category / tag filtering: tags array on blueprint_tracker
ALTER TABLE blueprint_tracker ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;

-- 4. Sub-goals: time-bound targets within a plan
CREATE TABLE IF NOT EXISTS blueprint_sub_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'missed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blueprint_sub_goals_blueprint_id ON blueprint_sub_goals(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_blueprint_sub_goals_target_date ON blueprint_sub_goals(target_date);

ALTER TABLE blueprint_sub_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own sub-goals" ON blueprint_sub_goals;
CREATE POLICY "Users can view own sub-goals" ON blueprint_sub_goals
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own sub-goals" ON blueprint_sub_goals;
CREATE POLICY "Users can insert own sub-goals" ON blueprint_sub_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own sub-goals" ON blueprint_sub_goals;
CREATE POLICY "Users can update own sub-goals" ON blueprint_sub_goals
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own sub-goals" ON blueprint_sub_goals;
CREATE POLICY "Users can delete own sub-goals" ON blueprint_sub_goals
  FOR DELETE USING (auth.uid() = user_id);

-- 5. Related tasks / complementary habits: tasks linked to a blueprint with target count
CREATE TABLE IF NOT EXISTS blueprint_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_count INTEGER NOT NULL DEFAULT 1 CHECK (target_count >= 1),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blueprint_tasks_blueprint_id ON blueprint_tasks(blueprint_id);

ALTER TABLE blueprint_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own tasks" ON blueprint_tasks;
CREATE POLICY "Users can view own tasks" ON blueprint_tasks
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own tasks" ON blueprint_tasks;
CREATE POLICY "Users can insert own tasks" ON blueprint_tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own tasks" ON blueprint_tasks;
CREATE POLICY "Users can update own tasks" ON blueprint_tasks
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own tasks" ON blueprint_tasks;
CREATE POLICY "Users can delete own tasks" ON blueprint_tasks
  FOR DELETE USING (auth.uid() = user_id);

-- 6. Task completions: one row per completion (e.g. "Workout 0/2" -> 2 rows = 2/2)
CREATE TABLE IF NOT EXISTS blueprint_task_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES blueprint_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blueprint_task_completions_task_id ON blueprint_task_completions(task_id);
CREATE INDEX IF NOT EXISTS idx_blueprint_task_completions_completed_at ON blueprint_task_completions(completed_at);

ALTER TABLE blueprint_task_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own task completions" ON blueprint_task_completions;
CREATE POLICY "Users can view own task completions" ON blueprint_task_completions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own task completions" ON blueprint_task_completions;
CREATE POLICY "Users can insert own task completions" ON blueprint_task_completions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own task completions" ON blueprint_task_completions;
CREATE POLICY "Users can delete own task completions" ON blueprint_task_completions
  FOR DELETE USING (auth.uid() = user_id);

-- 7. Motivational content: quotes, affirmations (admin-curated or seeded)
CREATE TABLE IF NOT EXISTS motivational_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type TEXT NOT NULL CHECK (content_type IN ('quote', 'affirmation')),
  text TEXT NOT NULL,
  author TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default entries (run only when table is empty)
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM motivational_content) = 0 THEN
    INSERT INTO motivational_content (content_type, text, author, sort_order) VALUES
      ('quote', 'The best way to predict the future is to create it.', 'Abraham Lincoln', 1),
      ('quote', 'It does not matter how slowly you go as long as you do not stop.', 'Confucius', 2),
      ('quote', 'The secret of getting ahead is getting started.', 'Mark Twain', 3),
      ('affirmation', 'Yes You Can', NULL, 10),
      ('affirmation', 'I am making progress every day.', NULL, 11),
      ('affirmation', 'Small steps lead to big changes.', NULL, 12);
  END IF;
END $$;

-- Allow public read for motivational_content (no user-specific data)
ALTER TABLE motivational_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read motivational content" ON motivational_content;
CREATE POLICY "Anyone can read motivational content" ON motivational_content
  FOR SELECT USING (true);
