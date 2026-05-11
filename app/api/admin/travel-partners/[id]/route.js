import { NextResponse } from "next/server";
import { requireAdminApi, unauthorizedResponse } from "../../../../../lib/supabase/auth";
import { deleteTravelPartner, updateTravelPartner } from "../../../../../lib/restaurant-db";

export async function PATCH(request, { params }) {
  const context = await requireAdminApi("partners.manage");
  if (!context) {
    return unauthorizedResponse();
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const updated = await updateTravelPartner(context.supabase, id, body);
    return NextResponse.json({ ok: true, data: updated });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Không cập nhật được đối tác" }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  const context = await requireAdminApi("partners.manage");
  if (!context) {
    return unauthorizedResponse();
  }

  try {
    const { id } = await params;
    await deleteTravelPartner(context.supabase, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Không xóa được đối tác" }, { status: 500 });
  }
}
