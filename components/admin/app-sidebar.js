"use client";

import Link from "next/link";
import {
  BookOpenText,
  Cable,
  CarFront,
  ChefHat,
  ClipboardList,
  Handshake,
  LayoutDashboard,
  LogOut,
  Ticket,
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
  const { state } = useSidebar();

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive size="lg">
              <Link href={withBranchQuery("/admin/overview", branchFilterId)}>
                <LayoutDashboard className="size-4" />
                <NavLabel>San Hô Đỏ</NavLabel>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {branches?.length ? (
          <SidebarGroup>
            <SidebarGroupLabel>Chi nhánh</SidebarGroupLabel>
            <Select
              value={activeBranchId || "all"}
              onValueChange={(value) => onBranchChange({ target: { value } })}
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
          <SidebarGroupLabel>Modules</SidebarGroupLabel>
          <SidebarMenu>
            {visibleSections.map((key) => {
              const Icon = TAB_ICONS[key] || LayoutDashboard;
              return (
                <SidebarMenuItem key={key}>
                  <SidebarMenuButton asChild isActive={activeSection === key}>
                    <Link href={withBranchQuery(`/admin/${key}`, branchFilterId)}>
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
          <Card>
            <CardContent className="grid gap-1 p-4 text-sm">
              <strong className="text-zinc-900">{adminProfile?.full_name || adminProfile?.email || "Admin"}</strong>
              <span className="text-zinc-500">{roleLabels[adminProfile?.role] || adminProfile?.role || "Admin"}</span>
            </CardContent>
          </Card>
        ) : null}
        <Button type="button" variant="outline" className="justify-start" onClick={onLogout}>
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
  return `${url}${separator}branchId=${encodeURIComponent(branchId)}`;
}
