create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

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

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  role text not null default 'staff' check (role in ('super_admin', 'admin', 'manager', 'branch_manager', 'staff', 'driver')),
  branch_id uuid references public.branches(id) on delete set null,
  branch_code text not null default 'main',
  phone text,
  last_login_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = coalesce(excluded.full_name, public.profiles.full_name),
      updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

insert into public.profiles (id, email, full_name)
select
  users.id,
  users.email,
  coalesce(users.raw_user_meta_data ->> 'full_name', split_part(users.email, '@', 1))
from auth.users as users
on conflict (id) do update
set email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    updated_at = timezone('utc', now());


create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('super_admin', 'admin', 'manager', 'branch_manager')
  );
$$;

create table if not exists public.restaurant_tables (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references public.branches(id) on delete set null,
  name text not null,
  area text not null default 'Sảnh chính',
  capacity integer not null default 2 check (capacity > 0),
  status text not null default 'available' check (status in ('available', 'reserved', 'occupied', 'cleaning', 'inactive')),
  min_spend numeric(12,0) not null default 0,
  notes text not null default '',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references public.branches(id) on delete set null,
  name text not null,
  slug text not null unique,
  category text not null default 'Hải sản',
  description text not null default '',
  price numeric(12,0) not null default 0,
  image_url text not null default '',
  prep_time_minutes integer not null default 15,
  spicy_level text not null default 'none' check (spicy_level in ('none', 'mild', 'medium', 'hot')),
  is_featured boolean not null default false,
  is_available boolean not null default true,
  availability_status text not null default 'available' check (availability_status in ('available', 'low_stock', 'seasonal', 'sold_out')),
  season_note text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references public.branches(id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  guest_count integer not null default 2 check (guest_count > 0),
  reservation_at timestamptz not null,
  status text not null default 'new' check (status in ('new', 'contacted', 'confirmed', 'arrived', 'cancelled')),
  source text not null default 'landing-page',
  selected_offer text not null default '',
  driver_id uuid,
  referral_code text not null default '',
  notes text not null default '',
  assigned_to text not null default '',
  last_contact_at timestamptz,
  confirmation_channel text not null default 'zalo',
  confirmation_sent_at timestamptz,
  table_id uuid references public.restaurant_tables(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references public.branches(id) on delete set null,
  reservation_id uuid references public.reservations(id) on delete set null,
  table_id uuid references public.restaurant_tables(id) on delete set null,
  customer_name text not null,
  customer_phone text not null default '',
  status text not null default 'draft' check (status in ('draft', 'confirmed', 'preparing', 'served', 'paid', 'cancelled')),
  order_channel text not null default 'website' check (order_channel in ('website', 'reservation', 'walk-in', 'phone', 'zalo', 'admin')),
  driver_id uuid,
  referral_code text not null default '',
  notes text not null default '',
  subtotal numeric(12,0) not null default 0,
  discount_amount numeric(12,0) not null default 0,
  service_charge numeric(12,0) not null default 0,
  total_amount numeric(12,0) not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  item_name text not null,
  unit_price numeric(12,0) not null default 0,
  quantity integer not null default 1 check (quantity > 0),
  line_total numeric(12,0) not null default 0,
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.voucher_leads (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references public.branches(id) on delete set null,
  campaign_id uuid,
  customer_profile_id uuid,
  phone text not null,
  status text not null default 'new' check (status in ('new', 'qualified', 'used', 'closed')),
  source text not null default 'landing-page',
  voucher_code text,
  voucher_title text not null default '',
  voucher_discount_type text not null default 'percent' check (voucher_discount_type in ('percent', 'amount')),
  voucher_discount_value numeric(12,0) not null default 0,
  voucher_description text not null default '',
  expires_at timestamptz,
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.voucher_campaigns (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references public.branches(id) on delete set null,
  code text not null unique,
  name text not null,
  title text not null,
  description text not null default '',
  discount_type text not null default 'percent' check (discount_type in ('percent', 'amount')),
  discount_value numeric(12,0) not null default 0,
  min_order_value numeric(12,0) not null default 0,
  valid_days integer not null default 14,
  usage_limit_total integer not null default 0,
  usage_limit_per_phone integer not null default 1,
  auto_issue boolean not null default true,
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.customer_profiles (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references public.branches(id) on delete set null,
  phone text not null unique,
  full_name text not null default '',
  email text not null default '',
  tier text not null default 'member' check (tier in ('member', 'silver', 'gold', 'vip')),
  loyalty_points integer not null default 0,
  total_spent numeric(12,0) not null default 0,
  visit_count integer not null default 0,
  last_seen_at timestamptz,
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.voucher_redemptions (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references public.branches(id) on delete set null,
  voucher_lead_id uuid references public.voucher_leads(id) on delete set null,
  campaign_id uuid references public.voucher_campaigns(id) on delete set null,
  customer_profile_id uuid references public.customer_profiles(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  status text not null default 'redeemed' check (status in ('redeemed', 'reversed')),
  amount_saved numeric(12,0) not null default 0,
  spend_amount numeric(12,0) not null default 0,
  loyalty_points_awarded integer not null default 0,
  redeemed_by text not null default '',
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

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
    select 1 from pg_constraint where conname = 'voucher_leads_campaign_id_fkey'
  ) then
    alter table public.voucher_leads
      add constraint voucher_leads_campaign_id_fkey
      foreign key (campaign_id) references public.voucher_campaigns(id) on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'voucher_leads_customer_profile_id_fkey'
  ) then
    alter table public.voucher_leads
      add constraint voucher_leads_customer_profile_id_fkey
      foreign key (customer_profile_id) references public.customer_profiles(id) on delete set null;
  end if;

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

create table if not exists public.integration_settings (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references public.branches(id) on delete set null,
  code text not null unique,
  name text not null,
  category text not null,
  market text not null default 'Vietnam',
  description text not null default '',
  enabled boolean not null default false,
  sync_mode text not null default 'manual' check (sync_mode in ('manual', 'auto')),
  endpoint text not null default '',
  api_key text not null default '',
  api_secret text not null default '',
  location_code text not null default '',
  tenant_code text not null default '',
  notes text not null default '',
  mapping jsonb not null default '{"customerNameField":"name","customerPhoneField":"phone","guestCountField":"guests","bookingTimeField":"datetime","noteField":"notes"}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.integration_sync_logs (
  id uuid primary key default gen_random_uuid(),
  integration_code text not null,
  integration_name text not null,
  reservation_id uuid references public.reservations(id) on delete set null,
  ok boolean not null default false,
  status integer not null default 0,
  endpoint text not null default '',
  response_preview text not null default '',
  created_at timestamptz not null default timezone('utc', now())
);

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

drop trigger if exists set_branches_updated_at on public.branches;
create trigger set_branches_updated_at before update on public.branches for each row execute procedure public.set_updated_at();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();

drop trigger if exists set_tables_updated_at on public.restaurant_tables;
create trigger set_tables_updated_at before update on public.restaurant_tables for each row execute procedure public.set_updated_at();

drop trigger if exists set_menu_items_updated_at on public.menu_items;
create trigger set_menu_items_updated_at before update on public.menu_items for each row execute procedure public.set_updated_at();

drop trigger if exists set_reservations_updated_at on public.reservations;
create trigger set_reservations_updated_at before update on public.reservations for each row execute procedure public.set_updated_at();

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at before update on public.orders for each row execute procedure public.set_updated_at();

drop trigger if exists set_order_items_updated_at on public.order_items;
create trigger set_order_items_updated_at before update on public.order_items for each row execute procedure public.set_updated_at();

drop trigger if exists set_voucher_leads_updated_at on public.voucher_leads;
create trigger set_voucher_leads_updated_at before update on public.voucher_leads for each row execute procedure public.set_updated_at();

drop trigger if exists set_voucher_campaigns_updated_at on public.voucher_campaigns;
create trigger set_voucher_campaigns_updated_at before update on public.voucher_campaigns for each row execute procedure public.set_updated_at();

drop trigger if exists set_customer_profiles_updated_at on public.customer_profiles;
create trigger set_customer_profiles_updated_at before update on public.customer_profiles for each row execute procedure public.set_updated_at();

drop trigger if exists set_voucher_redemptions_updated_at on public.voucher_redemptions;
create trigger set_voucher_redemptions_updated_at before update on public.voucher_redemptions for each row execute procedure public.set_updated_at();

drop trigger if exists set_drivers_updated_at on public.drivers;
create trigger set_drivers_updated_at before update on public.drivers for each row execute procedure public.set_updated_at();

drop trigger if exists set_driver_referrals_updated_at on public.driver_referrals;
create trigger set_driver_referrals_updated_at before update on public.driver_referrals for each row execute procedure public.set_updated_at();

drop trigger if exists set_driver_commissions_updated_at on public.driver_commission_transactions;
create trigger set_driver_commissions_updated_at before update on public.driver_commission_transactions for each row execute procedure public.set_updated_at();

drop trigger if exists set_integration_settings_updated_at on public.integration_settings;
create trigger set_integration_settings_updated_at before update on public.integration_settings for each row execute procedure public.set_updated_at();

drop trigger if exists set_branch_staff_assignments_updated_at on public.branch_staff_assignments;
create trigger set_branch_staff_assignments_updated_at before update on public.branch_staff_assignments for each row execute procedure public.set_updated_at();

alter table public.branches enable row level security;
alter table public.profiles enable row level security;
alter table public.restaurant_tables enable row level security;
alter table public.menu_items enable row level security;
alter table public.reservations enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.voucher_leads enable row level security;
alter table public.voucher_campaigns enable row level security;
alter table public.customer_profiles enable row level security;
alter table public.voucher_redemptions enable row level security;
alter table public.drivers enable row level security;
alter table public.driver_referrals enable row level security;
alter table public.driver_commission_transactions enable row level security;
alter table public.integration_settings enable row level security;
alter table public.integration_sync_logs enable row level security;
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

drop policy if exists "profiles_admin_select" on public.profiles;
create policy "profiles_admin_select"
on public.profiles for select
to authenticated
using (public.is_admin() or id = auth.uid());

drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update"
on public.profiles for update
to authenticated
using (public.is_admin() or id = auth.uid())
with check (public.is_admin() or id = auth.uid());

drop policy if exists "tables_admin_all" on public.restaurant_tables;
create policy "tables_admin_all"
on public.restaurant_tables for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "menu_public_select" on public.menu_items;
create policy "menu_public_select"
on public.menu_items for select
to anon, authenticated
using (is_available = true or public.is_admin());

drop policy if exists "menu_admin_mutate" on public.menu_items;
create policy "menu_admin_mutate"
on public.menu_items for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "reservations_public_insert" on public.reservations;
create policy "reservations_public_insert"
on public.reservations for insert
to anon, authenticated
with check (true);

drop policy if exists "reservations_admin_all" on public.reservations;
create policy "reservations_admin_all"
on public.reservations for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "orders_admin_all" on public.orders;
create policy "orders_admin_all"
on public.orders for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "orders_public_insert" on public.orders;
create policy "orders_public_insert"
on public.orders for insert
to anon, authenticated
with check (true);

drop policy if exists "order_items_admin_all" on public.order_items;
create policy "order_items_admin_all"
on public.order_items for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "order_items_public_insert" on public.order_items;
create policy "order_items_public_insert"
on public.order_items for insert
to anon, authenticated
with check (true);

drop policy if exists "vouchers_public_insert" on public.voucher_leads;
create policy "vouchers_public_insert"
on public.voucher_leads for insert
to anon, authenticated
with check (true);

drop policy if exists "vouchers_admin_all" on public.voucher_leads;
create policy "vouchers_admin_all"
on public.voucher_leads for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "voucher_campaigns_public_select" on public.voucher_campaigns;
create policy "voucher_campaigns_public_select"
on public.voucher_campaigns for select
to anon, authenticated
using (is_active = true or public.is_admin());

drop policy if exists "voucher_campaigns_admin_all" on public.voucher_campaigns;
create policy "voucher_campaigns_admin_all"
on public.voucher_campaigns for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "customer_profiles_admin_all" on public.customer_profiles;
create policy "customer_profiles_admin_all"
on public.customer_profiles for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "voucher_redemptions_admin_all" on public.voucher_redemptions;
create policy "voucher_redemptions_admin_all"
on public.voucher_redemptions for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

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

drop policy if exists "integrations_admin_all" on public.integration_settings;
create policy "integrations_admin_all"
on public.integration_settings for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "integration_logs_admin_all" on public.integration_sync_logs;
create policy "integration_logs_admin_all"
on public.integration_sync_logs for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "branch_staff_assignments_admin_all" on public.branch_staff_assignments;
create policy "branch_staff_assignments_admin_all"
on public.branch_staff_assignments for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

insert into public.integration_settings (code, name, category, market, description)
values
  ('misa-cukcuk', 'MISA CukCuk', 'pos', 'Vietnam', 'Phù hợp cho nhà hàng/quán ăn, có nghiệp vụ đặt chỗ và order.'),
  ('sapo-fnb', 'Sapo FnB', 'pos', 'Vietnam', 'Giải pháp bán hàng cho F&B, phù hợp quản lý bàn, hóa đơn, khách hàng.'),
  ('ipos', 'iPOS / FABi', 'pos', 'Vietnam', 'Giải pháp F&B chuyên sâu cho vận hành bán tại chỗ và đa kênh.'),
  ('kiotviet-restaurant', 'KiotViet Nhà hàng', 'pos', 'Vietnam', 'POS cảm ứng cho nhà hàng/cafe, dễ dùng và phổ biến.'),
  ('opera-cloud', 'Oracle Hospitality OPERA Cloud', 'pms', 'Hospitality', 'PMS cho khách sạn/resort, phù hợp đồng bộ dữ liệu lưu trú và F&B.'),
  ('custom-webhook', 'Custom Webhook / Internal POS', 'custom', 'Any', 'Dùng cho POS nội bộ hoặc hệ của đối tác có webhook/API riêng.')
on conflict (code) do nothing;

insert into public.voucher_campaigns (
  branch_id,
  code,
  name,
  title,
  description,
  discount_type,
  discount_value,
  min_order_value,
  valid_days,
  usage_limit_total,
  usage_limit_per_phone,
  auto_issue,
  is_active,
  sort_order
)
values (
  '11111111-1111-4111-8111-111111111111',
  'early-booking',
  'Early booking',
  'Ưu đãi đặt bàn sớm',
  'Giảm 10% cho hóa đơn hải sản khi đặt bàn trước và xác nhận qua hotline/Zalo.',
  'percent',
  10,
  0,
  14,
  0,
  1,
  true,
  true,
  1
)
on conflict (code) do nothing;

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

-- Cập nhật email bên dưới thành email admin thật sau khi tạo user trong Supabase Auth.
-- update public.profiles set role = 'admin' where email = 'admin@example.com';
