import { NextResponse } from "next/server";
import { requireAdminApi, unauthorizedResponse } from "../../../../lib/supabase/auth";
import { createReservation, listReservations } from "../../../../lib/restaurant-db";

export async function GET(request) {
  const context = await requireAdminApi("reservations.view");
  if (!context) {
    return unauthorizedResponse();
  }

  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get("branchId") || "";
  const items = await listReservations(context.supabase, { branchId });
  return NextResponse.json({ ok: true, data: items });
}

export async function POST(request) {
  const context = await requireAdminApi("reservations.manage");
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
      driverId: body.driverId || "",
      referralCode: body.referralCode || "",
      branchId: body.branchId || "",
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
