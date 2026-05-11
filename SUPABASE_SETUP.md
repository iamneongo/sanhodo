# Supabase Setup

## 1. Chay schema
- Mo Supabase Dashboard
- Vao SQL Editor
- Chay toan bo file `supabase/schema.sql`
- File nay hien da bao gom ca backfill user cu tu `auth.users` sang `public.profiles`
- Neu ban da tao truoc user `admin@gmail.com`, chi can chay lai file nay la profile se duoc tao/bo sung
- Neu muon theo kieu migration ro rang, co the chay:
  - `supabase/migrations/20260509_001_init_schema.sql`
  - `supabase/migrations/20260511_003_phase1_conversion.sql`
  - `supabase/migrations/20260511_004_phase2_roles.sql`
  - `supabase/migrations/20260511_005_phase3_multi_branch_foundation.sql`
  - `supabase/migrations/20260511_006_phase4_voucher_loyalty.sql`
  - sau do `supabase/migrations/20260509_002_seed_admin_demo.sql`

## 2. Tao tai khoan admin
- Vao Authentication > Users
- Tao user bang email/password
- Vi du: `admin@gmail.com`

## 3. Gan quyen admin
- Cach nhanh nhat: chay file `supabase/seed.sql`
- File nay se:
  - gan role `admin` cho `admin@gmail.com`
  - seed du lieu mau cho ban, mon an, reservations, vouchers, orders
- Ban migration tuong ung:
  - `supabase/migrations/20260509_002_seed_admin_demo.sql`

- Hoac neu muon tu lam tay, chay cau lenh sau trong SQL Editor sau khi tao user:

```sql
update public.profiles
set role = 'admin'
where email = 'admin@gmail.com';
```

## 4. Dang nhap admin
- Mo `/admin/login`
- Dang nhap bang email/password vua tao trong Supabase Auth
- Vi du:
  - email: `admin@gmail.com`
  - password: mat khau ban da tao trong Supabase Auth

## 5. Du lieu hien dang dung Supabase
- Admin login
- Reservations / dat ban
- Voucher leads
- Menu items / mon an
- Restaurant tables / ban
- Orders / dat mon noi bo
- Integration settings va sync logs
- Branches / da chi nhanh foundation
- Branch staff assignments / phan cong nhan su theo chi nhanh
- Voucher campaigns / campaign uu dai
- Customer profiles / loyalty members
- Voucher redemptions / lich su redeem va tich diem

## 6. Bien moi truong local
File `.env.local` da duoc gan:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Neu deploy len production, can dat 2 bien nay trong environment cua hosting.

## 7. Neu gap loi `Could not find the table 'public.profiles' in the schema cache`
- Nghia la project Supabase chua co bang `public.profiles` hoac PostgREST chua nhan schema moi
- Cach xu ly:
  1. Chay lai `supabase/schema.sql`
  2. Chay `supabase/seed.sql`
  3. Cho 10-30 giay de schema cache refresh
  4. Refresh lai trang admin va login lai
