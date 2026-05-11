import { NextResponse } from "next/server";
import { buildFallbackVoucherCampaign } from "../../../lib/business-rules";
import { createClient } from "../../../lib/supabase/server";
import { isSupabaseSchemaMissingError, listVoucherCampaigns } from "../../../lib/restaurant-db";

export async function GET(request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId") || "";
    const items = await listVoucherCampaigns(supabase, {
      branchId,
      activeOnly: true,
      autoIssueOnly: true
    });

    return NextResponse.json({
      ok: true,
      data: items
    });
  } catch (error) {
    if (isSupabaseSchemaMissingError(error)) {
      return NextResponse.json({
        ok: true,
        data: [buildFallbackVoucherCampaign("")],
        setupRequired: true
      });
    }

    return NextResponse.json(
      { error: error.message || "Không tải được voucher campaigns" },
      { status: 500 }
    );
  }
}
