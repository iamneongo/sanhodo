import { NextResponse } from "next/server";
import { requireAdminApi, unauthorizedResponse } from "../../../../../lib/supabase/auth";
import { updateIntegrationSettingDb } from "../../../../../lib/restaurant-db";

export async function PATCH(request, { params }) {
  const context = await requireAdminApi();
  if (!context) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const { id } = await params;
    const updated = await updateIntegrationSettingDb(context.supabase, id, body);

    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: updated });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Không thể cập nhật cấu hình tích hợp" },
      { status: 500 }
    );
  }
}
