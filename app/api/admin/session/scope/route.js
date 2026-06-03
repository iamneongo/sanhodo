import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionValue,
  getAdminSessionCookieOptions
} from "../../../../../lib/admin-session";
import { getBranchById } from "../../../../../lib/branches";
import { hasDashboardAccess } from "../../../../../lib/admin-permissions";
import { isSupabaseSchemaMissingError, listBranches } from "../../../../../lib/restaurant-db";
import { requireAdminApi, unauthorizedResponse } from "../../../../../lib/supabase/auth";

async function loadBaseProfile(supabase, userId) {
  const attempts = [
    "id, email, full_name, role, branch_id, branch_code, is_active, last_login_at",
    "id, email, full_name, role, branch_id, is_active, last_login_at",
    "id, email, full_name, role, is_active, last_login_at",
    "id, email, full_name, role"
  ];

  for (const selectClause of attempts) {
    const { data, error } = await supabase
      .from("profiles")
      .select(selectClause)
      .eq("id", userId)
      .maybeSingle();

    if (!error) {
      return data;
    }

    if (!isSupabaseSchemaMissingError(error)) {
      throw error;
    }
  }

  return null;
}

async function loadAssignmentScope(supabase, userId, assignmentId) {
  const { data, error } = await supabase
    .from("branch_staff_assignments")
    .select("*")
    .eq("id", assignmentId)
    .eq("profile_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function POST(request) {
  const context = await requireAdminApi("dashboard.view");
  if (!context) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const scopeValue = String(body.scopeValue || "profile");
    const baseProfile = await loadBaseProfile(context.supabase, context.user.id);

    if (!baseProfile || baseProfile.is_active === false) {
      return unauthorizedResponse("Tài khoản không còn hoạt động.", 403);
    }

    const branches = await listBranches(context.supabase, { activeOnly: false });
    let nextProfile = baseProfile;
    let branch = getBranchById(branches, baseProfile.branch_id);

    if (scopeValue.startsWith("assignment:")) {
      const assignmentId = scopeValue.replace("assignment:", "");
      const assignment = await loadAssignmentScope(context.supabase, context.user.id, assignmentId);

      if (!assignment) {
        return unauthorizedResponse("Phân quyền chi nhánh không hợp lệ.", 403);
      }

      if (!hasDashboardAccess(assignment.role)) {
        return unauthorizedResponse("Vai trò này chưa có portal dashboard.", 403);
      }

      branch = getBranchById(branches, assignment.branch_id);
      nextProfile = {
        ...baseProfile,
        role: assignment.role,
        branch_id: assignment.branch_id || null,
        branch_code: branch?.code || baseProfile.branch_code || "main"
      };
    }

    if (!hasDashboardAccess(nextProfile.role)) {
      return unauthorizedResponse("Vai trò này chưa có quyền vào dashboard.", 403);
    }

    const sessionProfile = {
      id: context.user.id,
      email: context.user.email || baseProfile.email || "",
      full_name: baseProfile.full_name || context.user.email || baseProfile.email || "",
      role: nextProfile.role,
      branch_id: nextProfile.branch_id || null,
      branch_code: nextProfile.branch_code || branch?.code || "main",
      is_active: nextProfile.is_active !== false,
      last_login_at: new Date().toISOString()
    };

    const response = NextResponse.json({
      ok: true,
      data: {
        profile: sessionProfile,
        branchId: sessionProfile.branch_id || "",
        canViewAllBranches: ["super_admin", "admin", "manager"].includes(sessionProfile.role)
      }
    });

    response.cookies.set(
      ADMIN_SESSION_COOKIE,
      createAdminSessionValue({
        user: { id: context.user.id, email: context.user.email || baseProfile.email || "" },
        profile: sessionProfile
      }),
      getAdminSessionCookieOptions()
    );

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Không đổi được vai trò làm việc." },
      { status: 500 }
    );
  }
}
