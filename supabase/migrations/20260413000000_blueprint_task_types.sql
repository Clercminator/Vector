-- Promote tracker task semantics out of task title prefixes and into an explicit task_type field.

ALTER TABLE blueprint_tasks
  ADD COLUMN IF NOT EXISTS task_type TEXT;

UPDATE blueprint_tasks
SET task_type = 'proof_entry',
    title = regexp_replace(title, '^\s*Weekly proof:\s*', '', 'i')
WHERE title ~* '^\s*Weekly proof:\s*';

UPDATE blueprint_tasks
SET task_type = 'review',
    title = regexp_replace(title, '^\s*Weekly review:\s*', '', 'i')
WHERE title ~* '^\s*Weekly review:\s*';

UPDATE blueprint_tasks
SET task_type = 'rescue_action',
    title = regexp_replace(title, '^\s*Recovery block:\s*', '', 'i')
WHERE title ~* '^\s*Recovery block:\s*';

UPDATE blueprint_tasks
SET task_type = COALESCE(task_type, 'task');

ALTER TABLE blueprint_tasks
  ALTER COLUMN task_type SET DEFAULT 'task';

ALTER TABLE blueprint_tasks
  ALTER COLUMN task_type SET NOT NULL;

ALTER TABLE blueprint_tasks
  DROP CONSTRAINT IF EXISTS blueprint_tasks_task_type_check;

ALTER TABLE blueprint_tasks
  ADD CONSTRAINT blueprint_tasks_task_type_check
  CHECK (task_type IN ('task', 'proof_entry', 'rescue_action', 'review'));