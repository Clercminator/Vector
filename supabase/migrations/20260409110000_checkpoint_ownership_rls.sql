alter table checkpoints
  add column if not exists owner_user_id uuid;

alter table checkpoint_writes
  add column if not exists owner_user_id uuid;

update checkpoints
set owner_user_id = nullif(metadata->>'user_id', '')::uuid
where owner_user_id is null
  and jsonb_typeof(metadata) = 'object'
  and metadata ? 'user_id'
  and (metadata->>'user_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';

update checkpoint_writes
set owner_user_id = nullif(value->>'user_id', '')::uuid
where owner_user_id is null
  and jsonb_typeof(value) = 'object'
  and value ? 'user_id'
  and (value->>'user_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';

alter table checkpoints
  alter column owner_user_id set default auth.uid();

alter table checkpoint_writes
  alter column owner_user_id set default auth.uid();

create index if not exists idx_checkpoints_owner_user_id
  on checkpoints(owner_user_id);

create index if not exists idx_checkpoint_writes_owner_user_id
  on checkpoint_writes(owner_user_id);

alter table checkpoints enable row level security;
alter table checkpoint_writes enable row level security;

drop policy if exists "Users can reading their own checkpoints" on checkpoints;
drop policy if exists "Users can insert checkpoints" on checkpoints;
drop policy if exists "Users can update checkpoints" on checkpoints;
drop policy if exists "Users can access their own checkpoints" on checkpoints;
drop policy if exists "Users can insert their own checkpoints" on checkpoints;
drop policy if exists "Users can update their own checkpoints" on checkpoints;

drop policy if exists "Users can reading their own writes" on checkpoint_writes;
drop policy if exists "Users can read their own writes" on checkpoint_writes;
drop policy if exists "Users can insert checkpoint writes" on checkpoint_writes;
drop policy if exists "Users can insert their own writes" on checkpoint_writes;
drop policy if exists "Users can access their own writes" on checkpoint_writes;
drop policy if exists "Users can update their own writes" on checkpoint_writes;

create policy "Users can manage their own checkpoints"
on checkpoints
for all
to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

create policy "Users can manage their own checkpoint writes"
on checkpoint_writes
for all
to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());