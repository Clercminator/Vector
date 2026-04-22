-- Extend blueprint_tasks so tracker setup can persist richer quick-log inputs
-- such as durations, currency values, and arbitrary numeric metrics.

ALTER TABLE blueprint_tasks
  ADD COLUMN IF NOT EXISTS input_type TEXT;

UPDATE blueprint_tasks
SET input_type = COALESCE(input_type, 'count');

ALTER TABLE blueprint_tasks
  ALTER COLUMN input_type SET DEFAULT 'count';

ALTER TABLE blueprint_tasks
  ALTER COLUMN input_type SET NOT NULL;

ALTER TABLE blueprint_tasks
  DROP CONSTRAINT IF EXISTS blueprint_tasks_input_type_check;

ALTER TABLE blueprint_tasks
  ADD CONSTRAINT blueprint_tasks_input_type_check
  CHECK (input_type IN ('count', 'number', 'duration', 'currency'));

ALTER TABLE blueprint_tasks
  ADD COLUMN IF NOT EXISTS target_value NUMERIC;

ALTER TABLE blueprint_tasks
  ADD COLUMN IF NOT EXISTS unit_label TEXT;