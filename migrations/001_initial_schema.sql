-- 001_initial_schema.sql
-- Initial database setup: houses, profiles, points, auth trigger, RLS policies

-- Houses table
create table houses (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color_hex text not null,
  created_at timestamptz default now()
);

-- Seed the five houses
insert into houses (name, color_hex) values
  ('Kiburi',   '#00935c'),
  ('Fierte',   '#0073a5'),
  ('Orgullo',  '#582831'),
  ('Superbia', '#ffb70c'),
  ('Hokori',   '#4f3f83');

-- Staff profiles (linked to Supabase Auth)
create table profiles (
  id uuid primary key references auth.users(id),
  email text unique,
  display_name text,
  role text default 'teacher',
  active boolean default true,
  created_at timestamptz default now()
);

-- Points log (append-only)
create table points (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null references houses(id),
  staff_id uuid not null references profiles(id),
  student_id uuid,
  value int not null default 1 check (value > 0),
  category text,
  notes text,
  deleted_at timestamptz,
  created_at timestamptz default now()
);

-- Index for fast house totals
create index idx_points_house on points(house_id) where deleted_at is null;

-- Auto-create a profile when someone signs up (staff only)
-- Numeric email prefixes (student accounts) are skipped
create or replace function public.handle_new_user()
returns trigger as $$
declare
  email_prefix text;
begin
  email_prefix := split_part(new.email, '@', 1);

  -- Only create profiles for alpha usernames (staff)
  -- Skip numeric usernames (students)
  if email_prefix ~ '^[0-9]+$' then
    return new;
  end if;

  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row Level Security
alter table houses enable row level security;
alter table profiles enable row level security;
alter table points enable row level security;

-- Anyone authenticated can read houses
create policy "houses_read" on houses
  for select to authenticated using (true);

-- Users can read their own profile
create policy "profiles_read_own" on profiles
  for select to authenticated using (auth.uid() = id);

-- Authenticated users can insert points
create policy "points_insert" on points
  for insert to authenticated
  with check (auth.uid() = staff_id);

-- Users can read all non-deleted points
create policy "points_read" on points
  for select to authenticated
  using (deleted_at is null);

-- Users can soft-delete only their own points
create policy "points_soft_delete" on points
  for update to authenticated
  using (auth.uid() = staff_id)
  with check (auth.uid() = staff_id);