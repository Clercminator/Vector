CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  event_type text not null,
  data jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own events" ON analytics_events;
CREATE POLICY "Users can insert their own events"
  ON analytics_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own events" ON analytics_events;
CREATE POLICY "Users can view their own events"
  ON analytics_events FOR SELECT
  USING (auth.uid() = user_id);
  
-- Optional: Allow admins to view all (if you have an admin role system, add policy here)
