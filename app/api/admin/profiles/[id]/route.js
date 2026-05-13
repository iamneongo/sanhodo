import { NextResponse } from "next/server";
import { updateProfile } from "../../../../../lib/restaurant-db";
import { requireAdminApi, unauthorizedResponse } from "../../../../../lib/supabase/auth";

export async function PATCH(request, { params }) {
  const context = await requireAdminApi("staff.manage");
  if (!context) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const { id } = await params;

    if (context.user?.id === id && body?.isActive === false) {
      return NextResponse.json(
        { error: "Bạn không thể tự khóa tài khoản đang đăng nhập." },
        { status: 400 }
      );
    }

    const updated = await updateProfile(context.supabase, id, body);

    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: updated });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Không cập nhật được tài khoản nhân sự" }, { status: 500 });
  }
}
