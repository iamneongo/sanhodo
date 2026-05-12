"use client";

import { Bell, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import styles from "../admin.module.css";

export default function AdminHeader({
  currentTabLabel,
  adminProfile,
  selectedBranch,
  notificationCount = 0
}) {
  return (
    <Card className={styles.topbar}>
      <CardContent className="flex items-start justify-between gap-5 p-5 md:p-6">
        <div>
          <span className={styles.kicker}>Studio Admin</span>
          <h1>{currentTabLabel}</h1>
          <p>
            Quản lý đặt bàn, món ăn, voucher, tài xế, đối tác và tích hợp trong một dashboard full-width.
            {selectedBranch ? ` Đang xem dữ liệu cho ${selectedBranch.name}.` : ""}
          </p>
        </div>
        <div className={styles.topbarActions}>
          <div className={styles.headerChip}>
            <Search size={15} />
            <span>Tìm kiếm module</span>
          </div>
          <Separator orientation="vertical" className="hidden h-8 md:block" />
          <div className={styles.headerChip}>
            <Bell size={15} />
            <span>{notificationCount} thông báo mới</span>
          </div>
          <Badge variant="secondary" className={styles.adminBadge}>
            {adminProfile?.email || "admin"} • {adminProfile?.role || "admin"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
