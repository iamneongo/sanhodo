import { NextResponse } from "next/server";
import { hasAdminPermission, hasDashboardAccess } from "../../../../lib/admin-permissions";
import { getBranchById, resolveBranchScope } from "../../../../lib/branches";
import {
  getAdminDashboardData,
  isSupabaseSchemaMissingError,
  listBranchStaffAssignments,
  listBranches
} from "../../../../lib/restaurant-db";
import { requireAdminApi, unauthorizedResponse } from "../../../../lib/supabase/auth";

async function loadBaseProfile(supabase, userId, fallbackProfile) {
  const attempts = [
    "id, email, full_name, role, branch_id, branch_code, is_active",
    "id, email, full_name, role, branch_id, is_active",
    "id, email, full_name, role"
  ];

  for (const selectClause of attempts) {
    const { data, error } = await supabase
      .from("profiles")
      .select(selectClause)
      .eq("id", userId)
      .maybeSingle();

    if (!error) {
      return data || fallbackProfile;
    }

    if (!isSupabaseSchemaMissingError(error)) {
      throw error;
    }
  }

  return fallbackProfile;
}

function buildRoleSwitchOptions({ profile, baseProfile, userId, assignments, branches }) {
  const options = [];
  const seen = new Set();
  const pushOption = (option) => {
    const key = `${option.role}:${option.branchId || "all"}`;
    if (seen.has(key) || !hasDashboardAccess(option.role)) {
      return;
    }
    seen.add(key);
    options.push(option);
  };

  const baseBranchId = baseProfile?.branch_id || "";
  pushOption({
    value: "profile",
    role: baseProfile?.role || profile.role,
    branchId: baseBranchId,
    branchName: getBranchById(branches, baseBranchId)?.shortName || getBranchById(branches, baseBranchId)?.name || "",
    isCurrent: profile.role === (baseProfile?.role || profile.role) && (profile.branch_id || "") === baseBranchId
  });

  assignments
    .filter((item) => item.profileId === userId)
    .forEach((assignment) => {
      const branch = getBranchById(branches, assignment.branchId);
      pushOption({
        value: `assignment:${assignment.id}`,
        role: assignment.role,
        branchId: assignment.branchId || "",
        branchName: branch?.shortName || branch?.name || "Chi nhánh",
        isCurrent: profile.role === assignment.role && (profile.branch_id || "") === (assignment.branchId || "")
      });
    });

  return options.map((option) => ({
    ...option,
    isCurrent:
      option.isCurrent ||
      (profile.role === option.role && (profile.branch_id || "") === (option.branchId || ""))
  }));
}

export async function GET(request) {
  const context = await requireAdminApi("dashboard.view");

  if (!context) {
    return unauthorizedResponse();
  }

  const { searchParams } = new URL(request.url);
  const requestedBranchId = searchParams.get("branch") || "";
  const branches = await listBranches(context.supabase, { activeOnly: false });
  const branchStaffAssignments = await listBranchStaffAssignments(context.supabase);
  const baseProfile = context.isLocalAdmin
    ? context.profile
    : await loadBaseProfile(context.supabase, context.user.id, context.profile);
  const branchScope = resolveBranchScope({
    profile: context.profile,
    branches,
    requestedBranchId
  });

  const dashboardData = await getAdminDashboardData(context.supabase, {
    branchId: branchScope.branchFilterId
  });

  return NextResponse.json({
    data: {
      adminProfile: context.profile,
      branches: branchScope.branches,
      activeBranchId: branchScope.activeBranchId,
      branchFilterId: branchScope.branchFilterId,
      roleSwitchOptions: buildRoleSwitchOptions({
        profile: context.profile,
        baseProfile,
        userId: context.user.id,
        assignments: branchStaffAssignments,
        branches: branchScope.branches
      }),
      canViewAllBranches: branchScope.canViewAll,
      selectedBranch:
        getBranchById(branchScope.branches, branchScope.branchFilterId) || branchScope.assignedBranch || null,
      canExport: hasAdminPermission(context.profile.role, "dashboard.export"),
      reservationStats: {
        total: dashboardData.reservations.length,
        pending: dashboardData.reservations.filter((item) => ["new", "contacted"].includes(item.status)).length
      },
      orderStats: {
        total: dashboardData.orders.length,
        active: dashboardData.orders.filter((item) => ["confirmed", "preparing", "served"].includes(item.status)).length
      },
      voucherStats: {
        total: dashboardData.vouchers.length,
        recent: dashboardData.vouchers.filter((item) => {
          if (!item.createdAt) return false;
          const createdAt = new Date(item.createdAt).getTime();
          return !Number.isNaN(createdAt) && Date.now() - createdAt <= 24 * 60 * 60 * 1000;
        }).length
      },
      driverStats: {
        total: dashboardData.drivers.length,
        pendingCommissions: dashboardData.driverCommissions.filter((item) => item.status === "pending").length
      },
      partnerStats: {
        total: dashboardData.travelPartners.length,
        openBookings: dashboardData.partnerBookings.filter((item) => ["lead", "confirmed"].includes(item.status)).length
      }
    }
  });
}
