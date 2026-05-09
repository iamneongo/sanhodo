import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import {
  createPublicOrder,
  forwardToWebhooks,
  isSupabaseSchemaMissingError
} from "../../../lib/restaurant-db";

export async function POST(request) {
  try {
    const body = await request.json();
    const supabase = await createClient();

    const payload = {
      customerName: body.customerName?.trim() || "",
      customerPhone: body.customerPhone?.trim() || "",
      notes: body.notes || "",
      reservationId: body.reservationId || "",
      tableId: body.tableId || "",
      orderChannel: "website",
      items: Array.isArray(body.items) ? body.items : []
    };

    if (!payload.customerName || !payload.customerPhone || !payload.items.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const saved = await createPublicOrder(supabase, payload);

    await forwardToWebhooks(saved, [
      process.env.CRM_WEBHOOK_URL,
      process.env.GOOGLE_SHEET_WEBHOOK_URL,
      process.env.ZALO_WEBHOOK_URL
    ]);

    return NextResponse.json({ ok: true, data: saved });
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
