-- User feedback table for product improvement
create table if not exists public.feedback (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete set null,
  message text not null,
  rating smallint check (rating >= 1 and rating <= 5),
  page_context text,
  email text,
  created_at timestamptz default now()
);

create index if not exists idx_feedback_created_at on public.feedback(created_at desc);
create index if not exists idx_feedback_user_id on public.feedback(user_id);

alter table public.feedback enable row level security;

-- Anyone (including anonymous) can submit feedback
create policy "Anyone can insert feedback"
  on public.feedback for insert
  with check (true);

-- Only admins can read feedback
create policy "Admins can view all feedback"
  on public.feedback for select
  using (public.is_admin());
