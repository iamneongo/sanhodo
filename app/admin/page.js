import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import AdminDashboard from "../../components/admin-dashboard";
import { ADMIN_COOKIE_NAME, getAdminCredentials, isAdminAuthenticated } from "../../lib/admin-auth";
import { readLeads, RESERVATIONS_FILE, VOUCHERS_FILE } from "../../lib/lead-store";
import { getIntegrationSettings, getSyncLogs } from "../../lib/integrations-store";

export const metadata = {
  title: "Admin Dashboard | San Hô Đỏ"
};

export default async function AdminPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (!isAdminAuthenticated(session)) {
    redirect("/admin/login");
  }

  const reservations = await readLeads(RESERVATIONS_FILE, "reservation");
  const vouchers = await readLeads(VOUCHERS_FILE, "voucher");
  const integrations = await getIntegrationSettings();
  const syncLogs = await getSyncLogs();
  const { username } = getAdminCredentials();

  return (
    <AdminDashboard
      initialReservations={reservations}
      initialVouchers={vouchers}
      initialIntegrations={integrations}
      initialSyncLogs={syncLogs}
      adminUsername={username}
    />
  );
}
