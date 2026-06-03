import { NextResponse } from "next/server";
import { requireAdminApi, unauthorizedResponse } from "../../../../../lib/supabase/auth";
import { deleteRestaurantTable, logTableSessionEvent, updateRestaurantTable } from "../../../../../lib/restaurant-db";

export async function PATCH(request, { params }) {
  const context = await requireAdminApi("tables.manage");
  if (!context) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const { id } = await params;
    const { data: before } = await context.supabase
      .from("restaurant_tables")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    const updated = await updateRestaurantTable(context.supabase, id, body);

    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const event =
      body.status && before?.status && before.status !== updated.status
        ? await logTableSessionEvent(context.supabase, {
            table: updated,
            fromStatus: before.status,
            toStatus: updated.status,
            actorProfileId: context.profile?.id || context.user?.id || "",
            actorName: context.profile?.full_name || context.profile?.email || context.user?.email || "",
            notes: body.notes || "",
            metadata: {
              source: "admin_dashboard"
            }
          })
        : null;

    return NextResponse.json({ ok: true, data: updated, event });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Không cập nhật được bàn" }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  const context = await requireAdminApi("tables.manage");
  if (!context) {
    return unauthorizedResponse();
  }

  const { id } = await params;
  await deleteRestaurantTable(context.supabase, id);
  return NextResponse.json({ ok: true });
}
