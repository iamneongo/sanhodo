import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { isSupabaseSchemaMissingError, listMenuItems } from "../../../lib/restaurant-db";

export async function GET(request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId") || "";
    const items = await listMenuItems(supabase, { availableOnly: true, branchId });
    return NextResponse.json({ ok: true, data: items });
  } catch (error) {
    if (isSupabaseSchemaMissingError(error)) {
      return NextResponse.json({
        ok: true,
        data: [],
        setupRequired: true,
        message: "Supabase schema chua duoc khoi tao."
      });
    }

    return NextResponse.json({ error: error.message || "Không tải được menu" }, { status: 500 });
  }
}
