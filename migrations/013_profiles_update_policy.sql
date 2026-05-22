create policy "profiles_update_own" on profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);