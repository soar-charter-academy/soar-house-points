create or replace function get_house_totals_since(since timestamptz default null)
returns table (
  house_id uuid,
  house_name text,
  color_hex text,
  total_points bigint
) as $$
  select
    h.id as house_id,
    h.name as house_name,
    h.color_hex,
    coalesce(sum(p.value), 0) as total_points
  from houses h
  left join points p on p.house_id = h.id 
    and p.deleted_at is null
    and (since is null or p.created_at >= since)
  group by h.id, h.name, h.color_hex
  order by total_points desc;
$$ language sql security definer;