-- Admins can view all analytics_events (for funnel analysis, drop-off, etc.)
DROP POLICY IF EXISTS "Admins can view all analytics events" ON analytics_events;
CREATE POLICY "Admins can view all analytics events"
  ON analytics_events FOR SELECT
  USING (public.is_admin());
