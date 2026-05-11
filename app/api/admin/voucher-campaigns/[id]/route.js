import { NextResponse } from "next/server";
import { requireAdminApi, unauthorizedResponse } from "../../../../../lib/supabase/auth";
import {
  deleteVoucherCampaign,
  updateVoucherCampaign
} from "../../../../../lib/restaurant-db";

export async function PATCH(request, { params }) {
  const context = await requireAdminApi("vouchers.manage");
  if (!context) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const { id } = await params;
    const updated = await updateVoucherCampaign(context.supabase, id, body);

    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: updated });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Không cập nhật được voucher campaign" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request, { params }) {
  const context = await requireAdminApi("vouchers.manage");
  if (!context) {
    return unauthorizedResponse();
  }

  const { id } = await params;
  await deleteVoucherCampaign(context.supabase, id);
  return NextResponse.json({ ok: true });
}
