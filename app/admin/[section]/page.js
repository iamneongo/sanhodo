import { notFound } from "next/navigation";
import AdminDashboard from "../../../components/admin-dashboard";
import { resolveBranchScope } from "../../../lib/branches";
import { isAdminSectionKey } from "../../../lib/admin-sections";
import { requireAdminPage } from "../../../lib/supabase/auth";
import { getAdminDashboardData, isSupabaseSchemaMissingError, listBranches } from "../../../lib/restaurant-db";

export const dynamic = "force-dynamic";

export default async function AdminSectionPage({ params, searchParams }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const section = resolvedParams?.section;

  if (!isAdminSectionKey(section)) {
    notFound();
  }

  const { supabase, profile, setupRequired } = await requireAdminPage();

  if (setupRequired) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "32px",
          background: "linear-gradient(180deg, #fafafa, #f4f4f5)"
        }}
      >
        <section
          style={{
            width: "min(760px, 100%)",
            padding: "32px",
            borderRadius: "24px",
            background: "rgba(255,255,255,0.98)",
            border: "1px solid #e4e4e7",
            boxShadow: "0 8px 24px rgba(24,24,27,0.06)"
          }}
        >
          <p style={{ margin: "0 0 8px", color: "#71717a", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", fontSize: "0.76rem" }}>
            Supabase Setup Required
          </p>
          <h1 style={{ margin: "0 0 12px", color: "#18181b", fontSize: "2rem" }}>
            Thieu bang profiles hoac schema chua duoc apply day du
          </h1>
          <p style={{ margin: "0 0 12px", color: "#71717a", lineHeight: 1.7 }}>
            Hay chay lai file `supabase/schema.sql` de tao bang, trigger va backfill user cu tu
            `auth.users`. Sau do chay `supabase/seed.sql` de gan role admin cho `admin@gmail.com`
            va nap du lieu test.
          </p>
          <p style={{ margin: 0, color: "#71717a", lineHeight: 1.7 }}>
            Khi da chay xong, refresh lai trang admin.
          </p>
        </section>
      </main>
    );
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
        key={`${section}:${branchScope.activeBranchId}:list`}
        activeSection={section}
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

    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "32px",
          background: "linear-gradient(180deg, #fafafa, #f4f4f5)"
        }}
      >
        <section
          style={{
            width: "min(760px, 100%)",
            padding: "32px",
            borderRadius: "24px",
            background: "rgba(255,255,255,0.98)",
            border: "1px solid #e4e4e7",
            boxShadow: "0 8px 24px rgba(24,24,27,0.06)"
          }}
        >
          <p style={{ margin: "0 0 8px", color: "#71717a", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", fontSize: "0.76rem" }}>
            Supabase Setup Required
          </p>
          <h1 style={{ margin: "0 0 12px", color: "#18181b", fontSize: "2rem" }}>
            Dashboard chua the doc du lieu tu Supabase
          </h1>
          <p style={{ margin: "0 0 12px", color: "#71717a", lineHeight: 1.7 }}>
            Project Supabase hien tai chua co cac bang can thiet. Hay chay file
            `supabase/schema.sql`, tao user admin trong Auth va gan role `admin`.
          </p>
          <p style={{ margin: 0, color: "#71717a", lineHeight: 1.7 }}>
            Huong dan chi tiet nam trong file `SUPABASE_SETUP.md`.
          </p>
        </section>
      </main>
    );
  }
}
