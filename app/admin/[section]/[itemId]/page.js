import { notFound } from "next/navigation";
import AdminDashboard from "../../../../components/admin-dashboard";
import { resolveBranchScope } from "../../../../lib/branches";
import { isAdminSectionKey, sectionSupportsDetailPage } from "../../../../lib/admin-sections";
import { requireAdminPage } from "../../../../lib/supabase/auth";
import { getAdminDashboardData, isSupabaseSchemaMissingError, listBranches } from "../../../../lib/restaurant-db";

export const dynamic = "force-dynamic";

export default async function AdminSectionDetailPage({ params, searchParams }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const section = resolvedParams?.section;
  const itemId = resolvedParams?.itemId;

  if (!isAdminSectionKey(section) || !sectionSupportsDetailPage(section) || !itemId) {
    notFound();
  }

  const { supabase, profile, setupRequired } = await requireAdminPage();

  if (setupRequired) {
    return notFound();
  }

  try {
    const branches = await listBranches(supabase);
    const requestedBranchId = resolvedSearchParams?.branch || "";
    const branchScope = resolveBranchScope({
      profile,
      branches,
      requestedBranchId
    });
    const dashboardData = await getAdminDashboardData(supabase, {
      branchId: branchScope.branchFilterId
    });

    return (
      <AdminDashboard
        activeSection={section}
        detailMode
        detailId={itemId}
        initialBranches={dashboardData.branches}
        initialProfiles={dashboardData.profiles}
        initialBranchStaffAssignments={dashboardData.branchStaffAssignments}
        initialReservations={dashboardData.reservations}
        initialVouchers={dashboardData.vouchers}
        initialVoucherCampaigns={dashboardData.voucherCampaigns}
        initialCustomerProfiles={dashboardData.customerProfiles}
        initialVoucherRedemptions={dashboardData.voucherRedemptions}
        initialDrivers={dashboardData.drivers}
        initialDriverReferrals={dashboardData.driverReferrals}
        initialDriverCommissions={dashboardData.driverCommissions}
        initialTravelPartners={dashboardData.travelPartners}
        initialPartnerContracts={dashboardData.partnerContracts}
        initialPartnerBookings={dashboardData.partnerBookings}
        initialIntegrations={dashboardData.integrations}
        initialSyncLogs={dashboardData.syncLogs}
        initialMenuItems={dashboardData.menuItems}
        initialTables={dashboardData.restaurantTables}
        initialOrders={dashboardData.orders}
        initialFeatureStatus={dashboardData.featureStatus}
        activeBranchId={branchScope.activeBranchId}
        canViewAllBranches={branchScope.canViewAll}
        adminProfile={profile}
      />
    );
  } catch (error) {
    if (!isSupabaseSchemaMissingError(error)) {
      throw error;
    }

    notFound();
  }
}
