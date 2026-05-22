alter table profiles
add column house_id uuid references houses(id);