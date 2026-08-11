-- =========================================================================
-- BURN-EX — add weekly task tracking
-- Run this once in your Supabase SQL editor if you already ran data/schema.sql
-- before this table existed. (If you're setting up fresh, data/schema.sql
-- already includes this — just run that one file instead.)
-- =========================================================================

create table if not exists task_completions (
  id        text primary key,
  username  text references users(username) on delete cascade,
  task_date text not null,   -- 'YYYY-MM-DD', local calendar date the task belongs to
  unique(username, task_date)
);

alter table task_completions enable row level security;

create policy "public read/write task_completions" on task_completions for all using (true) with check (true);
