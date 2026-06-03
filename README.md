# sanhodo

Landing page cho nhà hàng San Hô Đỏ được chuyển sang `Next.js`, giữ nguyên giao diện gốc và bổ sung:

- thanh CTA chốt khách cố định
- form đặt bàn nhanh
- menu có giá và combo
- popup upsell
- form nhận voucher
- chatbot GOECO demo
- API nhận lead để nối CRM / Google Sheet / Zalo webhook

## Integration worker

Hệ thống có route xử lý hàng đợi đồng bộ UVFL/GOECO:

```txt
POST /api/admin/integrations/events/process?limit=10
GET  /api/admin/integrations/events/process?limit=10&secret=<INTEGRATION_WORKER_SECRET>
```

Khi gọi bằng cron/server bên ngoài hoặc Vercel Cron, cấu hình:

```env
SUPABASE_SERVICE_ROLE_KEY=
INTEGRATION_WORKER_SECRET=
CRON_SECRET=
```

Vercel Cron đang được cấu hình trong `vercel.json` để gọi worker mỗi 10 phút. Hãy đặt `CRON_SECRET` trên Vercel để request cron tự có header `Authorization: Bearer <CRON_SECRET>`.

Không bật cron production nếu chưa cấu hình endpoint UVFL/GOECO thật trong admin.
