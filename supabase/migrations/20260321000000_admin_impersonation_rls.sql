-- Allow admins to read all blueprint_tracker, goal_logs, blueprint_messages for "view as user" / impersonation
DROP POLICY IF EXISTS "Admins can view all blueprint_tracker" ON blueprint_tracker;
CREATE POLICY "Admins can view all blueprint_tracker"
  ON blueprint_tracker FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view all goal_logs" ON goal_logs;
CREATE POLICY "Admins can view all goal_logs"
  ON goal_logs FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view all blueprint_messages" ON blueprint_messages;
CREATE POLICY "Admins can view all blueprint_messages"
  ON blueprint_messages FOR SELECT
  USING (public.is_admin());
