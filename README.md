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
GET  /api/admin/integrations/events/process?limit=10
```

Worker khong can `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET` hay `INTEGRATION_WORKER_SECRET`.

Vercel Cron đang được cấu hình trong `vercel.json` để gọi worker mỗi 10 phút. Request cron cua Vercel co `User-Agent: vercel-cron/1.0`, route worker se nhan dien header nay va dung Supabase publishable key giong app server.

Không bật cron production nếu chưa cấu hình endpoint UVFL/GOECO thật trong admin.
