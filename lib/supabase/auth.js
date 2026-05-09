import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
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
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error) {
    return { supabase, user: null, profile: null };
  }

  const profile = user ? await loadProfile(supabase, user.id) : null;
  return { supabase, user, profile };
}

export async function requireAdminPage() {
  const context = await getCurrentSession();

  if (!context.user) {
    redirect("/admin/login");
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
