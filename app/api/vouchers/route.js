import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import {
  createVoucherLead,
  forwardToWebhooks,
  isSupabaseSchemaMissingError
} from "../../../lib/restaurant-db";

export async function POST(request) {
  try {
    const body = await request.json();
    const supabase = await createClient();

    const payload = {
      phone: body.phone?.trim() || "",
      status: "new",
      source: body.source || "landing-page",
      notes: body.notes || ""
    };

    if (!payload.phone) {
      return NextResponse.json({ error: "Missing phone" }, { status: 400 });
    }

    const saved = await createVoucherLead(supabase, payload);

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
      { error: error.message || "Không thể lưu lead voucher" },
      { status: 500 }
    );
  }
}
