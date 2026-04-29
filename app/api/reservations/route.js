import { NextResponse } from "next/server";
import { appendLead, forwardToWebhooks } from "../../../lib/lead-store";

export async function POST(request) {
  try {
    const body = await request.json();
    const payload = {
      type: "reservation",
      name: body.name?.trim() || "",
      phone: body.phone?.trim() || "",
      guests: body.guests || "",
      datetime: body.datetime || "",
      selectedOffer: body.selectedOffer || ""
    };

    if (!payload.name || !payload.phone || !payload.guests || !payload.datetime) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await appendLead("reservations.json", payload);

    await forwardToWebhooks(payload, [
      process.env.CRM_WEBHOOK_URL,
      process.env.GOOGLE_SHEET_WEBHOOK_URL,
      process.env.ZALO_WEBHOOK_URL
    ]);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to process reservation" }, { status: 500 });
  }
}
