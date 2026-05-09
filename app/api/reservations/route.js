import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import {
  createReservation,
  forwardToWebhooks,
  isSupabaseSchemaMissingError
} from "../../../lib/restaurant-db";

export async function POST(request) {
  try {
    const body = await request.json();
    const supabase = await createClient();

    const payload = {
      name: body.name?.trim() || "",
      phone: body.phone?.trim() || "",
      guests: body.guests || "",
      datetime: body.datetime || "",
      selectedOffer: body.selectedOffer || "",
      status: "new",
      source: "landing-page",
      notes: body.notes || "",
      assignedTo: "",
      lastContactAt: "",
      tableId: body.tableId || ""
    };

    if (!payload.name || !payload.phone || !payload.guests || !payload.datetime) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const saved = await createReservation(supabase, payload);

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
      { error: error.message || "Không thể tạo yêu cầu đặt bàn" },
      { status: 500 }
    );
  }
}
