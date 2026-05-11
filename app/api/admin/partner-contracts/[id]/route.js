import { NextResponse } from "next/server";
import { requireAdminApi, unauthorizedResponse } from "../../../../../lib/supabase/auth";
import { deletePartnerContract, updatePartnerContract } from "../../../../../lib/restaurant-db";

export async function PATCH(request, { params }) {
  const context = await requireAdminApi("partners.contract");
  if (!context) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const updated = await updatePartnerContract(context.supabase, params.id, body);
    return NextResponse.json({ ok: true, data: updated });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Không cập nhật được hợp đồng" }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  const context = await requireAdminApi("partners.contract");
  if (!context) {
    return unauthorizedResponse();
  }

  try {
    await deletePartnerContract(context.supabase, params.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Không xóa được hợp đồng" }, { status: 500 });
  }
}
