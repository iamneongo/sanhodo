alter table public.reservations
  add column if not exists driver_id uuid;

alter table public.reservations
  add column if not exists referral_code text not null default '';

alter table public.orders
  add column if not exists driver_id uuid;

alter table public.orders
  add column if not exists referral_code text not null default '';

create table if not exists public.drivers (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references public.branches(id) on delete set null,
  code text not null unique,
  full_name text not null,
  phone text not null unique,
  vehicle_type text not null default '',
  status text not null default 'active' check (status in ('active', 'inactive', 'blocked')),
  referral_code text not null unique,
  commission_rate numeric(12,2) not null default 5,
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.driver_referrals (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references public.branches(id) on delete set null,
  driver_id uuid references public.drivers(id) on delete cascade,
  reservation_id uuid references public.reservations(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  referred_name text not null default '',
  referred_phone text not null default '',
  referral_code text not null default '',
  status text not null default 'new' check (status in ('new', 'qualified', 'converted', 'paid', 'cancelled')),
  commission_base_amount numeric(12,0) not null default 0,
  commission_amount numeric(12,0) not null default 0,
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.driver_commission_transactions (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references public.branches(id) on delete set null,
  driver_id uuid references public.drivers(id) on delete cascade,
  referral_id uuid references public.driver_referrals(id) on delete set null,
  reservation_id uuid references public.reservations(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'paid', 'cancelled')),
  commission_amount numeric(12,0) not null default 0,
  payout_method text not null default '',
  paid_at timestamptz,
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'reservations_driver_id_fkey'
  ) then
    alter table public.reservations
      add constraint reservations_driver_id_fkey
      foreign key (driver_id) references public.drivers(id) on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'orders_driver_id_fkey'
  ) then
    alter table public.orders
      add constraint orders_driver_id_fkey
      foreign key (driver_id) references public.drivers(id) on delete set null;
  end if;
end $$;

drop trigger if exists set_drivers_updated_at on public.drivers;
create trigger set_drivers_updated_at before update on public.drivers for each row execute procedure public.set_updated_at();

drop trigger if exists set_driver_referrals_updated_at on public.driver_referrals;
create trigger set_driver_referrals_updated_at before update on public.driver_referrals for each row execute procedure public.set_updated_at();

drop trigger if exists set_driver_commissions_updated_at on public.driver_commission_transactions;
create trigger set_driver_commissions_updated_at before update on public.driver_commission_transactions for each row execute procedure public.set_updated_at();

alter table public.drivers enable row level security;
alter table public.driver_referrals enable row level security;
alter table public.driver_commission_transactions enable row level security;

drop policy if exists "drivers_admin_all" on public.drivers;
create policy "drivers_admin_all"
on public.drivers for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "driver_referrals_admin_all" on public.driver_referrals;
create policy "driver_referrals_admin_all"
on public.driver_referrals for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "driver_commissions_admin_all" on public.driver_commission_transactions;
create policy "driver_commissions_admin_all"
on public.driver_commission_transactions for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

insert into public.drivers (
  branch_id,
  code,
  full_name,
  phone,
  vehicle_type,
  status,
  referral_code,
  commission_rate,
  notes
)
values (
  '11111111-1111-4111-8111-111111111111',
  'DRV-HOTRAM-01',
  'Tài xế Hồ Tràm 01',
  '0908111222',
  'Xe 7 chỗ',
  'active',
  'DRV-HOTRAM-01',
  5,
  'Seed driver để test referral và commission'
)
on conflict (code) do nothing;
