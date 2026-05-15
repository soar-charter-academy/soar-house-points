-- Students table (synced from Aeries)
create table students (
  id uuid primary key default gen_random_uuid(),
  aeries_id text unique not null,
  first_name text not null,
  last_name text not null,
  grade int,
  house_id uuid references houses(id),
  homeroom text,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Class sections (synced from Aeries master schedule)
create table sections (
  id uuid primary key default gen_random_uuid(),
  aeries_id text unique not null,
  name text not null,
  period text,
  staff_id uuid references profiles(id),
  subject text,
  school_year text,
  created_at timestamptz default now()
);

-- Junction: which students are in which sections
create table section_students (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references sections(id),
  student_id uuid not null references students(id),
  unique(section_id, student_id)
);

-- Add student_id foreign key to points table
alter table points 
  add constraint points_student_fk 
  foreign key (student_id) references students(id);

-- RLS policies
alter table students enable row level security;
alter table sections enable row level security;
alter table section_students enable row level security;

-- Authenticated staff can read all students and sections
create policy "students_read" on students
  for select to authenticated using (true);

create policy "sections_read" on sections
  for select to authenticated using (true);

create policy "section_students_read" on section_students
  for select to authenticated using (true);

-- Index for fast student lookups
create index idx_students_house on students(house_id) where active = true;
create index idx_students_grade on students(grade) where active = true;