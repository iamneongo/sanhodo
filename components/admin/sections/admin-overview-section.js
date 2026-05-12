"use client";

import AdminEmptyState from "../admin-empty-state";
import AdminBarChart from "../admin-bar-chart";
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
    <div className="grid w-full min-w-0 gap-4">
      <section className={styles.statsGrid}>
        <AdminStatCard label="Đặt bàn" value={reservationStats.total} detail={`${reservationStats.pending} yêu cầu đang chờ xử lý`} accent="warm" />
        <AdminStatCard label="Đơn hàng" value={orderStats.total} detail={`${orderStats.active} đơn đang phục vụ`} />
        <AdminStatCard label="Thực đơn" value={menuStats.total} detail={`${menuStats.featured} món nổi bật • ${menuStats.lowStock} món cần chú ý`} />
        <AdminStatCard label="Bàn" value={tableStats.total} detail={`${tableStats.available} bàn còn trống`} />
        <AdminStatCard label="Voucher" value={voucherStats.total} detail={`${voucherStats.activeCodes} mã đã phát • ${voucherStats.recent} lead trong 24h`} accent="soft" />
        <AdminStatCard label="Đối tác & giới thiệu" value={partnerStats.total + driverStats.total} detail={`${partnerStats.openBookings} booking đoàn mở • ${driverStats.pendingCommissions} khoản chờ duyệt`} accent="ocean" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <AdminSurfaceCard
          kicker="Theo dõi nhanh"
          title="Lead và hoạt động mới"
          description="Các phát sinh mới nhất trong 24 giờ gần đây theo chi nhánh đang xem."
          className={styles.insightCard}
          bodyClassName="p-0"
        >
          {notificationFeed.length ? (
            <div className="divide-y divide-zinc-100">
              {notificationFeed.map((item) => (
                <article key={item.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <strong className="block text-sm font-semibold text-zinc-900">{item.title}</strong>
                    <p className="mt-1 text-sm text-zinc-500">{item.subtitle}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-500 sm:justify-end">
                    <span className={`${styles.statusBadge} ${styles[`status_${item.status}`] || styles.status_new}`}>{formatLabel(item.status)}</span>
                    <span>{formatDate(item.createdAt)}</span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="p-5">
              <AdminEmptyState title="Chưa có lead mới." description="24 giờ gần nhất chưa phát sinh lead mới trong chi nhánh đang xem." />
            </div>
          )}
        </AdminSurfaceCard>

        <AdminSurfaceCard
          kicker="Hiệu suất vận hành"
          title="Tổng quan nhanh theo nghiệp vụ"
          description="Một vài chỉ số dễ đọc để nắm tình trạng vận hành trong ngày."
          className={styles.insightCard}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">Lead chờ xử lý</div>
              <div className="mt-2 text-2xl font-semibold text-zinc-950">{reservationStats.pending}</div>
              <p className="mt-1 text-sm text-zinc-500">Đặt bàn mới cần đội ngũ phản hồi.</p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">Đơn đang phục vụ</div>
              <div className="mt-2 text-2xl font-semibold text-zinc-950">{orderStats.active}</div>
              <p className="mt-1 text-sm text-zinc-500">Đơn đang trong quá trình chuẩn bị hoặc phục vụ.</p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">Món cần chú ý</div>
              <div className="mt-2 text-2xl font-semibold text-zinc-950">{menuStats.lowStock}</div>
              <p className="mt-1 text-sm text-zinc-500">Bao gồm món giới hạn số lượng và món theo mùa.</p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">Hoa hồng chờ duyệt</div>
              <div className="mt-2 text-2xl font-semibold text-zinc-950">{driverStats.pendingCommissions}</div>
              <p className="mt-1 text-sm text-zinc-500">Khoản giới thiệu cần kiểm tra và xác nhận.</p>
            </div>
          </div>
        </AdminSurfaceCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <AdminSurfaceCard
          kicker="Biểu đồ"
          title="Top món theo doanh thu"
          description="So sánh nhanh các món đang đóng góp doanh thu tốt nhất."
          className={styles.insightCard}
        >
          {topSellingItems.length ? (
            <AdminBarChart
              items={topSellingItems.map((item) => ({
                label: item.name,
                value: item.revenue,
                helper: `${item.quantity} phần đã bán`
              }))}
              formatValue={formatCurrency}
            />
          ) : (
            <div className="p-5">
              <AdminEmptyState title="Chưa đủ dữ liệu order." description="Khi có thêm order, khối top món sẽ tự cập nhật." />
            </div>
          )}
        </AdminSurfaceCard>

        <AdminSurfaceCard
          kicker="Tình trạng thực đơn"
          title="Gợi ý theo dõi tồn món"
          description="Tóm tắt nhanh những nhóm món cần đội vận hành chú ý."
          className={styles.insightCard}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
              <div>
                <strong className="text-sm text-zinc-900">Món nổi bật</strong>
                <p className="text-sm text-zinc-500">Đang được đẩy ở landing page và upsell.</p>
              </div>
              <span className="text-lg font-semibold text-zinc-950">{menuStats.featured}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
              <div>
                <strong className="text-sm text-zinc-900">Món theo mùa</strong>
                <p className="text-sm text-zinc-500">Cần kiểm tra lại giá và khả năng phục vụ.</p>
              </div>
              <span className="text-lg font-semibold text-zinc-950">{menuStats.seasonal}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
              <div>
                <strong className="text-sm text-zinc-900">Số lượng giới hạn</strong>
                <p className="text-sm text-zinc-500">Có thể tác động tới đơn hàng hoặc voucher upsell.</p>
              </div>
              <span className="text-lg font-semibold text-zinc-950">{menuStats.lowStock}</span>
            </div>
          </div>
        </AdminSurfaceCard>
      </section>
    </div>
  );
}
