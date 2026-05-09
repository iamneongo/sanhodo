import { NextResponse } from "next/server";
import { requireAdminApi, unauthorizedResponse } from "../../../../lib/supabase/auth";
import { createMenuItem, listMenuItems } from "../../../../lib/restaurant-db";

export async function GET() {
  const context = await requireAdminApi();
  if (!context) {
    return unauthorizedResponse();
  }

  const items = await listMenuItems(context.supabase);
  return NextResponse.json({ ok: true, data: items });
}

export async function POST(request) {
  const context = await requireAdminApi();
  if (!context) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const created = await createMenuItem(context.supabase, body);
    return NextResponse.json({ ok: true, data: created });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Không tạo được món ăn" }, { status: 500 });
  }
}
