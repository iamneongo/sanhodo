import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
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
    .select("id, email, full_name, role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function getCurrentSession() {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const localAdminCookie = cookieStore.get(LOCAL_ADMIN_COOKIE)?.value;

  if (isValidLocalAdminCookieValue(localAdminCookie)) {
    const localAdmin = getLocalAdminProfile();
    return {
      supabase,
      user: localAdmin.user,
      profile: localAdmin.profile,
      isLocalAdmin: true
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

export async function requireAdminPage() {
  const context = await getCurrentSession();

  if (!context.user) {
    redirect("/admin/login");
  }

  if (context.setupRequired) {
    return context;
  }

  if (!context.profile || !["admin", "manager"].includes(context.profile.role)) {
    redirect("/admin/login?error=forbidden");
  }

  return context;
}

export async function requireAdminApi() {
  const context = await getCurrentSession();

  if (!context.user || !context.profile || !["admin", "manager"].includes(context.profile.role)) {
    return null;
  }

  return context;
}

export function unauthorizedResponse(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}
