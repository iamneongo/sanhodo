"use client";

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
import styles from "../admin.module.css";

const TAB_ICONS = {
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
  visibleTabs,
  tab,
  onTabChange,
  getTabLabel,
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
        <h1>Studio Dashboard</h1>
        <p>
          Kiến trúc admin tách riêng khỏi landing page, ưu tiên vận hành, dữ liệu và mở rộng module.
        </p>
      </div>

      <div className={styles.sidebarSection}>
        <span className={styles.sidebarLabel}>Workspace</span>
        <div className={styles.sidebarIdentity}>
          <div className={styles.sidebarIdentityHead}>
            <LayoutDashboard size={18} />
            <strong>{adminProfile?.full_name || adminProfile?.email || "Admin"}</strong>
          </div>
          <small>{roleLabels[adminProfile?.role] || adminProfile?.role || "Admin"}</small>
          {selectedBranch ? <small>Đang xem: {selectedBranch.name}</small> : null}
        </div>
        {branches?.length ? (
          <label className={styles.branchControl}>
            <span>Chi nhánh</span>
            <select
              value={activeBranchId || "all"}
              onChange={onBranchChange}
              disabled={!canViewAllBranches && Boolean(selectedBranch)}
            >
              {canViewAllBranches ? <option value="all">Tất cả chi nhánh</option> : null}
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.shortName || branch.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <nav className={styles.sidebarNav}>
        {visibleTabs.map((key) => {
          const Icon = TAB_ICONS[key] || LayoutDashboard;
          return (
            <button
              key={key}
              type="button"
              className={tab === key ? styles.sidebarTabActive : styles.sidebarTab}
              onClick={() => onTabChange(key)}
            >
              <div className={styles.sidebarTabInner}>
                <Icon size={17} />
                <span>{getTabLabel(key)}</span>
              </div>
              {key === "reservations" && reservationStats.pending ? <small>{reservationStats.pending}</small> : null}
              {key === "orders" && orderStats.active ? <small>{orderStats.active}</small> : null}
              {key === "vouchers" && voucherStats.recent ? <small>{voucherStats.recent}</small> : null}
              {key === "drivers" && driverStats.pendingCommissions ? <small>{driverStats.pendingCommissions}</small> : null}
              {key === "partners" && partnerStats.openBookings ? <small>{partnerStats.openBookings}</small> : null}
            </button>
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
        <article className={styles.sidebarMiniCard}>
          <span>Lead chờ</span>
          <strong>{reservationStats.pending}</strong>
        </article>
        <article className={styles.sidebarMiniCard}>
          <span>Order active</span>
          <strong>{orderStats.active}</strong>
        </article>
        <article className={styles.sidebarMiniCard}>
          <span>Pending payout</span>
          <strong>{driverStats.pendingCommissions}</strong>
        </article>
        <article className={styles.sidebarMiniCard}>
          <span>Booking đoàn</span>
          <strong>{partnerStats.openBookings}</strong>
        </article>
      </div>

      <button className={styles.logoutButton} type="button" onClick={onLogout}>
        <LogOut size={16} />
        <span>Đăng xuất</span>
      </button>
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
