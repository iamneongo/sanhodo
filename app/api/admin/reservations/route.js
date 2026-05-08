import { NextResponse } from "next/server";
import { requireAdminApi } from "../../../../lib/admin-guard";
import { appendLead, readLeads, RESERVATIONS_FILE } from "../../../../lib/lead-store";

export async function GET() {
  const isAllowed = await requireAdminApi();
  if (!isAllowed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await readLeads(RESERVATIONS_FILE, "reservation");
  items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return NextResponse.json({ ok: true, data: items });
}

export async function POST(request) {
  const isAllowed = await requireAdminApi();
  if (!isAllowed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const payload = {
      name: body.name?.trim() || "",
      phone: body.phone?.trim() || "",
      guests: body.guests || "",
      datetime: body.datetime || "",
      selectedOffer: body.selectedOffer || "",
      status: body.status || "new",
      source: body.source || "admin-manual",
      notes: body.notes || "",
      assignedTo: body.assignedTo || "",
      lastContactAt: body.lastContactAt || "",
      tags: Array.isArray(body.tags) ? body.tags : []
    };

    if (!payload.name || !payload.phone || !payload.guests || !payload.datetime) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const saved = await appendLead(RESERVATIONS_FILE, payload, "reservation");
    return NextResponse.json({ ok: true, data: saved });
  } catch {
    return NextResponse.json({ error: "Không thể tạo đặt bàn" }, { status: 500 });
  }
}
