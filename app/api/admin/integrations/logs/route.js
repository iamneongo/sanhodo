import { NextResponse } from "next/server";
import { requireAdminApi, unauthorizedResponse } from "../../../../../lib/supabase/auth";
import { listIntegrationSyncLogs, listReservations } from "../../../../../lib/restaurant-db";

export async function GET(request) {
  const context = await requireAdminApi("integrations.view");
  if (!context) {
    return unauthorizedResponse();
  }

  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get("branchId") || "";
  const logs = await listIntegrationSyncLogs(context.supabase);

  if (!branchId) {
    return NextResponse.json({ ok: true, data: logs });
  }

  const reservations = await listReservations(context.supabase, { branchId });
  const reservationIds = new Set(reservations.map((item) => item.id));
  const filteredLogs = logs.filter((item) => !item.reservationId || reservationIds.has(item.reservationId));
  return NextResponse.json({ ok: true, data: filteredLogs });
}
