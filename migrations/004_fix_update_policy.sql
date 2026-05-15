drop policy "points_read" on points;

create policy "points_read" on points
  for select to authenticated
  using (deleted_at is null or auth.uid() = staff_id);