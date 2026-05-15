import { Manrope } from "next/font/google";
import AdminSidebarLayout from "../../components/admin/admin-sidebar-layout";

const manrope = Manrope({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"]
});

export const metadata = {
  title: "Admin Dashboard | San Hô Đỏ Hồ Tràm",
  description: "Khu vực vận hành admin riêng cho đặt bàn, món ăn, voucher, tài xế, đối tác và tích hợp."
};

export default function AdminLayout({ children }) {
  const adminThemeCss = `
    body {
      padding-bottom: 0 !important;
      background: #f4f4f5 !important;
      color: #09090b !important;
      --admin-font: ${manrope.style.fontFamily};
      font-family: var(--admin-font), sans-serif !important;
    }

    .admin-theme {
      min-height: 100vh;
      color: #09090b;
      font-family: var(--admin-font), sans-serif;
    }

    .admin-theme h1,
    .admin-theme h2,
    .admin-theme h3,
    .admin-theme h4,
    .admin-theme h5,
    .admin-theme h6 {
      margin: 0;
      color: #09090b;
      font-family: var(--admin-font), sans-serif;
      font-weight: 600;
      letter-spacing: -0.02em;
      text-transform: none;
      line-height: 1.2;
    }

    .admin-theme h1 {
      font-size: 1rem;
    }

    .admin-theme h2 {
      font-size: 1.125rem;
    }

    .admin-theme h3 {
      font-size: 1rem;
    }

    .admin-theme p {
      color: #71717a;
      line-height: 1.6;
    }

    .admin-theme button,
    .admin-theme input,
    .admin-theme select,
    .admin-theme textarea {
      font-family: var(--admin-font), sans-serif;
    }

    .admin-theme [data-slot="sidebar-wrapper"] {
      background: #f4f4f5;
    }

    .admin-theme main,
    .admin-theme [data-slot="sidebar-inset"] {
      padding-top: 0 !important;
    }

    [data-slot="dialog-content"] {
      font-family: var(--admin-font), sans-serif !important;
    }

    [data-slot="dialog-title"] {
      margin: 0 !important;
      color: #09090b !important;
      font-family: var(--admin-font), sans-serif !important;
      font-size: 1.5rem !important;
      font-weight: 700 !important;
      line-height: 1.2 !important;
      letter-spacing: -0.02em !important;
      text-transform: none !important;
    }

    [data-slot="dialog-description"] {
      font-family: var(--admin-font), sans-serif !important;
    }

    @media (max-width: 640px) {
      [data-slot="dialog-title"] {
        font-size: 1.25rem !important;
      }
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: adminThemeCss }} />
      <div className="admin-theme">
        <AdminSidebarLayout>{children}</AdminSidebarLayout>
      </div>
    </>
  );
}
