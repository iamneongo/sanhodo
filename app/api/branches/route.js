import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { isSupabaseSchemaMissingError, listBranches } from "../../../lib/restaurant-db";

export async function GET() {
  try {
    const supabase = await createClient();
    const branches = await listBranches(supabase, { activeOnly: true });
    return NextResponse.json({ ok: true, data: branches });
  } catch (error) {
    if (isSupabaseSchemaMissingError(error)) {
      return NextResponse.json({
        ok: true,
        data: [],
        setupRequired: true
      });
    }

    return NextResponse.json({ error: error.message || "Không tải được chi nhánh" }, { status: 500 });
  }
}
