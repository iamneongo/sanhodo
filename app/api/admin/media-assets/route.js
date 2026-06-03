import { NextResponse } from "next/server";
import { requireAdminApi, unauthorizedResponse } from "../../../../lib/supabase/auth";
import { createMediaAsset, listMediaAssets } from "../../../../lib/restaurant-db";

export async function GET(request) {
  const context = await requireAdminApi("media.view");
  if (!context) {
    return unauthorizedResponse();
  }

  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId") || "";
    const assetType = searchParams.get("assetType") || "all";
    const status = searchParams.get("status") || "all";
    const items = await listMediaAssets(context.supabase, { branchId, assetType, status });
    return NextResponse.json({ ok: true, data: items });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Không tải được media" }, { status: 500 });
  }
}

export async function POST(request) {
  const context = await requireAdminApi("media.manage");
  if (!context) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const created = await createMediaAsset(context.supabase, body);
    return NextResponse.json({ ok: true, data: created });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Không tạo được media" }, { status: 500 });
  }
}
