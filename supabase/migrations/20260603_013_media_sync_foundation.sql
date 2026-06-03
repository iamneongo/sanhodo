create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references public.branches(id) on delete set null,
  asset_type text not null default 'image' check (asset_type in ('image', 'video', 'banner', 'logo', 'pdf', 'qr', 'other')),
  category text not null default '',
  title text not null default '',
  file_name text not null default '',
  file_url text not null default '',
  thumbnail_url text not null default '',
  mime_type text not null default '',
  file_size bigint not null default 0,
  width integer,
  height integer,
  duration_seconds integer,
  status text not null default 'active' check (status in ('active', 'archived', 'draft')),
  uploaded_by uuid references public.profiles(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.integration_events (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references public.branches(id) on delete set null,
  provider text not null default 'uvfl',
  event_type text not null,
  source_table text not null default '',
  source_id uuid,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'processing', 'synced', 'failed', 'skipped')),
  retry_count integer not null default 0,
  last_error text not null default '',
  synced_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists media_assets_branch_idx on public.media_assets(branch_id);
create index if not exists media_assets_type_category_idx on public.media_assets(asset_type, category);
create index if not exists integration_events_provider_status_idx on public.integration_events(provider, status);
create index if not exists integration_events_source_idx on public.integration_events(source_table, source_id);

drop trigger if exists set_media_assets_updated_at on public.media_assets;
create trigger set_media_assets_updated_at
  before update on public.media_assets
  for each row execute function public.set_updated_at();

drop trigger if exists set_integration_events_updated_at on public.integration_events;
create trigger set_integration_events_updated_at
  before update on public.integration_events
  for each row execute function public.set_updated_at();

alter table public.media_assets enable row level security;
alter table public.integration_events enable row level security;

drop policy if exists "media_assets_admin_all" on public.media_assets;
create policy "media_assets_admin_all"
on public.media_assets
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "media_assets_public_read_active" on public.media_assets;
create policy "media_assets_public_read_active"
on public.media_assets
for select
to anon, authenticated
using (status = 'active');

drop policy if exists "integration_events_admin_all" on public.integration_events;
create policy "integration_events_admin_all"
on public.integration_events
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
