import { NextResponse } from "next/server";
import { createBranch, listBranches } from "../../../../lib/restaurant-db";
import { requireAdminApi, unauthorizedResponse } from "../../../../lib/supabase/auth";

export async function GET() {
  const context = await requireAdminApi("branches.view");
  if (!context) {
    return unauthorizedResponse();
  }

  const items = await listBranches(context.supabase, { activeOnly: false });
  return NextResponse.json({ ok: true, data: items });
}

export async function POST(request) {
  const context = await requireAdminApi("branches.manage");
  if (!context) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const created = await createBranch(context.supabase, body);
    return NextResponse.json({ ok: true, data: created });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Không tạo được chi nhánh" }, { status: 500 });
  }
}
