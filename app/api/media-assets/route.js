import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { isSupabaseSchemaMissingError, listMediaAssets } from "../../../lib/restaurant-db";
import {
  getSupabaseEnvMissingMessage,
  isSupabaseEnvMissingError
} from "../../../lib/supabase/config";

export async function GET(request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId") || "";
    const assetType = searchParams.get("assetType") || "all";
    const category = searchParams.get("category") || "all";
    const limit = Number(searchParams.get("limit") || 60);
    const items = await listMediaAssets(supabase, {
      branchId,
      assetType,
      category,
      status: "active",
      limit: Math.min(Math.max(limit, 1), 100)
    });
    return NextResponse.json({ ok: true, data: items });
  } catch (error) {
    if (isSupabaseEnvMissingError(error)) {
      return NextResponse.json({
        ok: true,
        data: [],
        setupRequired: true,
        message: getSupabaseEnvMissingMessage()
      });
    }

    if (isSupabaseSchemaMissingError(error)) {
      return NextResponse.json({
        ok: true,
        data: [],
        setupRequired: true,
        message: "Supabase schema chua co media_assets."
      });
    }

    return NextResponse.json({ error: error.message || "Không tải được media" }, { status: 500 });
  }
}
