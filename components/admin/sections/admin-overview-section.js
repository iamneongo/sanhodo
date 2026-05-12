"use client";

import AdminEmptyState from "../admin-empty-state";
import AdminStatCard from "../admin-stat-card";
import AdminSurfaceCard from "../admin-surface-card";
import styles from "../../admin.module.css";

export default function AdminOverviewSection({
  reservationStats,
  orderStats,
  voucherStats,
  driverStats,
  partnerStats,
  menuStats,
  tableStats,
  notificationFeed,
  topSellingItems,
  formatDate,
  formatCurrency,
  formatLabel
}) {
  return (
    <>
      <section className={styles.statsGrid}>
        <AdminStatCard label="Đặt bàn" value={reservationStats.total} detail={`${reservationStats.pending} yêu cầu đang chờ xử lý`} accent="warm" />
        <AdminStatCard label="Đơn hàng" value={orderStats.total} detail={`${orderStats.active} đơn đang phục vụ`} />
        <AdminStatCard label="Thực đơn" value={menuStats.total} detail={`${menuStats.featured} món nổi bật • ${menuStats.lowStock} món cần chú ý`} />
        <AdminStatCard label="Bàn" value={tableStats.total} detail={`${tableStats.available} bàn còn trống`} />
        <AdminStatCard label="Voucher" value={voucherStats.total} detail={`${voucherStats.activeCodes} mã đã phát • ${voucherStats.recent} lead trong 24h`} accent="soft" />
        <AdminStatCard label="Tài xế" value={driverStats.total} detail={`${driverStats.active} đang hoạt động • ${driverStats.pendingCommissions} khoản chờ duyệt`} />
        <AdminStatCard label="Đối tác" value={partnerStats.total} detail={`${partnerStats.openBookings} booking đoàn đang mở • ${partnerStats.active} đối tác hoạt động`} accent="ocean" />
      </section>

      <section className={styles.insightsGrid}>
        <AdminSurfaceCard
          kicker="Thông báo mới"
          title="Lead trong 24 giờ gần nhất"
          className={styles.insightCard}
        >
          <div className={styles.notificationList}>
            {notificationFeed.length ? (
              notificationFeed.map((item) => (
                <article key={item.id} className={styles.notificationItem}>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.subtitle}</p>
                  </div>
                  <div className={styles.notificationMeta}>
                    <span className={`${styles.statusBadge} ${styles[`status_${item.status}`] || styles.status_new}`}>{formatLabel(item.status)}</span>
                    <small>{formatDate(item.createdAt)}</small>
                  </div>
                </article>
              ))
            ) : (
              <AdminEmptyState title="Chưa có lead mới." description="24 giờ gần nhất chưa phát sinh lead mới trong chi nhánh đang xem." />
            )}
          </div>
        </AdminSurfaceCard>

        <AdminSurfaceCard
          kicker="Analytics cơ bản"
          title="Top món và tình trạng thực đơn"
          className={styles.insightCard}
        >
          <div className={styles.metricStack}>
            {topSellingItems.length ? (
              topSellingItems.map((item) => (
                <div key={item.name} className={styles.metricRow}>
                  <div>
                    <strong>{item.name}</strong>
                    <p>{item.quantity} phần đã bán</p>
                  </div>
                  <span>{formatCurrency(item.revenue)}</span>
                </div>
              ))
            ) : (
              <AdminEmptyState title="Chưa đủ dữ liệu order." description="Khi có thêm order, khối top món sẽ tự cập nhật." />
            )}
          </div>
          <div className={styles.metricSummary}>
            <span>{menuStats.seasonal} món đang theo mùa</span>
            <span>{menuStats.lowStock} món số lượng giới hạn</span>
          </div>
        </AdminSurfaceCard>
      </section>
    </>
  );
}
