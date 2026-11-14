-- The journal's three tables, the same shape journal.py has used in readings.json.
-- Run once in Supabase: SQL Editor, New query, paste, Run.

create table readings (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,  -- the Auth0 sub, e.g. auth0|6a0b...
  spread_id text not null,
  created_at timestamptz not null default now()
);

create index readings_by_user on readings (user_id, created_at desc);

create table reading_cards (
  reading_id uuid not null references readings (id) on delete cascade,
  position int not null,
  position_id text not null,
  card_id text not null,
  reversed boolean not null,
  primary key (reading_id, position)
);

create table entries (
  id uuid primary key default gen_random_uuid(),
  reading_id uuid not null references readings (id) on delete cascade,
  type text not null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

-- One reflection per reading: saving again updates it.
create unique index one_reflection_per_reading on entries (reading_id) where type = 'interpretation';

-- Supabase also serves every table over its own public API, keyed by the project's anon key.
-- Row level security with no policies shuts that door. Our server connects as the database owner,
-- which RLS does not apply to, and filters by user_id itself.
alter table readings enable row level security;
alter table reading_cards enable row level security;
alter table entries enable row level security;
