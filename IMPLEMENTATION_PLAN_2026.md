# San Ho Do 2026 Implementation Plan

## Muc tieu

Tai lieu nay chot ke hoach fix va mo rong he thong theo 2 file feedback:

- `SanHoDo BaoCao DanhGia 2026.docx`
- `SanHoDo TinhNangBoSung 2026.docx`

Nguyen tac trien khai:

1. Fix nhung diem anh huong truc tiep den chuyen doi va bao mat truoc.
2. Giu on dinh stack hien tai: `Next.js + Supabase + Vercel`.
3. Tach theo phase de tranh vo flow dang chay cua landing page va admin.
4. Moi phase deu co DB, API, UI, test case va rollback ro rang.

## Trang thai hien tai

### Landing page

- Da co hero, menu, combo, dat ban, dat mon, voucher, chatbot.
- Da co sticky CTA mobile.
- Da co API Supabase cho `reservations`, `orders`, `voucher_leads`, `menu_items`.

### Admin

- Da co dashboard quan ly:
  - reservations
  - orders
  - tables
  - menu items
  - vouchers leads
  - integrations
- Da login duoc bang Supabase Auth.

### Schema hien tai

Da co cac bang:

- `profiles`
- `restaurant_tables`
- `menu_items`
- `reservations`
- `orders`
- `order_items`
- `voucher_leads`
- `integration_settings`
- `integration_sync_logs`

### Gap lon theo feedback

Bao cao danh gia va dac ta tinh nang moi cho thay 2 nhom viec:

1. `Remediation`: cac tinh nang da co nhung UX/chuc nang chua hoan chinh.
2. `Expansion`: da chi nhanh, voucher nang cao, driver, agency/HDV, xac nhan anh.

## Mapping feedback -> backlog

### Nhom A: Fix doanh thu / UX / bao mat

1. Form dat ban
- Them date picker va time slot.
- Validate so dien thoai Viet Nam.
- Chan dat ngoai gio mo cua.
- Co trang thai thanh cong va thong diep xac nhan ro rang.

2. Menu / dat mon
- Them mini cart.
- Hien tong tien tam tinh.
- Them filter theo danh muc.
- Co trang thai `het hang` / `theo mua`.

3. Combo / upsell
- Hien gia goc gach cheo.
- Them anh minh hoa combo.
- Ghi ro suc chua combo tiec.

4. Voucher
- Doi lead capture thanh incentive ro rang.
- Hien noi dung voucher sau submit.
- Chuan bi luong gui ma qua Zalo/SMS.

5. Admin security
- Tach role ro hon: `super_admin`, `manager`, `staff`, `driver`.
- Chuan bi MFA/2FA voi Supabase.
- Log va notification cho don moi.

6. SEO / performance
- Sua title, meta description co dau.
- Them `Restaurant JSON-LD`.
- Them OG/Twitter card.
- Chuyen cac anh quan trong qua `next/image`.

### Nhom B: Mo rong he thong

1. Da chi nhanh.
2. Voucher nang cao.
3. Driver commission.
4. Travel partner / tour guide portal.
5. Driver workflow: chat, upload manifest, upload invoice image.

## Ke hoach theo phase

## Phase 1 - Conversion + UX remediation

### Muc tieu

Tang diem danh gia tu `6.4/10` len khoang `7.3 - 7.6/10` ma khong doi kien truc lon.

### Pham vi

#### Landing page

- Form dat ban:
  - `input datetime-local` -> date picker + select khung gio.
  - Validate SDT Viet Nam bang regex.
  - Chi cho phep `10:00 - 22:00`.
  - Co success state ro rang va CTA tiep theo.

- Dat mon:
  - Bien `Chon mon` thanh mini cart that.
  - Hien `so luong`, `tong tam tinh`, `xoa mon`.
  - Hien thong diep xac nhan sau submit.

- Voucher:
  - Hien incentive cu the, vi du `Giam 10% cho lan dat ban dau tien`.
  - Sau khi submit: hien voucher code demo va dieu kien ap dung.

