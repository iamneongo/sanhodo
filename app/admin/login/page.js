import { redirect } from "next/navigation";
import AdminLoginForm from "../../../components/admin-login-form";
import { getCurrentSession } from "../../../lib/supabase/auth";

export const metadata = {
  title: "Đăng nhập Admin | San Hô Đỏ"
};

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({ searchParams }) {
  const context = await getCurrentSession();
  const params = (await searchParams) || {};

  if (context.user && context.profile && ["admin", "manager"].includes(context.profile.role)) {
    redirect("/admin");
  }

  const initialError =
    params.error === "forbidden"
      ? "Tài khoản này chưa có quyền vào admin."
      : params.error === "missing-env"
        ? "Môi trường deploy đang thiếu biến Supabase. Hãy thêm NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY trên Vercel."
        : "";

  return <AdminLoginForm initialError={initialError} />;
}
