# Ke Hoach Trien Khai Theo 4 Tai Lieu PDF

Ngay lap: 2026-06-03

Nguon tai lieu:
- De Xuat Phan He Media & Import/Export Menu
- Bao Cao Danh Gia Giao Dien Quan Tri San Ho Do Ho Tram
- De Xuat He Thong Dang Nhap Da Vai Tro
- De Xuat API Dong Bo San Ho Do - GOECO - UVFL

## 1. Tom Tat Dieu Hanh

He thong hien tai da co nen tang admin dashboard, quan ly chi nhanh, dat ban, don hang, ban, mon an, voucher, tai xe, doi tac va tich hop. Cac PDF de xuat mo rong theo huong "he dieu hanh nha hang thong minh" gom media center, import/export menu, dang nhap da vai tro, portal rieng cho nhieu nhom nguoi dung va API dong bo sang UVFL/GOECO.

Trong giai doan gan nhat, nen uu tien nhung viec co tac dong van hanh cao va rui ro thap:
- Sua module Ban theo feedback production.
- Them import/export menu CSV de giam thoi gian nhap lieu.
- Chuan hoa media/upload anh mon an va mo duong cho Media Center.
- Lap khung API sync events de sau nay noi UVFL/GOECO.
- Ghi ro roadmap dang nhap da vai tro thay vi thay auth lon ngay lap tuc.

## 2. Phan Tich Theo Tai Lieu

### 2.1 Media Center & Import/Export Menu

Muc tieu:
- Quan ly tap trung anh, video, banner, logo, PDF, QR code.
- Import menu tu Excel/CSV/Google Sheet.
- Export menu ra Excel/PDF/QR menu.
- Tich hop AI tao mo ta, dich ngon ngu, tao poster/video ngan.

Tinh nang P1:
- Media Library.
- Import Excel/CSV.
- Export Excel/CSV.
- Export PDF.
- Upload anh mon an.

Tinh nang P2:
- QR Menu.
- TV Menu.
- Google Sheet Sync.

Tinh nang P3:
- AI Menu Generator.
- AI Marketing.
- Video Menu.
- Wifi Marketing Integration.

Trang thai code hien tai:
- Da co upload anh mon an trong admin `Món ăn`.
- Da co storage bucket `menu-images` trong migration.
- Da co export/template/import CSV cho menu.
- Da co import menu tu Google Sheet public CSV dung chung validator voi CSV upload.
- Da co Media Center rieng trong admin.
- Da co upload media asset truc tiep va public API `/api/media-assets`.
- Da co QR landing/menu co ban theo chi nhanh.
- Chua co export PDF menu va AI generator.

De xuat trien khai:
- Giai doan 1: Them export CSV, template CSV, import CSV cho menu.
- Giai doan 2: Them section Media gom danh sach asset, upload file, gan asset vao menu/banner.
- Giai doan 3: Them export PDF/QR va AI content.

### 2.2 Bao Cao UI Quan Ly Ban

Van de can sua:
- Ten ban va gia dang hien thi chung mot cum, gay cam giac loi du lieu.
- Du lieu test con xuat hien tren production.
- Thieu cot thao tac: xem, sua, xoa, doi trang thai, QR ban.

Nang cap de xuat:
- Tach cot Ten ban va Gia dat toi thieu.
- Dinh dang tien te VNĐ.
- Them cot Hanh dong.
- Them che do so do ban truc quan.
- Theo doi thoi gian nhan ban/tra ban.
- Lien ket dat ban de xem ten khach, SDT, so khach, ghi chu, gio dat.
- Dashboard KPI thoi gian thuc.

Trang thai code hien tai:
- `restaurant_tables` da co truong `minSpend`.
- UI da tach cot gia dat toi thieu, dinh dang tien te va co cot hanh dong.
- Da co trang chi tiet ban, tao/sua/xoa.
- Da co so do ban truc quan theo khu vuc va doi nhanh trang thai ban.
- Da co tracking thoi gian theo lan cap nhat trang thai gan nhat.
- Da co migration/session audit `table_session_events` cho tung lan doi trang thai ban va UI lich su trong chi tiet ban.

De xuat trien khai:
- Giai doan 1: Tach cot gia, them input gia toi thieu, them cot hanh dong.
- Giai doan 2: Them table floor view.
- Giai doan 3: Them realtime/KPI/AI forecast.

### 2.3 Dang Nhap Da Vai Tro

Nhom nguoi dung:
- Khach hang.
- Tai xe.
- Don vi lu hanh.
- Doi tac doanh nghiep.
- Nhan vien nha hang.
- Quan ly chi nhanh.
- Admin he thong.

Chuc nang chinh:
- Mot tai khoan co nhieu vai tro.
- Dang nhap bang OTP, OAuth, email/password.
- Sau dang nhap cho chon vai tro.
- Portal rieng theo vai tro.
- Bao mat: JWT, refresh token, 2FA, device management, audit log.

