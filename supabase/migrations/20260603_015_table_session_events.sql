create table if not exists public.table_session_events (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references public.branches(id) on delete set null,
  table_id uuid references public.restaurant_tables(id) on delete cascade,
  reservation_id uuid references public.reservations(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  event_type text not null default 'status_change',
  from_status text,
  to_status text not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_minutes integer,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  actor_name text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists table_session_events_branch_idx
  on public.table_session_events(branch_id, created_at desc);

create index if not exists table_session_events_table_idx
  on public.table_session_events(table_id, created_at desc);

create index if not exists table_session_events_status_idx
  on public.table_session_events(to_status, created_at desc);
