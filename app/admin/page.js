import AdminDashboard from "../../components/admin-dashboard";
import { requireAdminPage } from "../../lib/supabase/auth";
import { getAdminDashboardData } from "../../lib/restaurant-db";

export const metadata = {
  title: "Admin Dashboard | San Hô Đỏ"
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { supabase, profile } = await requireAdminPage();
  const dashboardData = await getAdminDashboardData(supabase);

  return (
    <AdminDashboard
      initialReservations={dashboardData.reservations}
      initialVouchers={dashboardData.vouchers}
      initialIntegrations={dashboardData.integrations}
      initialSyncLogs={dashboardData.syncLogs}
      initialMenuItems={dashboardData.menuItems}
      initialTables={dashboardData.restaurantTables}
      initialOrders={dashboardData.orders}
      adminProfile={profile}
    />
  );
}
