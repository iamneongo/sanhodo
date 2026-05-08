import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import AdminLoginForm from "../../../components/admin-login-form";
import { ADMIN_COOKIE_NAME, isAdminAuthenticated } from "../../../lib/admin-auth";

export const metadata = {
  title: "Đăng nhập Admin | San Hô Đỏ"
};

export default async function AdminLoginPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (isAdminAuthenticated(session)) {
    redirect("/admin");
  }

  return <AdminLoginForm />;
}
