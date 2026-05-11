import { NextResponse } from "next/server";
import { requireAdminApi, unauthorizedResponse } from "../../../../lib/supabase/auth";
import { createVoucherCampaign, listVoucherCampaigns } from "../../../../lib/restaurant-db";

export async function GET(request) {
  const context = await requireAdminApi("vouchers.view");
  if (!context) {
    return unauthorizedResponse();
  }

  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get("branchId") || "";
  const items = await listVoucherCampaigns(context.supabase, { branchId });
  return NextResponse.json({ ok: true, data: items });
}

export async function POST(request) {
  const context = await requireAdminApi("vouchers.manage");
  if (!context) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const created = await createVoucherCampaign(context.supabase, body);
    return NextResponse.json({ ok: true, data: created });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Không tạo được voucher campaign" },
      { status: 500 }
    );
  }
}
