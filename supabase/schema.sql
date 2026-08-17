-- Paste this into your new Supabase project's SQL Editor and run it once.
--
-- Two tables, both single-row-ish, matching this app's scope: one phone,
-- one player, no login system. RLS is left off on purpose — there's no
-- auth in this app at all (a deliberate simplicity choice from day one),
-- so the anon key can read/write both tables directly from the browser.
-- That means anyone with the URL + anon key could read or overwrite this
-- data. Fine for a private single-user hobby project; would need real
-- policies before this app ever has a second real user typing real data.

create table if not exists player_state (
  id int primary key default 1,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  constraint player_state_singleton check (id = 1)
);

create table if not exists push_subscription (
  id int primary key default 1,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  updated_at timestamptz not null default now(),
  constraint push_subscription_singleton check (id = 1)
);

-- Tracks the last trigger actually sent, so the daily cron doesn't need its
-- own separate table just to avoid re-sending the identical notification
-- every single day it stays true.
create table if not exists push_log (
  id int primary key default 1,
  last_trigger text,
  last_sent_at timestamptz,
  constraint push_log_singleton check (id = 1)
);

alter table player_state disable row level security;
alter table push_subscription disable row level security;
alter table push_log disable row level security;
