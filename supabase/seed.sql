-- Seed data de test dashboard va landing page voi Supabase
-- Chay file nay SAU KHI da chay supabase/schema.sql

-- Gan quyen admin cho tai khoan da tao trong Supabase Auth
update public.profiles
set role = 'admin',
    full_name = coalesce(nullif(full_name, ''), 'Global Admin'),
    updated_at = timezone('utc', now())
where email = 'admin@gmail.com';

-- Tables
insert into public.restaurant_tables (name, area, capacity, status, min_spend, notes, sort_order, is_active)
select 'Bàn 01', 'Sảnh chính', 2, 'available', 0, 'Bàn đôi gần cửa sổ', 1, true
where not exists (select 1 from public.restaurant_tables where name = 'Bàn 01');

insert into public.restaurant_tables (name, area, capacity, status, min_spend, notes, sort_order, is_active)
select 'Bàn 02', 'Sảnh chính', 4, 'reserved', 500000, 'Phù hợp gia đình nhỏ', 2, true
where not exists (select 1 from public.restaurant_tables where name = 'Bàn 02');

insert into public.restaurant_tables (name, area, capacity, status, min_spend, notes, sort_order, is_active)
select 'VIP 01', 'Phòng riêng', 8, 'available', 2000000, 'Phòng riêng tiếp khách', 3, true
where not exists (select 1 from public.restaurant_tables where name = 'VIP 01');

insert into public.restaurant_tables (name, area, capacity, status, min_spend, notes, sort_order, is_active)
select 'Sân vườn 01', 'Outdoor', 6, 'occupied', 1000000, 'Khu sân vườn thoáng', 4, true
where not exists (select 1 from public.restaurant_tables where name = 'Sân vườn 01');

-- Menu
insert into public.menu_items (
  name, slug, category, description, price, image_url, prep_time_minutes, spicy_level, is_featured, is_available, sort_order
)
values
  (
    'Cua huỳnh đế',
    'cua-huynh-de',
    'Hải sản cao cấp',
    'Thịt chắc, ngọt đậm, món signature cho bàn tiếp khách hoặc tiệc gia đình.',
    1290000,
    '/assets/dish-king-crab.png',
    25,
    'none',
    true,
    true,
    1
  ),
  (
    'Tôm hùm nướng bơ tỏi',
    'tom-hum-nuong-bo-toi',
    'Hải sản cao cấp',
    'Nướng thơm đậm vị, phù hợp cho cặp đôi hoặc bàn cần món nổi bật.',
    990000,
    '/assets/dish-lobster.png',
    22,
    'mild',
    true,
    true,
    2
  ),
  (
    'Sashimi tổng hợp',
    'sashimi-tong-hop',
    'Món lạnh',
    'Set sashimi tươi, trình bày đẹp mắt cho trải nghiệm dùng bữa sang trọng.',
    680000,
    '/assets/dish-sashimi.png',
    12,
    'none',
    true,
    true,
    3
  ),
  (
    'Ốc hương hấp sả',
    'oc-huong-hap-sa',
    'Khai vị',
    'Món khai vị dễ gọi thêm, hợp cho nhóm gia đình và bạn bè.',
    320000,
    '/assets/dish-snails.png',
    18,
    'none',
    true,
    true,
    4
  ),
  (
    'Cơm chiên hải sản',
    'com-chien-hai-san',
    'Món chính',
    'Món no bụng, dễ ghép combo cho bàn 4-6 khách.',
    240000,
    '/assets/dish-king-crab.png',
    15,
    'none',
    false,
    true,
    5
  )
on conflict (slug) do update
set
  name = excluded.name,
  category = excluded.category,
  description = excluded.description,
  price = excluded.price,
  image_url = excluded.image_url,
  prep_time_minutes = excluded.prep_time_minutes,
  spicy_level = excluded.spicy_level,
  is_featured = excluded.is_featured,
  is_available = excluded.is_available,
  sort_order = excluded.sort_order,
  updated_at = timezone('utc', now());

-- Reservations
insert into public.reservations (
  customer_name, customer_phone, guest_count, reservation_at, status, source, selected_offer, notes, assigned_to, table_id
)
select
  'Nguyễn Minh Anh',
  '0901234567',
  2,
  timezone('utc', now()) + interval '1 day' + interval '19 hours',
  'new',
  'landing-page',
  'Combo 2 người',
  'SEED-DEMO: khách hỏi thêm chỗ ngồi yên tĩnh',
  'admin@gmail.com',
  (select id from public.restaurant_tables where name = 'Bàn 01' limit 1)
