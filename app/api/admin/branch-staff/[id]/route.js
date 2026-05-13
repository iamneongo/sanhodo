import { NextResponse } from "next/server";
import {
  deleteBranchStaffAssignment,
  upsertBranchStaffAssignment
} from "../../../../../lib/restaurant-db";
import { requireAdminApi, unauthorizedResponse } from "../../../../../lib/supabase/auth";

export async function PATCH(request, { params }) {
  const context = await requireAdminApi("branches.manage");
  if (!context) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const { id } = await params;
    const updated = await upsertBranchStaffAssignment(context.supabase, {
      ...body,
      id
    });
    return NextResponse.json({ ok: true, data: updated });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Không cập nhật được nhân sự chi nhánh" }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  const context = await requireAdminApi("branches.manage");
  if (!context) {
    return unauthorizedResponse();
  }

  try {
    const { id } = await params;
    const deleted = await deleteBranchStaffAssignment(context.supabase, id);

    if (!deleted.deleted) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: deleted });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Không gỡ được nhân sự khỏi chi nhánh" }, { status: 500 });
  }
}
