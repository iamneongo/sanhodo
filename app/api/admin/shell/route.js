import { NextResponse } from "next/server";
import { hasAdminPermission } from "../../../../lib/admin-permissions";
import { getBranchById, resolveBranchScope } from "../../../../lib/branches";
import { getAdminDashboardData, listBranches } from "../../../../lib/restaurant-db";
import { requireAdminApi, unauthorizedResponse } from "../../../../lib/supabase/auth";

export async function GET(request) {
  const context = await requireAdminApi("dashboard.view");

  if (!context) {
    return unauthorizedResponse();
  }

  const { searchParams } = new URL(request.url);
  const requestedBranchId = searchParams.get("branch") || "";
  const branches = await listBranches(context.supabase, { activeOnly: false });
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
