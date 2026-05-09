import { NextResponse } from "next/server";
import { requireAdminApi, unauthorizedResponse } from "../../../../lib/supabase/auth";
import { createReservation, listReservations } from "../../../../lib/restaurant-db";

export async function GET() {
  const context = await requireAdminApi();
  if (!context) {
    return unauthorizedResponse();
  }

  const items = await listReservations(context.supabase);
  return NextResponse.json({ ok: true, data: items });
}

export async function POST(request) {
  const context = await requireAdminApi();
  if (!context) {
    return unauthorizedResponse();
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
      tableId: body.tableId || ""
    };

    if (!payload.name || !payload.phone || !payload.guests || !payload.datetime) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const saved = await createReservation(context.supabase, payload);
    return NextResponse.json({ ok: true, data: saved });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Không thể tạo đặt bàn" }, { status: 500 });
  }
}
