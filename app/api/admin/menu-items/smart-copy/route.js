import { NextResponse } from "next/server";
import { generateMenuSmartCopy } from "../../../../../lib/menu-smart-copy";
import { requireAdminApi, unauthorizedResponse } from "../../../../../lib/supabase/auth";

export async function POST(request) {
  const context = await requireAdminApi("menu.manage");
  if (!context) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const data = generateMenuSmartCopy(body);
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Không tạo được gợi ý mô tả món." },
      { status: 500 }
    );
  }
}
