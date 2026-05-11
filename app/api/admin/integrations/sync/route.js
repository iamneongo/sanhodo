import { NextResponse } from "next/server";
import { requireAdminApi, unauthorizedResponse } from "../../../../../lib/supabase/auth";
import { syncReservationToIntegrationDb } from "../../../../../lib/restaurant-db";

export async function POST(request) {
  const context = await requireAdminApi("integrations.sync");
  if (!context) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const reservationId = body.reservationId?.trim() || "";
    const integrationId = body.integrationId?.trim() || "";

    if (!reservationId || !integrationId) {
      return NextResponse.json({ error: "Missing reservationId or integrationId" }, { status: 400 });
    }

    const result = await syncReservationToIntegrationDb(context.supabase, reservationId, integrationId);
    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Không thể đồng bộ với POS/PMS" },
      { status: 500 }
    );
  }
}
