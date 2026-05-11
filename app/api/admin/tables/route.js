import { NextResponse } from "next/server";
import { requireAdminApi, unauthorizedResponse } from "../../../../lib/supabase/auth";
import { createRestaurantTable, listRestaurantTables } from "../../../../lib/restaurant-db";

export async function GET(request) {
  const context = await requireAdminApi("tables.view");
  if (!context) {
    return unauthorizedResponse();
  }

  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get("branchId") || "";
  const items = await listRestaurantTables(context.supabase, { branchId });
  return NextResponse.json({ ok: true, data: items });
}

export async function POST(request) {
  const context = await requireAdminApi("tables.manage");
  if (!context) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const created = await createRestaurantTable(context.supabase, body);
    return NextResponse.json({ ok: true, data: created });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Không tạo được bàn" }, { status: 500 });
  }
}
