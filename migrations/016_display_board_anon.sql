-- Allow anonymous access for the Vivi display board
create policy "houses_read_anon" on houses
  for select to anon using (true);

grant execute on function get_house_totals_since to anon;