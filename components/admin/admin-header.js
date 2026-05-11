"use client";

import { Bell, Search } from "lucide-react";
import styles from "../admin.module.css";

export default function AdminHeader({
  currentTabLabel,
  adminProfile,
  selectedBranch,
  notificationCount = 0
}) {
  return (
    <header className={styles.topbar}>
      <div>
        <span className={styles.kicker}>Admin Dashboard</span>
        <h1>{currentTabLabel}</h1>
        <p>
          Quản lý đặt bàn, món ăn, voucher, tài xế, đối tác và tích hợp trên một admin riêng.
          {selectedBranch ? ` Đang xem dữ liệu cho ${selectedBranch.name}.` : ""}
        </p>
      </div>
      <div className={styles.topbarActions}>
        <div className={styles.headerChip}>
          <Search size={15} />
          <span>Tìm kiếm module</span>
        </div>
        <div className={styles.headerChip}>
          <Bell size={15} />
          <span>{notificationCount} thông báo mới</span>
        </div>
        <span className={styles.adminBadge}>
          {adminProfile?.email || "admin"} • {adminProfile?.role || "admin"}
        </span>
      </div>
    </header>
  );
}
