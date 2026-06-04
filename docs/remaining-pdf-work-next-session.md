# Viec Con Lai So Voi 4 PDF - Tiep Tuc Ngay Mai

Ngay note: 2026-06-03

Trang thai chung:
- Nen van hanh admin, media, import/export menu, branch landing, event queue UVFL/GOECO va audit co ban da co ban chay duoc.
- Build local da pass voi `npm run build`.
- Cac migration moi nhat da duoc user chay den `016_admin_login_audit`.
- Phan con lai chu yeu la cac module lon can scope rieng, provider/API that hoac thiet ke portal rieng.

## 1. Portal rieng cho tung nhom nguoi dung

Chua lam:
- Portal khach hang.
- Portal tai xe.
- Portal doi tac/HDV/agency.
- Man hinh chon portal rieng sau login cho user co nhieu vai tro ngoai admin.

Da co nen:
- Role/permission admin.
- `branch_staff_assignments`.
- Switch role/branch scope trong admin sidebar.
- Driver, partner, booking, commission data model.

Can lam tiep:
- Thiet ke route rieng, vi du `/portal/customer`, `/portal/driver`, `/portal/partner`.
- Tach permission portal ra khoi permission admin dashboard.
- Them UI mobile-first cho tai xe xem referral/hoa hong.
- Them UI doi tac tao booking doan va xem hoa hong/hop dong.
- Them UI khach hang xem voucher/loyalty/lich su dat ban.

Can quyet dinh:
- Co dung chung Supabase Auth hay them OTP/Zalo login.
- Portal co public mobile-only hay desktop responsive.

## 2. AI forecast cong suat ban

Chua lam:
- Du bao cong suat theo gio/ngay.
- Goi y can them nhan su/ban/khung gio cao diem.
- KPI realtime nang cao cho table/session.

Da co nen:
- `restaurant_tables`.
- `table_session_events` ghi lich su doi trang thai ban.
- Reservations, orders, partner bookings.

Can lam tiep:
- Tong hop data theo khung gio tu `reservations`, `orders`, `table_session_events`.
- Them section forecast trong Dashboard/Tables.
- Neu chua dung AI provider that, co the lam heuristic truoc:
  - Peak hour.
  - Ty le ban dang ban/giu/don.
  - So reservation sap toi trong 2 gio.
  - Goi y can chuan bi ban/nhan su.

Can quyet dinh:
- Forecast chi can heuristic noi bo hay can ket noi AI provider.

## 3. QR menu nang cao

Chua lam:
- QR menu rieng cho tung ban.
- QR co tracking theo ban/khu vuc.
- QR menu co trang chi tiet/landing rieng theo branch + table.

Da co nen:
- API tao QR `/api/qr`.
- QR landing/menu co ban theo chi nhanh trong admin branch detail.
- Landing page dung 1 page switch content theo chi nhanh.

Can lam tiep:
- Them `table_qr_url` hoac sinh runtime theo `branchId/tableId`.
- Them nut tai QR trong chi tiet ban.
- Landing/menu doc query `tableId` de gan order/reservation vao ban.

Can quyet dinh:
- Khach quet QR se dat ban, goi mon hay chi xem menu.

## 4. AI marketing/video/translation voi provider that

Chua lam:
- AI marketing campaign.
- AI dich menu da ngon ngu tu provider that.
- AI tao poster/video ngan.

Da co nen:
- Smart copy noi bo cho mo ta mon/upsell.
- Media Center.
- Landing page da co ngon ngu VI/EN/ZH o muc UI.

Can lam tiep:
- Chon provider AI va key.
- Tao prompt template rieng cho San Ho Do.
- Luu ket qua AI vao media/campaign/menu metadata.
- Them approve flow truoc khi publish.

Can quyet dinh:
- Provider AI nao se dung.
- Co can luu chi phi/request log khong.

## 5. Dong bo UVFL/GOECO production that

Chua lam day du:
- Chua co endpoint/API key production that cua UVFL/GOECO.
- Chua test e2e voi he thong ngoai.
- Chua co mapping truong du lieu chuan theo tai lieu API thuc te.

Da co nen:
- `integration_settings`.
- `integration_events` outbox.
- UI event queue sync/skip/retry/bulk sync.
- Worker API va Vercel Cron moi 10 phut.
- Event cho booking, order, payment, voucher, driver, referral, commission, partner booking.

Can lam tiep:
- Nhap endpoint/API key/secret/location/tenant that trong admin Integrations.
- Test cron thuc te tren Vercel/server. Worker hien khong can `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET` hay `INTEGRATION_WORKER_SECRET`.
- Doi soat response payload voi UVFL/GOECO.

Can quyet dinh:
- He thong ngoai nhan payload generic hien tai hay can route rieng `/api/uvfl/*`.

## 6. Bao mat nang cao

Chua lam:
- 2FA.
- Device management.
- Session revoke theo thiet bi.
- Login OTP/Zalo/OAuth cho cac portal ngoai admin.

Da co nen:
- Supabase Auth.
- Admin session cookie signed.
- Audit login admin `admin_login_audits`.
- Account active/inactive.

Can lam tiep:
- Chon chien luoc OTP/OAuth.
- Them bang device/session neu can revoke tung thiet bi.
- Them UI xem thiet bi dang dang nhap.

## Uu Tien Ngay Mai

1. Kiem tra server sau deploy: landing, admin login, menu, table detail, integration queue.
2. Hoan thien portal tai xe truoc, vi da co driver/referral/commission data.
3. Them QR menu theo ban neu nha hang can dung tai ban.
4. Lam dashboard forecast heuristic truoc khi dung AI provider that.
5. Test cron/event queue voi env production.
