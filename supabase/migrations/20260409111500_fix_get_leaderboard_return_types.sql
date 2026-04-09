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
    coalesce(sum(ct.votes_count), 0)::bigint as total_votes,
    count(ct.id) as template_count
  from
    profiles p
  join
    (
      select
        t.user_id,
        t.id,
        count(tv.*)::bigint as votes_count
      from
        community_templates t
      left join template_votes tv on tv.template_id = t.id
      group by
        t.user_id,
        t.id
    ) ct on p.user_id = ct.user_id
  group by
    p.user_id, p.display_name, p.avatar_url
  order by
    total_votes desc, template_count desc
  limit limit_count;
end;
$$;