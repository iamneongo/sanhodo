import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionValue,
  getAdminSessionCookieOptions
} from "../../../../lib/admin-session";
import {
  createLocalAdminCookieValue,
  getLocalAdminCookieOptions,
  getLocalAdminProfile,
  isLocalAdminEnabled,
  matchesLocalAdminCredentials,
  LOCAL_ADMIN_COOKIE
} from "../../../../lib/local-admin";
import { hasDashboardAccess } from "../../../../lib/admin-permissions";
import { isSupabaseSchemaMissingError } from "../../../../lib/restaurant-db";
import { createClient } from "../../../../lib/supabase/server";

async function loadAdminProfile(supabase, userId) {
  const primary = await supabase
    .from("profiles")
    .select("id, email, full_name, role, branch_id, branch_code, is_active")
    .eq("id", userId)
    .maybeSingle();

  if (!primary.error && primary.data) {
    return primary.data;
  }

  if (primary.error && !isSupabaseSchemaMissingError(primary.error)) {
    throw primary.error;
  }

  const fallback = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", userId)
    .maybeSingle();

  if (fallback.error) {
    throw fallback.error;
  }

      return fallback.data
    ? {
        ...fallback.data,
        branch_id: null,
        branch_code: "main",
        is_active: true
      }
    : null;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const email = body.email?.trim() || "";
    const password = body.password?.trim() || "";

    if (!email || !password) {
      return NextResponse.json({ error: "Email và mật khẩu là bắt buộc" }, { status: 400 });
    }

    if (isLocalAdminEnabled() && matchesLocalAdminCredentials(email, password)) {
      const localAdmin = getLocalAdminProfile();
      const response = NextResponse.json({
        ok: true,
        user: localAdmin.user,
        localFallback: true
      });
      response.cookies.set(LOCAL_ADMIN_COOKIE, createLocalAdminCookieValue(), getLocalAdminCookieOptions());
      response.cookies.set(
        ADMIN_SESSION_COOKIE,
        createAdminSessionValue({
          user: localAdmin.user,
          profile: localAdmin.profile
        }),
        getAdminSessionCookieOptions()
      );
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

    let profile;
    try {
      profile = await loadAdminProfile(supabase, user.id);
    } catch (profileError) {
      if (isSupabaseSchemaMissingError(profileError)) {
        await supabase.auth.signOut();
        return NextResponse.json(
          {
            error:
              "Supabase chua co bang public.profiles. Hay chay supabase/schema.sql roi chay supabase/seed.sql de backfill admin va du lieu mau.",
            setupRequired: true
          },
          { status: 503 }
        );
      }

      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    if (!profile || profile.is_active === false || !hasDashboardAccess(profile.role)) {
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: profile?.is_active === false ? "Tài khoản này đang bị khóa" : "Tài khoản này chưa có quyền truy cập dashboard admin" },
        { status: 403 }
      );
    }

    const { error: loginAuditError } = await supabase
      .from("profiles")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", user.id);

    if (loginAuditError && !isSupabaseSchemaMissingError(loginAuditError)) {
      return NextResponse.json({ error: loginAuditError.message }, { status: 500 });
    }

    const response = NextResponse.json({ ok: true, user: { id: user.id, email: user.email } });
    response.cookies.set(
      ADMIN_SESSION_COOKIE,
      createAdminSessionValue({
        user: { id: user.id, email: user.email },
        profile: {
          id: user.id,
          email: user.email,
          full_name: profile.full_name || user.email,
          role: profile.role,
          branch_id: profile.branch_id || null,
          branch_code: profile.branch_code || "main",
          is_active: profile.is_active !== false,
          last_login_at: new Date().toISOString()
        }
      }),
      getAdminSessionCookieOptions()
    );

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Không thể đăng nhập với Supabase" },
      { status: 500 }
    );
  }
}
