# Supabase Setup

## 1. Chay schema
- Mo Supabase Dashboard
- Vao SQL Editor
- Chay toan bo file `supabase/schema.sql`

## 2. Tao tai khoan admin
- Vao Authentication > Users
- Tao user bang email/password
- Vi du: `admin@sanhodo.vn`

## 3. Gan quyen admin
- Chay cau lenh sau trong SQL Editor sau khi tao user:

```sql
update public.profiles
set role = 'admin'
where email = 'admin@sanhodo.vn';
```

## 4. Dang nhap admin
- Mo `/admin/login`
- Dang nhap bang email/password vua tao trong Supabase Auth

## 5. Du lieu hien dang dung Supabase
- Admin login
- Reservations / dat ban
- Voucher leads
- Menu items / mon an
- Restaurant tables / ban
- Orders / dat mon noi bo
- Integration settings va sync logs

## 6. Bien moi truong local
File `.env.local` da duoc gan:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Neu deploy len production, can dat 2 bien nay trong environment cua hosting.
