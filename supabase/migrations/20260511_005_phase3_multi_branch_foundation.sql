create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  short_name text not null default '',
  address text not null default '',
  phone text not null default '',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

insert into public.branches (id, code, name, short_name, address, phone, is_active, sort_order)
values (
  '11111111-1111-4111-8111-111111111111',
  'main',
  'San Hô Đỏ Hồ Tràm',
  'Hồ Tràm',
  'Đường ven biển, Ấp Hồ Tràm, Xuyên Mộc, Bà Rịa - Vũng Tàu',
  '0814645999',
  true,
  1
)
on conflict (code) do update
set
  name = excluded.name,
  short_name = excluded.short_name,
  address = excluded.address,
  phone = excluded.phone,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order,
  updated_at = timezone('utc', now());

alter table public.profiles
  add column if not exists branch_id uuid references public.branches(id) on delete set null;

update public.profiles
set branch_id = '11111111-1111-4111-8111-111111111111'
where branch_id is null
  and coalesce(branch_code, 'main') = 'main';

alter table public.restaurant_tables
  add column if not exists branch_id uuid references public.branches(id) on delete set null;

alter table public.menu_items
  add column if not exists branch_id uuid references public.branches(id) on delete set null;

alter table public.reservations
  add column if not exists branch_id uuid references public.branches(id) on delete set null;

alter table public.orders
  add column if not exists branch_id uuid references public.branches(id) on delete set null;

alter table public.voucher_leads
  add column if not exists branch_id uuid references public.branches(id) on delete set null;

alter table public.integration_settings
  add column if not exists branch_id uuid references public.branches(id) on delete set null;

update public.restaurant_tables
set branch_id = '11111111-1111-4111-8111-111111111111'
where branch_id is null;

update public.menu_items
set branch_id = '11111111-1111-4111-8111-111111111111'
where branch_id is null;

update public.reservations
set branch_id = '11111111-1111-4111-8111-111111111111'
where branch_id is null;

update public.orders
set branch_id = '11111111-1111-4111-8111-111111111111'
where branch_id is null;

update public.voucher_leads
set branch_id = '11111111-1111-4111-8111-111111111111'
where branch_id is null;

update public.integration_settings
set branch_id = '11111111-1111-4111-8111-111111111111'
where branch_id is null;

create table if not exists public.branch_staff_assignments (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'staff' check (role in ('super_admin', 'admin', 'manager', 'branch_manager', 'staff', 'driver')),
  is_primary boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (branch_id, profile_id)
);

insert into public.branch_staff_assignments (branch_id, profile_id, role, is_primary)
select
  '11111111-1111-4111-8111-111111111111',
  id,
  role,
  true
from public.profiles
where not exists (
  select 1
  from public.branch_staff_assignments assignments
  where assignments.branch_id = '11111111-1111-4111-8111-111111111111'
    and assignments.profile_id = public.profiles.id
);

alter table public.branches enable row level security;
alter table public.branch_staff_assignments enable row level security;

drop policy if exists "branches_public_select" on public.branches;
create policy "branches_public_select"
on public.branches for select
to anon, authenticated
using (is_active = true or public.is_admin());

drop policy if exists "branches_admin_all" on public.branches;
create policy "branches_admin_all"
on public.branches for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "branch_staff_assignments_admin_all" on public.branch_staff_assignments;
create policy "branch_staff_assignments_admin_all"
on public.branch_staff_assignments for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
