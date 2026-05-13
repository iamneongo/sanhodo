import { NextResponse } from "next/server";
import { listProfiles } from "../../../../lib/restaurant-db";
import { requireAdminApi, unauthorizedResponse } from "../../../../lib/supabase/auth";

export async function GET() {
  const context = await requireAdminApi("staff.view");
  if (!context) {
    return unauthorizedResponse();
  }

  const items = await listProfiles(context.supabase);
  return NextResponse.json({ ok: true, data: items });
}
