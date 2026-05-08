import { NextResponse } from "next/server";
import { requireAdminApi } from "../../../../../lib/admin-guard";
import { updateIntegrationSetting } from "../../../../../lib/integrations-store";

export async function PATCH(request, { params }) {
  const isAllowed = await requireAdminApi();
  if (!isAllowed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id } = await params;
    const updated = await updateIntegrationSetting(id, body);

    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: updated });
  } catch {
    return NextResponse.json({ error: "Không thể cập nhật cấu hình tích hợp" }, { status: 500 });
  }
}
