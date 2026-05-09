import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { listMenuItems } from "../../../lib/restaurant-db";

export async function GET() {
  try {
    const supabase = await createClient();
    const items = await listMenuItems(supabase, { availableOnly: true, featuredOnly: true });
    return NextResponse.json({ ok: true, data: items });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Không tải được menu" }, { status: 500 });
  }
}
