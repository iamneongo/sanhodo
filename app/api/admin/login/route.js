import { NextResponse } from "next/server";
import {
  createLocalAdminCookieValue,
  getLocalAdminCookieOptions,
  getLocalAdminProfile,
  isLocalAdminEnabled,
  matchesLocalAdminCredentials,
  LOCAL_ADMIN_COOKIE
} from "../../../../lib/local-admin";
import { createClient } from "../../../../lib/supabase/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const email = body.email?.trim() || "";
    const password = body.password?.trim() || "";

    if (!email || !password) {
      return NextResponse.json({ error: "Email và mật khẩu là bắt buộc" }, { status: 400 });
    }

    if (isLocalAdminEnabled() && matchesLocalAdminCredentials(email, password)) {
      const response = NextResponse.json({
        ok: true,
        user: getLocalAdminProfile().user,
        localFallback: true
      });
      response.cookies.set(LOCAL_ADMIN_COOKIE, createLocalAdminCookieValue(), getLocalAdminCookieOptions());
      return response;
    }

    const supabase = await createClient();
    const {
      data: { user },
      error
    } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !user) {
      return NextResponse.json({ error: error?.message || "Đăng nhập thất bại" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    if (!profile || !["admin", "manager"].includes(profile.role)) {
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: "Tài khoản này chưa có quyền truy cập dashboard admin" },
        { status: 403 }
      );
    }

    return NextResponse.json({ ok: true, user: { id: user.id, email: user.email } });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Không thể đăng nhập với Supabase" },
      { status: 500 }
    );
  }
}
