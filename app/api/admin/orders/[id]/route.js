import { NextResponse } from "next/server";
import { requireAdminApi, unauthorizedResponse } from "../../../../../lib/supabase/auth";
import { deleteOrder, updateOrder } from "../../../../../lib/restaurant-db";

export async function PATCH(request, { params }) {
  const context = await requireAdminApi("orders.manage");
  if (!context) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const { id } = await params;
    const updated = await updateOrder(context.supabase, id, body);

    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: updated });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Không cập nhật được order" }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  const context = await requireAdminApi("orders.manage");
  if (!context) {
    return unauthorizedResponse();
  }

  const { id } = await params;
  await deleteOrder(context.supabase, id);
  return NextResponse.json({ ok: true });
}
