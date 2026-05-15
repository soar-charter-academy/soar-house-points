-- Track where each point originated (app or sheet)
alter table points add column source text default 'app';