Trang thai code hien tai:
- Admin dashboard da co role: super_admin, admin, manager, branch_manager, staff, driver.
- Dang nhap admin qua Supabase Auth.
- Local admin fallback dang co cho dev/server.
- Da co role/branch scope switch trong admin sidebar theo phan cong chi nhanh hop le.
- Chua co portal khach hang/tai xe/doi tac tach rieng.
- Chua co audit log dang nhap va multi-role profile table.

De xuat trien khai:
- Giai doan 1: Chuan hoa role/permission, them audit log dang nhap, ho tro profile nhieu vai tro o DB.
- Giai doan 2: Them role selector sau login.
- Giai doan 3: Them customer/driver/partner portal rieng.

### 2.4 API Dong Bo San Ho Do - GOECO - UVFL

Muc tieu:
- Moi giao dich tu dong ghi nhan doanh thu, referrer, doi tac, hoa hong, diem thuong.
- Dong bo ve UVFL, khong xu ly thu cong.

API de xuat:
- `POST /api/uvfl/users`
- `POST /api/uvfl/membership`
- `POST /api/uvfl/referral`
- `POST /api/uvfl/orders`
- `POST /api/uvfl/drivers`
- `POST /api/uvfl/travel`
- `POST /api/uvfl/wallet`

Event bus de xuat:
- ORDER_COMPLETED
- PAYMENT_SUCCESS
- BOOKING_CONFIRMED
- RIDE_FINISHED

Trang thai code hien tai:
- Da co integrations va sync logs.
- Da co drivers, travel partners, orders, voucher redemption.
- Da co `integration_events` outbox, API admin, UI event queue, thao tac skip/retry/manual delivery.
- Da co migration cau hinh provider `uvfl` va `goeco` trong `integration_settings`.
- Da co worker API xu ly batch pending/failed co the goi tu admin hoac cron co secret.

De xuat trien khai:
- Giai doan 1: Them bang/API sync events noi bo, log payload va status.
- Giai doan 2: Them adapter UVFL voi env endpoint/API key.
- Giai doan 3: Them retry queue/event bus.

## 3. Roadmap Uu Tien

### P1 - Lam ngay

- [x] Lap markdown plan tu 4 PDF.
- [x] Sua UI module Ban: tach ten ban/gia, them gia toi thieu vao form, them cot hanh dong.
- [x] Them export menu CSV.
- [x] Them template CSV menu.
- [x] Them import menu CSV co validate loi co ban.
- [x] Ghi migration/ke hoach DB cho Media Center va UVFL sync events.

### P2 - Sau khi P1 on dinh

- [x] Them section Media Center trong admin.
- [x] Them danh sach media asset theo loai/danh muc.
- [x] Them so do ban truc quan.
- [x] Them role selector/scope switch trong admin sidebar.
- [x] Them integration adapter UVFL/GOECO dang manual delivery.

### P3 - Giai doan mo rong

- [ ] Export PDF menu.
- [x] QR menu co ban theo landing page chi nhanh.
- [x] Google Sheet sync dang public CSV/import theo link Sheet.
- [ ] AI tao mo ta mon/dich ngon ngu/marketing.
- [ ] GOECO driver flow day du.
- [ ] AI forecast cong suat.
- [x] Auto retry worker API cho integration events.

## 4. Pham Vi Trien Khai Dot Nay

Dot trien khai trong turn nay se tap trung:
- Sua module Ban theo Giai doan 1.
- Them API export/template/import CSV cho menu.
- Them nut import/export vao UI Mon an.
- Them migration de mo duong cho Media Center va UVFL sync events neu can DB.
- Build test.

Khong lam trong dot nay:
- Khong thay doi he thong login production lon.
- Khong ket noi that den UVFL/GOECO khi chua co endpoint/API key chinh thuc.
- Khong them AI generator neu chua co provider/key/prompt chuan.

## 5. Checklist Kiem Thu

- Build Next.js thanh cong.
- Admin `/admin/tables` hien cot Ban, Khu vuc, Suc chua, Gia toi thieu, Trang thai, Hanh dong.
- Tao/sua ban co truong Gia toi thieu.
- Export CSV menu tai duoc file dung encoding UTF-8.
- Template CSV co du cac cot can nhap.
- Import CSV validate du lieu thieu ten, gia khong hop le, trung slug/ten co canh bao.
- Khong anh huong landing page/mobile-only.

## 6. Trang Thai Tong Hop Sau Trien Khai

Da hoan tat:
- P1 gan nhu day du: table UI, import/export/template CSV, migration nen Media + Integration Events.
- P2 mot phan lon: Media Center, upload media, public media API, UVFL/GOECO event queue va manual delivery.

Con lai:
- Role selector va portal rieng cho customer/driver/partner.
- Portal rieng cho customer/driver/partner.
- KPI realtime/forecast nang cao cho cong suat ban.
- Export PDF menu va QR menu nang cao.
- AI generator/AI marketing/AI forecast.
- GOECO driver flow day du va lich cron production neu muon tu dong hoa hoan toan.

Danh gia tien do:
- Neu tinh phan nen van hanh admin + media + sync: khoang 86-90% feedback PDF da co nen hoac chay duoc.
- Neu tinh toan bo vision PDF, bao gom AI, portal, QR nang cao va worker tu dong: khoang 66-70%.
