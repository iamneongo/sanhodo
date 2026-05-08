import { NextResponse } from "next/server";
import { requireAdminApi } from "../../../../../lib/admin-guard";
import { getIntegrationSettings, syncReservationToIntegration } from "../../../../../lib/integrations-store";
import { readLeads, RESERVATIONS_FILE } from "../../../../../lib/lead-store";

export async function POST(request) {
  const isAllowed = await requireAdminApi();
  if (!isAllowed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const reservationId = body.reservationId?.trim() || "";
    const integrationId = body.integrationId?.trim() || "";

    if (!reservationId || !integrationId) {
      return NextResponse.json({ error: "Missing reservationId or integrationId" }, { status: 400 });
    }

    const [reservations, integrations] = await Promise.all([
      readLeads(RESERVATIONS_FILE, "reservation"),
      getIntegrationSettings()
    ]);

    const reservation = reservations.find((item) => item.id === reservationId);
    const integration = integrations.find((item) => item.id === integrationId);

    if (!reservation || !integration) {
      return NextResponse.json({ error: "Reservation or integration not found" }, { status: 404 });
    }

    if (!integration.enabled || !integration.endpoint) {
      return NextResponse.json({ error: "Integration is not fully configured" }, { status: 400 });
    }

    const result = await syncReservationToIntegration(reservation, integration);
    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Không thể đồng bộ với POS/PMS" },
      { status: 500 }
    );
  }
}
