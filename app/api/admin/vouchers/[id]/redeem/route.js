import { NextResponse } from "next/server";
import { requireAdminApi, unauthorizedResponse } from "../../../../../../lib/supabase/auth";
import { redeemVoucherLead } from "../../../../../../lib/restaurant-db";

export async function POST(request, { params }) {
  const context = await requireAdminApi("vouchers.manage");
  if (!context) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const { id } = await params;
    const result = await redeemVoucherLead(context.supabase, id, {
      ...body,
      redeemedBy: context.profile?.email || context.profile?.full_name || "admin"
    });

    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Không thể redeem voucher" },
      { status: 500 }
    );
  }
}
