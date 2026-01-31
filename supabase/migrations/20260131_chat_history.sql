create table if not exists blueprint_messages (
  id uuid default gen_random_uuid() primary key,
  blueprint_id uuid references blueprints(id) on delete cascade not null,
  role text not null check (role in ('user', 'ai', 'system')),
  content text not null,
  created_at timestamptz default now()
);

alter table blueprint_messages enable row level security;

-- Policy: Users can view messages linked to their blueprints
drop policy if exists "Users can view own messages" on blueprint_messages;
create policy "Users can view own messages" on blueprint_messages
  for select using (
    exists (
      select 1 from blueprints
      where blueprints.id = blueprint_messages.blueprint_id
      and blueprints.user_id = auth.uid()
    )
  );

-- Policy: Users can insert messages linked to their blueprints
drop policy if exists "Users can insert own messages" on blueprint_messages;
create policy "Users can insert own messages" on blueprint_messages
  for insert with check (
    exists (
      select 1 from blueprints
      where blueprints.id = blueprint_messages.blueprint_id
      and blueprints.user_id = auth.uid()
    )
  );
