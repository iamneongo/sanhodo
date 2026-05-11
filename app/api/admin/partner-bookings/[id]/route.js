import { NextResponse } from "next/server";
import { requireAdminApi, unauthorizedResponse } from "../../../../../lib/supabase/auth";
import { deletePartnerBooking, updatePartnerBooking } from "../../../../../lib/restaurant-db";

export async function PATCH(request, { params }) {
  const context = await requireAdminApi("partners.booking");
  if (!context) {
    return unauthorizedResponse();
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const updated = await updatePartnerBooking(context.supabase, id, body);
    return NextResponse.json({ ok: true, data: updated });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Không cập nhật được booking đoàn" }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  const context = await requireAdminApi("partners.booking");
  if (!context) {
    return unauthorizedResponse();
  }

  try {
    const { id } = await params;
    await deletePartnerBooking(context.supabase, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Không xóa được booking đoàn" }, { status: 500 });
  }
}
