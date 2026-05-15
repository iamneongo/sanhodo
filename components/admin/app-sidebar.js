"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Building2,
  BookOpenText,
  Cable,
  CarFront,
  ChefHat,
  ClipboardList,
  Handshake,
  LayoutDashboard,
  LogOut,
  Ticket,
  Users2,
  UtensilsCrossed
} from "lucide-react";
import { ADMIN_SECTIONS } from "@/lib/admin-sections";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from "@/components/ui/sidebar";

const TAB_ICONS = {
  overview: LayoutDashboard,
  branches: Building2,
  staff: Users2,
  reservations: ClipboardList,
  orders: UtensilsCrossed,
  tables: BookOpenText,
  menu: ChefHat,
  vouchers: Ticket,
  drivers: CarFront,
  partners: Handshake,
  integrations: Cable
};

function NavLabel({ children }) {
  const { state } = useSidebar();
  return <>{state === "expanded" ? children : null}</>;
}

export default function AppSidebar({
  visibleSections,
  activeSection,
  reservationStats,
  orderStats,
  voucherStats,
  driverStats,
  partnerStats,
  adminProfile,
  roleLabels,
  branches,
  activeBranchId,
  canViewAllBranches,
  selectedBranch,
  onBranchChange,
  branchFilterId,
  onLogout
}) {
  const { state, isMobile, setOpen } = useSidebar();

  const closeMobileSidebar = () => {
    if (isMobile) {
      setOpen(false);
    }
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg">
              <Link
                href={withBranchQuery("/admin/overview", branchFilterId)}
                onClick={closeMobileSidebar}
              >
                <div className="flex size-9 items-center justify-center overflow-hidden rounded-full bg-[#fff7ee] ring-1 ring-[#eadfca]">
                  <Image
                    src="/assets/logo-coral.png"
                    alt="San Hô Đỏ"
                    width={28}
                    height={28}
                    className="size-7 object-contain"
                    priority
                  />
                </div>
                <NavLabel>
                  <span className="font-semibold tracking-tight text-zinc-900">San Hô Đỏ</span>
                </NavLabel>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {(state === "expanded" || isMobile) && branches?.length ? (
          <SidebarGroup>
            <SidebarGroupLabel>Chi nhánh</SidebarGroupLabel>
            <Select
              value={activeBranchId || "all"}
              onValueChange={onBranchChange}
              disabled={!canViewAllBranches && Boolean(selectedBranch)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn chi nhánh" />
              </SelectTrigger>
              <SelectContent>
                {canViewAllBranches ? <SelectItem value="all">Tất cả</SelectItem> : null}
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.shortName || branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SidebarGroup>
        ) : null}

        <SidebarGroup>
          <SidebarGroupLabel>Điều hướng</SidebarGroupLabel>
          <SidebarMenu>
            {visibleSections.map((key) => {
              const Icon = TAB_ICONS[key] || LayoutDashboard;
              return (
                <SidebarMenuItem key={key}>
                  <SidebarMenuButton asChild isActive={activeSection === key}>
                    <Link
                      href={withBranchQuery(`/admin/${key}`, branchFilterId)}
                      onClick={closeMobileSidebar}
                    >
                      <Icon className="size-4" />
                      <NavLabel>{ADMIN_SECTIONS.find((item) => item.key === key)?.label || key}</NavLabel>
                      {state === "expanded" && key === "reservations" && reservationStats.pending ? <Badge variant="secondary" className="ml-auto">{reservationStats.pending}</Badge> : null}
                      {state === "expanded" && key === "orders" && orderStats.active ? <Badge variant="secondary" className="ml-auto">{orderStats.active}</Badge> : null}
                      {state === "expanded" && key === "vouchers" && voucherStats.recent ? <Badge variant="secondary" className="ml-auto">{voucherStats.recent}</Badge> : null}
                      {state === "expanded" && key === "drivers" && driverStats.pendingCommissions ? <Badge variant="secondary" className="ml-auto">{driverStats.pendingCommissions}</Badge> : null}
                      {state === "expanded" && key === "partners" && partnerStats.openBookings ? <Badge variant="secondary" className="ml-auto">{partnerStats.openBookings}</Badge> : null}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {state === "expanded" ? (
          <Card className="rounded-2xl border-zinc-200 shadow-none">
            <CardContent className="grid gap-1.5 p-4 text-sm">
              <strong className="text-zinc-900">{adminProfile?.full_name || adminProfile?.email || "Admin"}</strong>
              <span className="text-zinc-500">{roleLabels[adminProfile?.role] || adminProfile?.role || "Admin"}</span>
            </CardContent>
          </Card>
        ) : null}
        <Button type="button" variant="outline" className="justify-start" onClick={() => { closeMobileSidebar(); onLogout(); }}>
          <LogOut className="size-4" />
          <NavLabel>Đăng xuất</NavLabel>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

function withBranchQuery(url, branchId) {
  if (!branchId) {
    return url;
  }

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}branch=${encodeURIComponent(branchId)}`;
}
