import { NextResponse } from "next/server";
import { requireAdminApi, unauthorizedResponse } from "../../../../lib/supabase/auth";
import { listIntegrationSettings } from "../../../../lib/restaurant-db";

export async function GET() {
  const context = await requireAdminApi();
  if (!context) {
    return unauthorizedResponse();
  }

  const items = await listIntegrationSettings(context.supabase);
  return NextResponse.json({ ok: true, data: items });
}