- Combo:
  - Them gia goc.
  - Them subtitle suc chua cho combo tiec.

#### Admin

- Notification state cho:
  - reservation moi
  - order moi
  - voucher moi

- Chuan hoa role guard:
  - `admin`, `manager`, `staff`

#### SEO

- `metadata` cho homepage.
- `openGraph`, `twitter`.
- `Restaurant` structured data.

### DB thay doi

Khong can them bang lon. Chi can them nhe:

- `profiles.role` mo rong check constraint.
- `menu_items`
  - them `availability_status` hoac tai su dung `is_available` + `season_note`
- `reservations`
  - them `branch_id` nullable de chuan bi phase 2
  - them `confirmation_channel`
  - them `confirmation_sent_at`
- `voucher_leads`
  - them `voucher_code`
  - them `voucher_title`
  - them `voucher_discount_type`
  - them `voucher_discount_value`
  - them `expires_at`

### API can sua

- `/api/reservations`
- `/api/orders`
- `/api/vouchers`
- `/api/menu`
- admin CRUD cho menu/reservations/vouchers

### UI files chinh

- `app/page.js`
- `app/globals.css`
- `components/admin-dashboard.js`
- `components/admin.module.css`
- `app/layout.js`

### Uoc tinh

- `3-4 ngay dev`

## Phase 2 - Admin security + analytics

### Muc tieu

Lam cho admin du an du dung cho van hanh that, giam rui ro va co dashboard theo doi.

### Pham vi

- Role-based access:
  - `super_admin`
  - `branch_manager`
  - `staff`
  - `driver`

- MFA readiness:
  - them UI huong dan bat Supabase MFA
  - gate cac thao tac nhay cam neu can

- Analytics dashboard:
  - tong reservations theo ngay
  - tong orders theo ngay
  - top mon ban chay
  - conversion voucher -> reservation
  - ty le reservation theo status

- Notification:
  - hook webhook/Zalo cho don moi

### DB thay doi

- them view/materialized query helper cho analytics, hoac query tu bang goc.
- them `created_by`, `updated_by` neu can audit sau.

### Uoc tinh

- `3-4 ngay dev`

## Phase 3 - Multi-branch foundation

### Muc tieu

Tach he thong hien tai thanh architecture da chi nhanh ma khong pha du lieu cu.

### Bang moi

- `branches`
- `branch_staff_assignments`

### Bang can bo sung `branch_id`

- `profiles`
- `restaurant_tables`
- `menu_items`
- `reservations`
- `orders`
- `voucher_leads`
- `integration_settings`

### Pham vi UI

- Selector chi nhanh tren landing page.
- Scope du lieu theo chi nhanh trong admin.
- `super_admin` xem tong hop, `branch_manager` chi thay branch duoc phan.

### RLS

- rewrite `is_admin()` thanh he role + branch scope helper.

### Uoc tinh

- `5-6 ngay dev`

## Phase 4 - Advanced voucher + loyalty

### Bang moi

- `vouchers`
- `voucher_redemptions`
- `customer_loyalty_points` hoac `customer_profiles`

### Pham vi

- voucher `%`, `fixed_amount`, `free_item`
- branch-specific voucher
- per-user limit
- valid from / valid until
- apply vao reservation/order flow
- admin tao, bat/tat, theo doi luot dung

### Uoc tinh

- `4-5 ngay dev`

## Phase 5 - Driver commission

### Bang moi

- `drivers`
- `driver_referrals`
- `driver_commission_transactions`

### Pham vi

- ma tai xe
- QR code / code referral
- gan driver vao reservation/order
- hoa hong tu dong
- dashboard tai xe
- export danh sach chi hoa hong

### Uoc tinh

- `4-5 ngay dev`

## Phase 6 - Travel partner / HDV portal

### Bang moi

