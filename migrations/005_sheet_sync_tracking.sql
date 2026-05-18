-- Track which app points have been synced to the sheet
alter table points add column sheet_synced_at timestamptz;