alter table public.voucher_leads
  add column if not exists campaign_id uuid;

alter table public.voucher_leads
  add column if not exists customer_profile_id uuid;

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
end $$;

drop trigger if exists set_voucher_campaigns_updated_at on public.voucher_campaigns;
create trigger set_voucher_campaigns_updated_at before update on public.voucher_campaigns for each row execute procedure public.set_updated_at();

drop trigger if exists set_customer_profiles_updated_at on public.customer_profiles;
create trigger set_customer_profiles_updated_at before update on public.customer_profiles for each row execute procedure public.set_updated_at();

drop trigger if exists set_voucher_redemptions_updated_at on public.voucher_redemptions;
create trigger set_voucher_redemptions_updated_at before update on public.voucher_redemptions for each row execute procedure public.set_updated_at();

alter table public.voucher_campaigns enable row level security;
alter table public.customer_profiles enable row level security;
alter table public.voucher_redemptions enable row level security;

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

insert into public.customer_profiles (phone, full_name, branch_id, last_seen_at, notes)
select distinct
  phone,
  '',
  coalesce(branch_id, '11111111-1111-4111-8111-111111111111'),
  timezone('utc', now()),
  'Backfill from voucher leads'
from public.voucher_leads
where coalesce(phone, '') <> ''
on conflict (phone) do nothing;

update public.voucher_leads as leads
set customer_profile_id = profiles.id
from public.customer_profiles as profiles
where leads.customer_profile_id is null
  and leads.phone = profiles.phone;