- `travel_partners`
- `partner_bookings`
- `partner_contracts`
- `partner_booking_guests` (optional)

### Pham vi

- portal login rieng
- booking doan
- set menu doan
- theo doi hoa hong/chiết khau
- file upload danh sach khach

### Uoc tinh

- `6-8 ngay dev`

## Phase 7 - Driver media workflow

### Bang moi

- `booking_messages`
- `booking_attachments`
- `invoice_verifications`

### Pham vi

- chat staff <-> driver
- upload manifest
- upload hoa don
- optional OCR
- approve invoice -> tinh hoa hong

### Uoc tinh

- `4-6 ngay dev`

## Thu tu khuyen nghi de bat dau

### Dot 1 - Nen lam ngay

1. Phase 1
2. Phase 2

Ly do:

- tac dong truc tiep den convert
- sua duoc cac diem bi danh gia thap
- khong doi schema qua lon
- de deploy an toan

### Dot 2 - Kien truc he thong

3. Phase 3
4. Phase 4

Ly do:

- da chi nhanh la nen tang cho voucher, driver, agency
- neu lam voucher/driver truoc multi-branch thi sau nay se sua lai rat nhieu

### Dot 3 - He sinh thai doi tac

5. Phase 5
6. Phase 6
7. Phase 7

## Ke hoach ky thuat cu the cho phase 1

### DB migration

1. Tao migration them cot nhe cho `profiles`, `reservations`, `voucher_leads`, `menu_items`
2. Seed du lieu demo neu can
3. Update RLS neu role enum thay doi

### Frontend

1. Refactor reservation form thanh `date + time slot`
2. Them reusable phone validation
3. Tao mini cart state cho menu
4. Them voucher success card
5. Them schema metadata vao layout/page

### Backend

1. Validate payload server-side
2. Chan reservation ngoai gio
3. Sinh voucher code sau lead capture
4. Ghi notification event cho admin

### Admin

1. Hien badge don moi / reservation moi
2. Them filter status tot hon
3. Hien thong tin voucher code / expires
4. Chuan bi tab analytics basic

## Acceptance criteria cho phase 1

- Khach khong the dat ngoai khung `10:00 - 22:00`
- SDT sai dinh dang bi chan o client va server
- Sau submit reservation, co success state ro rang
- Voucher lead tra ve ma uu dai cu the
- Chon nhieu mon hien tong tam tinh va submit duoc
- Combo hien gia goc va gia uu dai
- Homepage co title/meta/OG/JSON-LD chuan

## Rui ro va cach tranh

1. Schema phinh to qua nhanh
- Giai phap: tach phase, uu tien cot bo sung truoc bang moi.

2. RLS phuc tap khi vao multi-branch
- Giai phap: hoan tat role model o phase 2 truoc.

3. Admin dashboard phinh thanh mot file qua lon
- Giai phap: sau phase 1 tach dần thanh module:
  - reservations
  - menu
  - orders
  - vouchers
  - analytics

4. Tich hop Zalo/SMS chua co provider that
- Giai phap: thiet ke webhook/event interface truoc, provider den sau.

## De xuat trien khai ngay trong repo nay

### Sprint tiep theo

1. Phase 1 migration
2. Phase 1 landing page UX
3. Phase 1 admin updates
4. SEO patch
5. End-to-end test

### Files likely to change first

- `app/page.js`
- `app/globals.css`
- `app/layout.js`
- `app/api/reservations/route.js`
- `app/api/orders/route.js`
- `app/api/vouchers/route.js`
- `components/admin-dashboard.js`
- `lib/restaurant-db.js`
- `supabase/schema.sql`
- `supabase/migrations/*`

## Chot huong

Huong khuyen nghi:

- Trien khai ngay `Phase 1 + Phase 2`
- Chot kien truc `multi-branch` truoc khi lam `driver` va `agency`
- Khong nen nhay thang vao 5 nhom mo rong cung luc, vi se tang rui ro schema, RLS va regression tren admin hien tai.
