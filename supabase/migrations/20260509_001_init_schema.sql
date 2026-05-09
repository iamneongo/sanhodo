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

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  role text not null default 'staff' check (role in ('admin', 'manager', 'staff')),
  phone text,
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
      and role in ('admin', 'manager')
  );
$$;

create table if not exists public.restaurant_tables (
  id uuid primary key default gen_random_uuid(),
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
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_phone text not null,
  guest_count integer not null default 2 check (guest_count > 0),
  reservation_at timestamptz not null,
  status text not null default 'new' check (status in ('new', 'contacted', 'confirmed', 'arrived', 'cancelled')),
  source text not null default 'landing-page',
  selected_offer text not null default '',
  notes text not null default '',
  assigned_to text not null default '',
  last_contact_at timestamptz,
  table_id uuid references public.restaurant_tables(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid references public.reservations(id) on delete set null,
  table_id uuid references public.restaurant_tables(id) on delete set null,
  customer_name text not null,
  customer_phone text not null default '',
  status text not null default 'draft' check (status in ('draft', 'confirmed', 'preparing', 'served', 'paid', 'cancelled')),
  order_channel text not null default 'website' check (order_channel in ('website', 'reservation', 'walk-in', 'phone', 'zalo', 'admin')),
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
  phone text not null,
  status text not null default 'new' check (status in ('new', 'qualified', 'used', 'closed')),
  source text not null default 'landing-page',
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.integration_settings (
  id uuid primary key default gen_random_uuid(),
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

drop trigger if exists set_integration_settings_updated_at on public.integration_settings;
create trigger set_integration_settings_updated_at before update on public.integration_settings for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.restaurant_tables enable row level security;
alter table public.menu_items enable row level security;
alter table public.reservations enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.voucher_leads enable row level security;
alter table public.integration_settings enable row level security;
alter table public.integration_sync_logs enable row level security;

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

insert into public.integration_settings (code, name, category, market, description)
values
  ('misa-cukcuk', 'MISA CukCuk', 'pos', 'Vietnam', 'Phù hợp cho nhà hàng/quán ăn, có nghiệp vụ đặt chỗ và order.'),
  ('sapo-fnb', 'Sapo FnB', 'pos', 'Vietnam', 'Giải pháp bán hàng cho F&B, phù hợp quản lý bàn, hóa đơn, khách hàng.'),
  ('ipos', 'iPOS / FABi', 'pos', 'Vietnam', 'Giải pháp F&B chuyên sâu cho vận hành bán tại chỗ và đa kênh.'),
  ('kiotviet-restaurant', 'KiotViet Nhà hàng', 'pos', 'Vietnam', 'POS cảm ứng cho nhà hàng/cafe, dễ dùng và phổ biến.'),
  ('opera-cloud', 'Oracle Hospitality OPERA Cloud', 'pms', 'Hospitality', 'PMS cho khách sạn/resort, phù hợp đồng bộ dữ liệu lưu trú và F&B.'),
  ('custom-webhook', 'Custom Webhook / Internal POS', 'custom', 'Any', 'Dùng cho POS nội bộ hoặc hệ của đối tác có webhook/API riêng.')
on conflict (code) do nothing;

-- Cập nhật email bên dưới thành email admin thật sau khi tạo user trong Supabase Auth.
-- update public.profiles set role = 'admin' where email = 'admin@example.com';
