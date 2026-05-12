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
import styles from "../admin.module.css";

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
  canExport,
  branchFilterId,
  onLogout
}) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarBrand}>
        <span className={styles.kicker}>San Hô Đỏ Admin</span>
        <h1>Operations Dashboard</h1>
        <p>
          Vận hành nhà hàng theo mô hình module, với shell và control bám sát dashboard shadcn hiện đại.
        </p>
      </div>

      <div className={styles.sidebarSection}>
        <span className={styles.sidebarLabel}>Workspace</span>
        <Card className={styles.sidebarIdentity}>
          <CardContent className="grid gap-1.5 p-4">
            <div className={styles.sidebarIdentityHead}>
              <LayoutDashboard size={18} />
              <strong>{adminProfile?.full_name || adminProfile?.email || "Admin"}</strong>
            </div>
            <Badge variant="outline" className="w-fit">
              {roleLabels[adminProfile?.role] || adminProfile?.role || "Admin"}
            </Badge>
            {selectedBranch ? <small>Đang xem: {selectedBranch.name}</small> : null}
          </CardContent>
        </Card>
        {branches?.length ? (
          <label className={styles.branchControl}>
            <span>Chi nhánh</span>
            <Select
              value={activeBranchId || "all"}
              onValueChange={(value) => onBranchChange({ target: { value } })}
              disabled={!canViewAllBranches && Boolean(selectedBranch)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn chi nhánh" />
              </SelectTrigger>
              <SelectContent>
                {canViewAllBranches ? <SelectItem value="all">Tất cả chi nhánh</SelectItem> : null}
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.shortName || branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        ) : null}
      </div>

      <nav className={styles.sidebarNav}>
        {visibleSections.map((key) => {
          const Icon = TAB_ICONS[key] || LayoutDashboard;
          return (
            <Button
              key={key}
              asChild
              variant={activeSection === key ? "default" : "ghost"}
              className={activeSection === key ? styles.sidebarTabActive : styles.sidebarTab}
            >
              <Link href={withBranchQuery(`/admin/${key}`, branchFilterId)}>
                <div className={styles.sidebarTabInner}>
                  <Icon size={17} />
                  <span>{ADMIN_SECTIONS.find((item) => item.key === key)?.label || key}</span>
                </div>
                {key === "reservations" && reservationStats.pending ? <Badge variant="secondary">{reservationStats.pending}</Badge> : null}
                {key === "orders" && orderStats.active ? <Badge variant="secondary">{orderStats.active}</Badge> : null}
                {key === "vouchers" && voucherStats.recent ? <Badge variant="secondary">{voucherStats.recent}</Badge> : null}
                {key === "drivers" && driverStats.pendingCommissions ? <Badge variant="secondary">{driverStats.pendingCommissions}</Badge> : null}
                {key === "partners" && partnerStats.openBookings ? <Badge variant="secondary">{partnerStats.openBookings}</Badge> : null}
              </Link>
            </Button>
          );
        })}
      </nav>

      <div className={styles.sidebarSection}>
        <span className={styles.sidebarLabel}>Xuất dữ liệu</span>
        <div className={styles.sidebarActions}>
          {canExport ? <a className={styles.exportButton} href={withBranchQuery("/api/admin/export?type=reservations", branchFilterId)}>Export đặt bàn</a> : null}
          {canExport ? <a className={styles.exportButton} href={withBranchQuery("/api/admin/export?type=vouchers", branchFilterId)}>Export voucher</a> : null}
          {canExport ? <a className={styles.exportButton} href={withBranchQuery("/api/admin/export?type=driver-commissions", branchFilterId)}>Export hoa hồng</a> : null}
          {canExport ? <a className={styles.exportButton} href={withBranchQuery("/api/admin/export?type=partner-bookings", branchFilterId)}>Export booking đoàn</a> : null}
        </div>
      </div>

      <div className={styles.sidebarMiniGrid}>
        <Card className={styles.sidebarMiniCard}><CardContent className="grid gap-1.5 p-4"><span>Lead chờ</span><strong>{reservationStats.pending}</strong></CardContent></Card>
        <Card className={styles.sidebarMiniCard}><CardContent className="grid gap-1.5 p-4"><span>Order active</span><strong>{orderStats.active}</strong></CardContent></Card>
        <Card className={styles.sidebarMiniCard}><CardContent className="grid gap-1.5 p-4"><span>Pending payout</span><strong>{driverStats.pendingCommissions}</strong></CardContent></Card>
        <Card className={styles.sidebarMiniCard}><CardContent className="grid gap-1.5 p-4"><span>Booking đoàn</span><strong>{partnerStats.openBookings}</strong></CardContent></Card>
      </div>

      <Button className={styles.logoutButton} type="button" onClick={onLogout}>
        <LogOut size={16} />
        <span>Đăng xuất</span>
      </Button>
    </aside>
  );
}

function withBranchQuery(url, branchId) {
  if (!branchId) {
    return url;
  }

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}branchId=${encodeURIComponent(branchId)}`;
}
