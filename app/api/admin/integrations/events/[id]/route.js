import { NextResponse } from "next/server";
import { requireAdminApi, unauthorizedResponse } from "../../../../../../lib/supabase/auth";
import { syncIntegrationEventDb, updateIntegrationEventStatus } from "../../../../../../lib/restaurant-db";

export async function PATCH(request, { params }) {
  const context = await requireAdminApi("integrations.sync");
  if (!context) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const { id } = await params;
    const updated = await updateIntegrationEventStatus(context.supabase, id, body);

    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: updated });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Không cập nhật được event đồng bộ" }, { status: 500 });
  }
}

export async function POST(_request, { params }) {
  const context = await requireAdminApi("integrations.sync");
  if (!context) {
    return unauthorizedResponse();
  }

  try {
    const { id } = await params;
    const result = await syncIntegrationEventDb(context.supabase, id);

    if (!result) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Không đồng bộ được event" }, { status: 500 });
  }
}
