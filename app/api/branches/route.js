import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { DEFAULT_BRANCHES } from "../../../lib/branches";
import { isSupabaseSchemaMissingError, listBranches } from "../../../lib/restaurant-db";
import {
  getSupabaseEnvMissingMessage,
  isSupabaseEnvMissingError
} from "../../../lib/supabase/config";

export async function GET() {
  try {
    const supabase = await createClient();
    const branches = await listBranches(supabase, { activeOnly: true });
    return NextResponse.json({ ok: true, data: branches });
  } catch (error) {
    if (isSupabaseEnvMissingError(error)) {
      return NextResponse.json({
        ok: true,
        data: DEFAULT_BRANCHES,
        setupRequired: true,
        message: getSupabaseEnvMissingMessage()
      });
    }

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
