import { NextResponse } from "next/server";
import { importMenuItemsFromCsv } from "../../../../../lib/menu-import";
import { requireAdminApi, unauthorizedResponse } from "../../../../../lib/supabase/auth";

export async function POST(request) {
  const context = await requireAdminApi("menu.manage");
  if (!context) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const csvText = String(body.csvText || "");
    const branchId = String(body.branchId || "").trim();
    const data = await importMenuItemsFromCsv(context.supabase, { csvText, branchId });

    return NextResponse.json({
      ok: true,
      data
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Không import được menu CSV." },
      { status: 500 }
    );
  }
}
