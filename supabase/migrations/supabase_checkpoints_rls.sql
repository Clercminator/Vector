-- Enable RLS (In case it's not enabled)
ALTER TABLE checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkpoint_writes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts if they exist but are broken
DROP POLICY IF EXISTS "Users can access their own checkpoints" ON checkpoints;
DROP POLICY IF EXISTS "Users can insert their own checkpoints" ON checkpoints;
DROP POLICY IF EXISTS "Users can update their own checkpoints" ON checkpoints;

DROP POLICY IF EXISTS "Users can access their own writes" ON checkpoint_writes;
DROP POLICY IF EXISTS "Users can insert their own writes" ON checkpoint_writes;

-- Create Policies

-- Checkpoints: SELECT
CREATE POLICY "Users can access their own checkpoints" ON checkpoints
    FOR SELECT
    USING (auth.uid() = (metadata->>'user_id')::uuid);

-- Checkpoints: INSERT
CREATE POLICY "Users can insert their own checkpoints" ON checkpoints
    FOR INSERT
    WITH CHECK (auth.uid() = (metadata->>'user_id')::uuid);

-- Checkpoints: UPDATE
CREATE POLICY "Users can update their own checkpoints" ON checkpoints
    FOR UPDATE
    USING (auth.uid() = (metadata->>'user_id')::uuid);


-- Checkpoint Writes: SELECT
CREATE POLICY "Users can access their own writes" ON checkpoint_writes
    FOR SELECT
    USING (auth.uid() = (value->>'user_id')::uuid OR auth.uid()::text = thread_id);

-- Checkpoint Writes: INSERT (Simplified)
CREATE POLICY "Users can insert their own writes" ON checkpoint_writes
    FOR INSERT
    WITH CHECK (true);
