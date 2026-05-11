create table if not exists public.travel_partners (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references public.branches(id) on delete set null,
  code text not null unique,
  name text not null,
  partner_type text not null default 'agency' check (partner_type in ('agency', 'hdv', 'hotel', 'corporate')),
  contact_name text not null default '',
  phone text not null default '',
  email text not null default '',
  commission_type text not null default 'percent' check (commission_type in ('percent', 'amount')),
  commission_value numeric(12,2) not null default 0,
  status text not null default 'active' check (status in ('active', 'inactive', 'paused')),
  notes text not null default '',
  contract_start_at timestamptz,
  contract_end_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.partner_contracts (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.travel_partners(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  title text not null,
  discount_percent numeric(12,2) not null default 0,
  commission_percent numeric(12,2) not null default 0,
  payment_terms text not null default '',
  status text not null default 'draft' check (status in ('draft', 'active', 'expired', 'terminated')),
  starts_at timestamptz,
  ends_at timestamptz,
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.partner_bookings (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.travel_partners(id) on delete cascade,
  reservation_id uuid references public.reservations(id) on delete set null,
  branch_id uuid references public.branches(id) on delete set null,
  code text not null unique,
  customer_name text not null,
  customer_phone text not null default '',
  group_size integer not null default 2,
  booking_at timestamptz,
  package_name text not null default '',
  menu_budget numeric(12,0) not null default 0,
  discount_amount numeric(12,0) not null default 0,
  commission_amount numeric(12,0) not null default 0,
  status text not null default 'lead' check (status in ('lead', 'confirmed', 'arrived', 'completed', 'cancelled')),
  guest_manifest_url text not null default '',
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists set_travel_partners_updated_at on public.travel_partners;
create trigger set_travel_partners_updated_at before update on public.travel_partners for each row execute procedure public.set_updated_at();

drop trigger if exists set_partner_contracts_updated_at on public.partner_contracts;
create trigger set_partner_contracts_updated_at before update on public.partner_contracts for each row execute procedure public.set_updated_at();

drop trigger if exists set_partner_bookings_updated_at on public.partner_bookings;
create trigger set_partner_bookings_updated_at before update on public.partner_bookings for each row execute procedure public.set_updated_at();

alter table public.travel_partners enable row level security;
alter table public.partner_contracts enable row level security;
alter table public.partner_bookings enable row level security;

drop policy if exists "travel_partners_admin_all" on public.travel_partners;
create policy "travel_partners_admin_all"
on public.travel_partners for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "partner_contracts_admin_all" on public.partner_contracts;
create policy "partner_contracts_admin_all"
on public.partner_contracts for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "partner_bookings_admin_all" on public.partner_bookings;
create policy "partner_bookings_admin_all"
on public.partner_bookings for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

insert into public.travel_partners (
  branch_id,
  code,
  name,
  partner_type,
  contact_name,
  phone,
  email,
  commission_type,
  commission_value,
  status,
  notes
)
values (
  '11111111-1111-4111-8111-111111111111',
  'HDV-HOTRAM-01',
  'Đối tác HDV Hồ Tràm',
  'hdv',
  'Nguyễn Hướng Dẫn',
  '0909555777',
  'hdv-hotram@example.com',
  'percent',
  12,
  'active',
  'Seed đối tác để test booking đoàn và hợp đồng.'
)
on conflict (code) do nothing;