where not exists (
  select 1 from public.reservations where notes = 'SEED-DEMO: khách hỏi thêm chỗ ngồi yên tĩnh'
);

insert into public.reservations (
  customer_name, customer_phone, guest_count, reservation_at, status, source, selected_offer, notes, assigned_to, table_id
)
select
  'Trần Quốc Bảo',
  '0912345678',
  4,
  timezone('utc', now()) + interval '2 day' + interval '18 hours',
  'confirmed',
  'zalo',
  'Combo 4 người',
  'SEED-DEMO: cần ghế em bé',
  'admin@gmail.com',
  (select id from public.restaurant_tables where name = 'Bàn 02' limit 1)
where not exists (
  select 1 from public.reservations where notes = 'SEED-DEMO: cần ghế em bé'
);

insert into public.reservations (
  customer_name, customer_phone, guest_count, reservation_at, status, source, selected_offer, notes, assigned_to, table_id
)
select
  'Lê Thanh Hà',
  '0988123456',
  8,
  timezone('utc', now()) + interval '3 day' + interval '20 hours',
  'contacted',
  'phone',
  'Combo tiệc',
  'SEED-DEMO: tiệc sinh nhật gia đình',
  'admin@gmail.com',
  (select id from public.restaurant_tables where name = 'VIP 01' limit 1)
where not exists (
  select 1 from public.reservations where notes = 'SEED-DEMO: tiệc sinh nhật gia đình'
);

-- Voucher leads
insert into public.voucher_leads (phone, status, source, notes)
select '0909000001', 'new', 'landing-page', 'SEED-DEMO: voucher mở landing page'
where not exists (
  select 1 from public.voucher_leads where phone = '0909000001' and notes = 'SEED-DEMO: voucher mở landing page'
);

insert into public.voucher_leads (phone, status, source, notes)
select '0909000002', 'qualified', 'wifi-ads', 'SEED-DEMO: khách đủ điều kiện upsell'
where not exists (
  select 1 from public.voucher_leads where phone = '0909000002' and notes = 'SEED-DEMO: khách đủ điều kiện upsell'
);

insert into public.voucher_leads (phone, status, source, notes)
select '0909000003', 'used', 'zalo', 'SEED-DEMO: đã đổi voucher'
where not exists (
  select 1 from public.voucher_leads where phone = '0909000003' and notes = 'SEED-DEMO: đã đổi voucher'
);

-- Orders + order items
with target_table as (
  select id from public.restaurant_tables where name = 'Bàn 02' limit 1
),
new_order as (
  insert into public.orders (
    table_id,
    customer_name,
    customer_phone,
    status,
    order_channel,
    notes,
    subtotal,
    discount_amount,
    service_charge,
    total_amount
  )
  select
    target_table.id,
    'Trần Quốc Bảo',
    '0912345678',
    'confirmed',
    'admin',
    'SEED-DEMO: đơn test bàn 4 người',
    1970000,
    100000,
    50000,
    1920000
  from target_table
  where not exists (
    select 1 from public.orders where notes = 'SEED-DEMO: đơn test bàn 4 người'
  )
  returning id
)
insert into public.order_items (order_id, menu_item_id, item_name, unit_price, quantity, line_total, notes)
select
  new_order.id,
  menu.id,
  menu.name,
  menu.price,
  items.quantity,
  menu.price * items.quantity,
  'SEED-DEMO'
from new_order
join (
  values
    ('cua-huynh-de', 1),
    ('oc-huong-hap-sa', 1),
    ('com-chien-hai-san', 1),
    ('sashimi-tong-hop', 1)
) as items(slug, quantity)
  on true
join public.menu_items as menu
  on menu.slug = items.slug;

-- Mot so cau hinh tich hop demo
update public.integration_settings
set enabled = true,
    sync_mode = 'manual',
    endpoint = 'https://example.com/webhook/booking',
    notes = 'SEED-DEMO: cấu hình mẫu để test giao diện integrations',
    updated_at = timezone('utc', now())
where code = 'custom-webhook';
