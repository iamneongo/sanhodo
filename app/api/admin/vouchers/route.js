import { NextResponse } from "next/server";
import { requireAdminApi, unauthorizedResponse } from "../../../../lib/supabase/auth";
import { listVoucherLeads } from "../../../../lib/restaurant-db";

export async function GET(request) {
  const context = await requireAdminApi("vouchers.view");
  if (!context) {
    return unauthorizedResponse();
  }

  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get("branchId") || "";
  const items = await listVoucherLeads(context.supabase, { branchId });
  return NextResponse.json({ ok: true, data: items });
}
