drop policy "profiles_read_own" on profiles;

create policy "profiles_read_all" on profiles
  for select to authenticated using (true);