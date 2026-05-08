import { NextResponse } from "next/server";
import { appendLead, forwardToWebhooks, VOUCHERS_FILE } from "../../../lib/lead-store";

export async function POST(request) {
  try {
    const body = await request.json();
    const payload = {
      phone: body.phone?.trim() || "",
      status: "new",
      source: "landing-page",
      notes: ""
    };

    if (!payload.phone) {
      return NextResponse.json({ error: "Phone is required" }, { status: 400 });
    }

    const saved = await appendLead(VOUCHERS_FILE, payload, "voucher");

    await forwardToWebhooks(saved, [
      process.env.CRM_WEBHOOK_URL,
      process.env.GOOGLE_SHEET_WEBHOOK_URL,
      process.env.ZALO_WEBHOOK_URL
    ]);

    return NextResponse.json({ ok: true, data: saved });
  } catch {
    return NextResponse.json({ error: "Unable to process voucher" }, { status: 500 });
  }
}
