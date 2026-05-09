import { NextResponse } from "next/server";
import { requireAdminApi, unauthorizedResponse } from "../../../../../lib/supabase/auth";
import { listIntegrationSyncLogs } from "../../../../../lib/restaurant-db";

export async function GET() {
  const context = await requireAdminApi();
  if (!context) {
    return unauthorizedResponse();
  }

  const logs = await listIntegrationSyncLogs(context.supabase);
  return NextResponse.json({ ok: true, data: logs });
}
