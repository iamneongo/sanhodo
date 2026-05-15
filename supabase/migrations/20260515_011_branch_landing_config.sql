alter table public.branches
  add column if not exists landing_config jsonb not null default '{}'::jsonb;
