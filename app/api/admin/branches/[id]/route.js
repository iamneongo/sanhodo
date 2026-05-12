import { NextResponse } from "next/server";
import { updateBranch } from "../../../../../lib/restaurant-db";
import { requireAdminApi, unauthorizedResponse } from "../../../../../lib/supabase/auth";

export async function PATCH(request, { params }) {
  const context = await requireAdminApi("branches.manage");
  if (!context) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const { id } = await params;
    const updated = await updateBranch(context.supabase, id, body);

    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: updated });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Không cập nhật được chi nhánh" }, { status: 500 });
  }
}
