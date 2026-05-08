import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, createAdminSessionToken, validateAdminCredentials } from "../../../../lib/admin-auth";

export async function POST(request) {
  try {
    const body = await request.json();
    const username = body.username?.trim() || "";
    const password = body.password?.trim() || "";

    if (!validateAdminCredentials(username, password)) {
      return NextResponse.json({ error: "Thông tin đăng nhập không đúng" }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(ADMIN_COOKIE_NAME, createAdminSessionToken(), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Không thể đăng nhập" }, { status: 500 });
  }
}
