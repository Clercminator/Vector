CREATE TABLE IF NOT EXISTS community_template_proof_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES community_templates(id) ON DELETE CASCADE,
  blueprint_id UUID REFERENCES blueprints(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('published', 'progress', 'milestone', 'consistency', 'execution', 'completion')),
  label TEXT NOT NULL,
  detail TEXT NOT NULL,
  event_date TIMESTAMPTZ NOT NULL,
  metric_value NUMERIC,
  metric_unit TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_template_proof_events_template_id
  ON community_template_proof_events(template_id);

CREATE INDEX IF NOT EXISTS idx_community_template_proof_events_event_date
  ON community_template_proof_events(event_date DESC);

ALTER TABLE community_template_proof_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Proof events are viewable by everyone" ON community_template_proof_events;
CREATE POLICY "Proof events are viewable by everyone"
  ON community_template_proof_events FOR SELECT USING (true);

DROP POLICY IF EXISTS "Owners can insert own proof events" ON community_template_proof_events;
CREATE POLICY "Owners can insert own proof events"
  ON community_template_proof_events FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM community_templates t
      WHERE t.id = template_id AND t.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners can update own proof events" ON community_template_proof_events;
CREATE POLICY "Owners can update own proof events"
  ON community_template_proof_events FOR UPDATE
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM community_templates t
      WHERE t.id = template_id AND t.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners can delete own proof events" ON community_template_proof_events;
CREATE POLICY "Owners can delete own proof events"
  ON community_template_proof_events FOR DELETE
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM community_templates t
      WHERE t.id = template_id AND t.user_id = auth.uid()
    )
  );