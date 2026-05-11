import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import {
  createPublicOrder,
  forwardToWebhooks,
  isSupabaseSchemaMissingError,
  upsertCustomerProfileByPhone
} from "../../../lib/restaurant-db";
import { isValidVietnamPhone } from "../../../lib/business-rules";

export async function POST(request) {
  try {
    const body = await request.json();
    const supabase = await createClient();

    const payload = {
      customerName: body.customerName?.trim() || "",
      customerPhone: body.customerPhone?.trim() || "",
      notes: body.notes || "",
      branchId: body.branchId || "",
      reservationId: body.reservationId || "",
      tableId: body.tableId || "",
      driverId: body.driverId || "",
      referralCode: body.referralCode || "",
      orderChannel: "website",
      items: Array.isArray(body.items) ? body.items : []
    };

    if (!payload.customerName || !payload.customerPhone || !payload.items.length) {
      return NextResponse.json(
        { error: "Vui lòng điền tên, số điện thoại và chọn ít nhất một món." },
        { status: 400 }
      );
    }

    if (!isValidVietnamPhone(payload.customerPhone)) {
      return NextResponse.json(
        { error: "Số điện thoại đặt món chưa đúng định dạng di động Việt Nam." },
        { status: 400 }
      );
    }

    const saved = await createPublicOrder(supabase, payload);
    await upsertCustomerProfileByPhone(supabase, {
      phone: payload.customerPhone,
      fullName: payload.customerName,
      branchId: payload.branchId,
      lastSeenAt: new Date().toISOString(),
      notes: "Lead đặt món từ landing page"
    }).catch(() => {});

    await forwardToWebhooks(saved, [
      process.env.CRM_WEBHOOK_URL,
      process.env.GOOGLE_SHEET_WEBHOOK_URL,
      process.env.ZALO_WEBHOOK_URL
    ]);

    return NextResponse.json({
      ok: true,
      data: saved,
      message: "Đã nhận yêu cầu đặt món. Đội ngũ sẽ xác nhận đơn sớm nhất."
    });
  } catch (error) {
    if (isSupabaseSchemaMissingError(error)) {
      return NextResponse.json(
        {
          error: error.message,
          setupRequired: true
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Không thể tạo order từ landing page" },
      { status: 500 }
    );
  }
}
