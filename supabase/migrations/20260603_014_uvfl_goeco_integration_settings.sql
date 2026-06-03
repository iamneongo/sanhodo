insert into public.integration_settings (
  code,
  name,
  category,
  market,
  description,
  enabled,
  sync_mode,
  endpoint,
  notes
)
values
  (
    'uvfl',
    'UVFL API Gateway',
    'uvfl',
    'Ecosystem',
    'Đồng bộ booking, order, payment, voucher, referral và loyalty sang UVFL Core.',
    false,
    'manual',
    '',
    'Nhập endpoint/API key chính thức trước khi bật đồng bộ.'
  ),
  (
    'goeco',
    'GOECO Sync Gateway',
    'goeco',
    'Mobility',
    'Đồng bộ referral tài xế, booking, ride/order event và dữ liệu vận hành liên quan GOECO.',
    false,
    'manual',
    '',
    'Nhập endpoint/API key chính thức trước khi bật đồng bộ.'
  )
on conflict (code) do update
set
  name = excluded.name,
  category = excluded.category,
  market = excluded.market,
  description = excluded.description,
  notes = case
    when public.integration_settings.notes = '' then excluded.notes
    else public.integration_settings.notes
  end,
  updated_at = timezone('utc', now());
