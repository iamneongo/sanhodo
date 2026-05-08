import { NextResponse } from "next/server";
import { requireAdminApi } from "../../../../../lib/admin-guard";
import { deleteLead, RESERVATIONS_FILE, updateLead } from "../../../../../lib/lead-store";

export async function PATCH(request, { params }) {
  const isAllowed = await requireAdminApi();
  if (!isAllowed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id } = await params;
    const updated = await updateLead(RESERVATIONS_FILE, "reservation", id, body);

    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: updated });
  } catch {
    return NextResponse.json({ error: "Không thể cập nhật đặt bàn" }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  const isAllowed = await requireAdminApi();
  if (!isAllowed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const deleted = await deleteLead(RESERVATIONS_FILE, "reservation", id);
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
