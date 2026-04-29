import { NextResponse } from "next/server";
import { appendLead, forwardToWebhooks } from "../../../lib/lead-store";

export async function POST(request) {
  try {
    const body = await request.json();
    const payload = {
      type: "voucher",
      phone: body.phone?.trim() || ""
    };

    if (!payload.phone) {
      return NextResponse.json({ error: "Phone is required" }, { status: 400 });
    }

    await appendLead("vouchers.json", payload);

    await forwardToWebhooks(payload, [
      process.env.CRM_WEBHOOK_URL,
      process.env.GOOGLE_SHEET_WEBHOOK_URL,
      process.env.ZALO_WEBHOOK_URL
    ]);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to process voucher" }, { status: 500 });
  }
}
