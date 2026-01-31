-- Create a function to get the leaderboard (top users by total votes on their templates)
create or replace function get_leaderboard(limit_count int default 10)
returns table (
  user_id uuid,
  display_name text,
  avatar_url text,
  total_votes bigint,
  template_count bigint
) 
language plpgsql
security definer
as $$
begin
  return query
  select 
    p.user_id,
    p.display_name,
    p.avatar_url,
    coalesce(sum(ct.votes_count), 0) as total_votes,
    count(ct.id) as template_count
  from 
    profiles p
  join 
    (
      select 
        t.user_id, 
        t.id,
        (select count(*) from template_votes tv where tv.template_id = t.id) as votes_count
      from 
        community_templates t
    ) ct on p.user_id = ct.user_id
  group by 
    p.user_id, p.display_name, p.avatar_url
  order by 
    total_votes desc, template_count desc
  limit limit_count;
end;
$$;
