alter table public.menu_items
  add column if not exists availability_status text not null default 'available';

alter table public.menu_items
  add column if not exists season_note text not null default '';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'menu_items_availability_status_check'
  ) then
    alter table public.menu_items
      add constraint menu_items_availability_status_check
      check (availability_status in ('available', 'low_stock', 'seasonal', 'sold_out'));
  end if;
end $$;

alter table public.reservations
  add column if not exists confirmation_channel text not null default 'zalo';

alter table public.reservations
  add column if not exists confirmation_sent_at timestamptz;

alter table public.voucher_leads
  add column if not exists voucher_code text;

alter table public.voucher_leads
  add column if not exists voucher_title text not null default '';

alter table public.voucher_leads
  add column if not exists voucher_discount_type text not null default 'percent';

alter table public.voucher_leads
  add column if not exists voucher_discount_value numeric(12,0) not null default 0;

alter table public.voucher_leads
  add column if not exists voucher_description text not null default '';

alter table public.voucher_leads
  add column if not exists expires_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'voucher_leads_voucher_discount_type_check'
  ) then
    alter table public.voucher_leads
      add constraint voucher_leads_voucher_discount_type_check
      check (voucher_discount_type in ('percent', 'amount'));
  end if;
end $$;
