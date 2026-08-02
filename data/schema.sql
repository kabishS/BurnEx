-- =========================================================================
-- BURN-EX — Supabase schema
-- Run this once in your project's SQL editor (Dashboard → SQL Editor → New
-- query), then paste the whole file and hit Run.
-- =========================================================================

create table if not exists gyms (
  code            text primary key,
  name            text not null,
  owner_username  text not null,
  created         bigint not null
);

create table if not exists users (
  username  text primary key,
  password  text not null,
  role      text not null check (role in ('admin','member')),
  name      text,
  email     text,
  age       int,
  gender    text,
  weight    float8,
  height    float8,
  goal      int,
  gym_code  text references gyms(code) on delete set null,
  joined    bigint
);

create table if not exists workouts (
  id        text primary key,
  username  text references users(username) on delete cascade,
  date      bigint not null,
  exercise  text not null,
  reps      int,
  duration  int,
  calories  float8
);

create table if not exists walks (
  id          text primary key,
  username    text references users(username) on delete cascade,
  date        bigint not null,
  duration    int,
  distance    float8,
  pace        text,
  calories    float8,
  start_place text,
  end_place   text,
  start_lat   float8,
  start_lng   float8,
  end_lat     float8,
  end_lng     float8
);

-- -------------------------------------------------------------------------
-- Row Level Security
-- Burn-Ex authenticates with its own username/password table rather than
-- Supabase Auth, so there's no auth.uid() to scope policies to. These
-- policies simply allow the app's public (anon) key to read/write all
-- rows — the same trust model as the original localStorage version,
-- just shared across devices now instead of per-browser. If you plan to
-- put this in front of real users, swap this out for Supabase Auth and
-- policies scoped to auth.uid() instead.
-- -------------------------------------------------------------------------
alter table gyms enable row level security;
alter table users enable row level security;
alter table workouts enable row level security;
alter table walks enable row level security;

create policy "public read/write gyms"     on gyms     for all using (true) with check (true);
create policy "public read/write users"    on users    for all using (true) with check (true);
create policy "public read/write workouts" on workouts for all using (true) with check (true);
create policy "public read/write walks"    on walks    for all using (true) with check (true);
