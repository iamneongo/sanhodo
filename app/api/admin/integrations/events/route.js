import { NextResponse } from "next/server";
import { requireAdminApi, unauthorizedResponse } from "../../../../../lib/supabase/auth";
import { listIntegrationEvents } from "../../../../../lib/restaurant-db";

export async function GET(request) {
  const context = await requireAdminApi("integrations.view");
  if (!context) {
    return unauthorizedResponse();
  }

  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId") || "";
    const provider = searchParams.get("provider") || "all";
    const status = searchParams.get("status") || "all";
    const limit = Number(searchParams.get("limit") || 100);
    const items = await listIntegrationEvents(context.supabase, { branchId, provider, status, limit });
    return NextResponse.json({ ok: true, data: items });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Không tải được event đồng bộ" }, { status: 500 });
  }
}
