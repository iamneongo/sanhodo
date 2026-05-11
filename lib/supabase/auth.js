import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { hasAdminPermission, hasDashboardAccess } from "../admin-permissions";
import { ADMIN_SESSION_COOKIE, parseAdminSessionValue } from "../admin-session";
import {
  getLocalAdminProfile,
  isValidLocalAdminCookieValue,
  LOCAL_ADMIN_COOKIE
} from "../local-admin";
import { isSupabaseSchemaMissingError } from "../restaurant-db";
import { createClient } from "./server";

async function loadProfile(supabase, userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, branch_id, branch_code, last_login_at")
    .eq("id", userId)
    .maybeSingle();

  if (!error) {
    return data;
  }

  if (!isSupabaseSchemaMissingError(error)) {
    throw error;
  }

  const fallback = await supabase
    .from("profiles")
    .select("id, email, full_name, role, branch_code")
    .eq("id", userId)
    .maybeSingle();

  if (!fallback.error && fallback.data) {
    return {
      ...fallback.data,
      branch_id: null,
      branch_code: fallback.data.branch_code || "main",
      last_login_at: null
    };
  }

  if (fallback.error && !isSupabaseSchemaMissingError(fallback.error)) {
    throw fallback.error;
  }

  const minimal = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", userId)
    .maybeSingle();

  if (minimal.error) {
    throw minimal.error;
  }

  if (!minimal.data) {
    return null;
  }

  return {
    ...minimal.data,
    branch_id: null,
    branch_code: "main",
    last_login_at: null
  };
}

export async function getCurrentSession() {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const localAdminCookie = cookieStore.get(LOCAL_ADMIN_COOKIE)?.value;
  const adminSessionCookie = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (isValidLocalAdminCookieValue(localAdminCookie)) {
    const localAdmin = getLocalAdminProfile();
    return {
      supabase,
      user: localAdmin.user,
      profile: localAdmin.profile,
      isLocalAdmin: true
    };
  }

  const adminSession = parseAdminSessionValue(adminSessionCookie);
  if (adminSession?.user && adminSession?.profile) {
    return {
      supabase,
      user: adminSession.user,
      profile: adminSession.profile,
      isLocalAdmin: false,
      setupRequired: false
    };
  }

  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error) {
    return { supabase, user: null, profile: null, isLocalAdmin: false, setupRequired: false };
  }

  if (!user) {
    return { supabase, user: null, profile: null, isLocalAdmin: false, setupRequired: false };
  }

  try {
    const profile = await loadProfile(supabase, user.id);
    return { supabase, user, profile, isLocalAdmin: false, setupRequired: false };
  } catch (profileError) {
    if (!isSupabaseSchemaMissingError(profileError)) {
      throw profileError;
    }

    return {
      supabase,
      user,
      profile: null,
      isLocalAdmin: false,
      setupRequired: true,
      profileError
    };
  }
}

export async function requireAdminPage(permission = "dashboard.view") {
  const context = await getCurrentSession();

  if (!context.user) {
    redirect("/admin/login");
  }

  if (context.setupRequired) {
    return context;
  }

  if (!context.profile || !hasDashboardAccess(context.profile.role) || !hasAdminPermission(context.profile.role, permission)) {
    redirect("/admin/login?error=forbidden");
  }

  return context;
}

export async function requireAdminApi(permission = "dashboard.view") {
  const context = await getCurrentSession();

  if (
    !context.user ||
    !context.profile ||
    !hasDashboardAccess(context.profile.role) ||
    !hasAdminPermission(context.profile.role, permission)
  ) {
    return null;
  }

  return context;
}

export function unauthorizedResponse(message = "Unauthorized", status = 401) {
  return NextResponse.json({ error: message }, { status });
}
