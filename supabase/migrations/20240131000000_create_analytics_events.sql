create table analytics_events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  event_type text not null,
  data jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table analytics_events enable row level security;

create policy "Users can insert their own events"
  on analytics_events for insert
  with check (auth.uid() = user_id);

create policy "Users can view their own events"
  on analytics_events for select
  using (auth.uid() = user_id);
  
-- Optional: Allow admins to view all (if you have an admin role system, add policy here)
