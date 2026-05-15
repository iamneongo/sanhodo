"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import AppSidebar from "./app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { hasAdminPermission } from "@/lib/admin-permissions";
import { ADMIN_SECTIONS } from "@/lib/admin-sections";

const roleLabels = {
  admin: "Quản trị viên",
  manager: "Quản lý",
  staff: "Nhân viên",
  super_admin: "Quản trị tổng",
  branch_manager: "Quản lý chi nhánh",
  driver: "Tài xế"
};

function getActiveSection(pathname = "") {
  const parts = pathname.split("/").filter(Boolean);
  const section = parts[1];
  return ADMIN_SECTIONS.some((item) => item.key === section) ? section : "overview";
}

export default function AdminSidebarLayout({ children }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [shellData, setShellData] = useState(null);

  const activeSection = useMemo(() => getActiveSection(pathname), [pathname]);
  const branchId = searchParams.get("branch") || "all";
  const isLoginRoute = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginRoute) return;

    let cancelled = false;

    async function loadShell() {
      try {
        const query = branchId && branchId !== "all" ? `?branch=${encodeURIComponent(branchId)}` : "";
        const response = await fetch(`/api/admin/shell${query}`, {
          credentials: "include",
          cache: "no-store"
        });

        if (!response.ok) return;

        const payload = await response.json();
        if (!cancelled) {
          setShellData(payload.data || null);
        }
      } catch {
        if (!cancelled) {
          setShellData(null);
        }
      }
    }

    loadShell();
    return () => {
      cancelled = true;
    };
  }, [branchId, isLoginRoute]);

  const visibleSections = useMemo(() => {
    const role = shellData?.adminProfile?.role || "";
    return ADMIN_SECTIONS.filter((item) => hasAdminPermission(role, item.permission)).map((item) => item.key);
  }, [shellData]);

  const handleBranchChange = (nextBranchId) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!nextBranchId || nextBranchId === "all") {
      params.delete("branch");
    } else {
      params.set("branch", nextBranchId);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
    router.refresh();
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  if (isLoginRoute || !shellData) {
    return children;
  }

  return (
    <SidebarProvider
      defaultOpen
      style={{
        "--sidebar-width": "17rem",
        "--sidebar-width-collapsed": "4.5rem"
      }}
    >
      <div className="flex min-h-svh w-full bg-zinc-50">
        <AppSidebar
          visibleSections={visibleSections}
          activeSection={activeSection}
          reservationStats={shellData.reservationStats}
          orderStats={shellData.orderStats}
          voucherStats={shellData.voucherStats}
          driverStats={shellData.driverStats}
          partnerStats={shellData.partnerStats}
          adminProfile={shellData.adminProfile}
          roleLabels={roleLabels}
          branches={shellData.branches}
          activeBranchId={shellData.activeBranchId || "all"}
          canViewAllBranches={shellData.canViewAllBranches}
          selectedBranch={shellData.selectedBranch}
          onBranchChange={handleBranchChange}
          canExport={shellData.canExport}
          branchFilterId={shellData.branchFilterId}
          onLogout={handleLogout}
        />
        <SidebarInset className="w-full min-w-0 bg-zinc-50">{children}</SidebarInset>
      </div>
    </SidebarProvider>
  );
}
