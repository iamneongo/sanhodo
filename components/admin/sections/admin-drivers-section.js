"use client";

import AdminDetailHeader from "../admin-detail-header";
import AdminFormDialog from "../admin-form-dialog";
import AdminActiveFilters from "../admin-active-filters";
import AdminEmptyState from "../admin-empty-state";
import AdminPageToolbar from "../admin-page-toolbar";
import AdminSurfaceCard from "../admin-surface-card";
import AdminTableFooter from "../admin-table-footer";
import { AdminDetailShell, AdminListShell } from "../admin-panel-shell";
import useTablePagination from "../use-table-pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import styles from "../../admin.module.css";

export default function AdminDriversSection({
  detailOnlyLayout,
  permissions,
  driverCreateOpen,
  setDriverCreateOpen,
  driverQuery,
  setDriverQuery,
  driverStatusFilter,
  setDriverStatusFilter,
  driverSort,
  setDriverSort,
  driverStatuses,
  driverSortOptions,
  createDriverEntry,
  driverDraft,
  setDriverDraft,
  tableSaving,
  filteredDrivers,
  selectedDriver,
  openSectionDetail,
  formatLabel,
  formatCurrency,
  detailHeaderActions,
  deleteDriverEntry,
  driverCommissions,
  driverEdit,
  setDriverEdit,
  saveDriverEdit,
  driverReferrals,
  driverFeatureStatus,
  FormSelect
}) {
  const pagination = useTablePagination(filteredDrivers);
  const driversReady = driverFeatureStatus?.ready !== false;
  const driverSetupMessage =
    driverFeatureStatus?.message ||
    "Tinh nang tai xe hien chua san sang tren project Supabase nay.";
  const activeFilterItems = [
    {
      key: "query",
      active: Boolean(driverQuery.trim()),
      label: `Tìm: ${driverQuery.trim()}`,
      onClear: () => setDriverQuery("")
    },
    {
      key: "status",
      active: driverStatusFilter !== "all",
      label: `Trạng thái: ${formatLabel(driverStatusFilter)}`,
      onClear: () => setDriverStatusFilter("all")
    },
    {
      key: "sort",
      active: driverSort !== "name_asc",
      label: `Sắp xếp: ${driverSortOptions.find((item) => item.value === driverSort)?.label || driverSort}`,
      onClear: () => setDriverSort("name_asc")
    }
  ];

  return (
    <section className="grid w-full min-w-0 gap-4">
      {!detailOnlyLayout ? (
        <AdminListShell>
          <AdminPageToolbar
            actions={
              permissions.canManageDrivers && driversReady ? (
                <Button type="button" variant="secondary" onClick={() => setDriverCreateOpen(true)}>
                  Tạo tài xế
                </Button>
              ) : null
            }
            footer={
              <AdminActiveFilters
                items={activeFilterItems}
                onClearAll={() => {
                  setDriverQuery("");
                  setDriverStatusFilter("all");
                  setDriverSort("name_asc");
                }}
              />
            }
          >
            <Input
              type="search"
              placeholder="Tìm tài xế / mã giới thiệu..."
              value={driverQuery}
              onChange={(event) => setDriverQuery(event.target.value)}
            />
            <FormSelect
              value={driverStatusFilter}
              onValueChange={setDriverStatusFilter}
              options={[{ value: "all", label: "Tất cả trạng thái" }, ...driverStatuses]}
              placeholder="Lọc trạng thái"
            />
            <FormSelect value={driverSort} onValueChange={setDriverSort} options={driverSortOptions} placeholder="Sắp xếp" />
          </AdminPageToolbar>

          {!driversReady ? (
            <AdminSurfaceCard
              kicker="Can hoan tat setup"
              title="Tinh nang tai xe chua san sang"
              className={styles.subsectionCard}
            >
              <p>{driverSetupMessage}</p>
            </AdminSurfaceCard>
          ) : null}

          {permissions.canManageDrivers && driversReady ? (
            <AdminFormDialog
              open={driverCreateOpen}
              onOpenChange={setDriverCreateOpen}
              title="Tạo tài xế / mã giới thiệu"
              description="Khai báo tài xế, mã giới thiệu và tỷ lệ hoa hồng."
              size="medium"
            >
            <form className={styles.inlineForm} onSubmit={createDriverEntry}>
              <Input
                type="text"
                placeholder="Mã tài xế"
                value={driverDraft.code}
                onChange={(event) => setDriverDraft((prev) => ({ ...prev, code: event.target.value }))}
                required
              />
              <Input
                type="text"
                placeholder="Tên tài xế"
                value={driverDraft.fullName}
                onChange={(event) => setDriverDraft((prev) => ({ ...prev, fullName: event.target.value }))}
                required
              />
              <div className={styles.inlineRow}>
                <Input
                  type="tel"
                  placeholder="SĐT"
                  value={driverDraft.phone}
                  onChange={(event) => setDriverDraft((prev) => ({ ...prev, phone: event.target.value }))}
                  required
                />
                <Input
                  type="text"
                  placeholder="Loại xe"
                  value={driverDraft.vehicleType}
                  onChange={(event) => setDriverDraft((prev) => ({ ...prev, vehicleType: event.target.value }))}
                />
              </div>
              <div className={styles.inlineRow}>
                <Input
                  type="text"
                  placeholder="Mã giới thiệu"
                  value={driverDraft.referralCode}
                  onChange={(event) => setDriverDraft((prev) => ({ ...prev, referralCode: event.target.value }))}
                />
                <Input
                  type="number"
                  min="0"
                  placeholder="% hoa hồng"
                  value={driverDraft.commissionRate}
                  onChange={(event) => setDriverDraft((prev) => ({ ...prev, commissionRate: Number(event.target.value) }))}
                />
              </div>
              <Textarea
                placeholder="Ghi chú"
                rows={3}
                value={driverDraft.notes}
                onChange={(event) => setDriverDraft((prev) => ({ ...prev, notes: event.target.value }))}
              />
              <Button type="submit" loading={tableSaving} loadingLabel="Đang tạo...">
                Lưu tài xế
              </Button>
            </form>
            </AdminFormDialog>
          ) : null}

          <div className={styles.tableWrap}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tài xế</TableHead>
                  <TableHead>Mã giới thiệu</TableHead>
                  <TableHead>Hoa hồng</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagination.pagedItems.map((item) => (
                  <TableRow
                    key={item.id}
                    className={styles.interactiveRow}
                    onClick={() => openSectionDetail("drivers", item.id)}
                  >
                    <TableCell data-label="Tài xế">
                      <strong>{item.fullName}</strong>
                      <span>{item.phone}</span>
                    </TableCell>
                    <TableCell data-label="Mã giới thiệu">{item.referralCode || "-"}</TableCell>
                    <TableCell data-label="Hoa hồng">{item.commissionRate}%</TableCell>
                    <TableCell data-label="Trạng thái">
                      <span className={`${styles.statusBadge} ${styles[`status_${item.status}`] || styles.status_confirmed}`}>
                        {formatLabel(item.status)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <AdminTableFooter {...pagination} />
        </AdminListShell>
      ) : null}

      {detailOnlyLayout ? (
        <AdminDetailShell>
          {!driversReady ? (
            <AdminEmptyState
              title="Tinh nang tai xe chua san sang."
              description={driverSetupMessage}
            />
          ) : selectedDriver ? (
            <div>
              <AdminDetailHeader
                kicker="Tài xế / giới thiệu"
                title={selectedDriver.fullName}
                actions={detailHeaderActions(
                  "drivers",
                  permissions.canManageDrivers ? (
                    <Button className={styles.deleteButton} variant="destructive" type="button" onClick={() => deleteDriverEntry(selectedDriver.id)}>
                      Xóa tài xế
                    </Button>
                  ) : null
                )}
              />

              <div className={styles.metaGrid}>
                <div><span>Mã tài xế</span><strong>{selectedDriver.code}</strong></div>
                <div><span>Mã giới thiệu</span><strong>{selectedDriver.referralCode || "-"}</strong></div>
                <div><span>Hoa hồng</span><strong>{selectedDriver.commissionRate}%</strong></div>
                <div>
                  <span>Hoa hồng chờ duyệt</span>
                  <strong>
                    {formatCurrency(
                      driverCommissions
                        .filter((item) => item.driverId === selectedDriver.id && item.status === "pending")
                        .reduce((sum, item) => sum + item.commissionAmount, 0)
                    )}
                  </strong>
                </div>
              </div>

              <div className={styles.editGrid}>
                <label><span>Tên tài xế</span><Input type="text" value={driverEdit.fullName} disabled={!permissions.canManageDrivers} onChange={(event) => setDriverEdit((prev) => ({ ...prev, fullName: event.target.value }))} /></label>
                <label><span>SĐT</span><Input type="text" value={driverEdit.phone} disabled={!permissions.canManageDrivers} onChange={(event) => setDriverEdit((prev) => ({ ...prev, phone: event.target.value }))} /></label>
                <label><span>Loại xe</span><Input type="text" value={driverEdit.vehicleType} disabled={!permissions.canManageDrivers} onChange={(event) => setDriverEdit((prev) => ({ ...prev, vehicleType: event.target.value }))} /></label>
                <label><span>% hoa hồng</span><Input type="number" min="0" value={driverEdit.commissionRate} disabled={!permissions.canManageDrivers} onChange={(event) => setDriverEdit((prev) => ({ ...prev, commissionRate: Number(event.target.value) }))} /></label>
                <label><span>Mã giới thiệu</span><Input type="text" value={driverEdit.referralCode} disabled={!permissions.canManageDrivers} onChange={(event) => setDriverEdit((prev) => ({ ...prev, referralCode: event.target.value }))} /></label>
                <label><span>Trạng thái</span><FormSelect value={driverEdit.status} disabled={!permissions.canManageDrivers} onValueChange={(value) => setDriverEdit((prev) => ({ ...prev, status: value }))} options={driverStatuses} /></label>
                <label className={styles.fullWidth}><span>Ghi chú</span><Textarea rows={4} value={driverEdit.notes} disabled={!permissions.canManageDrivers} onChange={(event) => setDriverEdit((prev) => ({ ...prev, notes: event.target.value }))} /></label>
              </div>
              {permissions.canManageDrivers ? (
                <div className={styles.detailActions}>
                  <Button
                    type="button"
                    className={styles.saveButton}
                    onClick={saveDriverEdit}
                    loading={tableSaving}
                    loadingLabel="Đang lưu..."
                  >
                    Lưu tài xế
                  </Button>
                </div>
              ) : null}

              <AdminSurfaceCard kicker="Giới thiệu gần đây" title="Lead do tài xế giới thiệu" className={styles.subsectionCard}>
                <div className={styles.logList}>
                  {driverReferrals
                    .filter((item) => item.driverId === selectedDriver.id)
                    .slice(0, 6)
                    .map((item) => (
                      <article key={item.id} className={styles.logItem}>
                        <div className={styles.logHead}>
                          <strong>{item.referredName || item.referredPhone}</strong>
                          <span className={`${styles.statusBadge} ${styles[`status_${item.status}`] || styles.status_new}`}>{formatLabel(item.status)}</span>
                        </div>
                        <small>{item.referralCode || "-"}</small>
                        <p>Base {formatCurrency(item.commissionBaseAmount)} • Hoa hồng {formatCurrency(item.commissionAmount)}</p>
                      </article>
                    ))}
                  {!driverReferrals.filter((item) => item.driverId === selectedDriver.id).length ? (
                    <AdminEmptyState title="Chưa có lượt giới thiệu." description="Khi tài xế phát sinh lead mới, danh sách giới thiệu sẽ xuất hiện ở đây." />
                  ) : null}
                </div>
              </AdminSurfaceCard>

              <AdminSurfaceCard kicker="Hoa hồng" title="Giao dịch hoa hồng" className={styles.subsectionCard}>
                <div className={styles.logList}>
                  {driverCommissions
                    .filter((item) => item.driverId === selectedDriver.id)
                    .slice(0, 6)
                    .map((item) => (
                      <article key={item.id} className={styles.logItem}>
                        <div className={styles.logHead}>
                          <strong>{formatCurrency(item.commissionAmount)}</strong>
                          <span className={`${styles.statusBadge} ${styles[`status_${item.status}`] || styles.status_new}`}>{formatLabel(item.status)}</span>
                        </div>
                        <small>Đơn hàng: {item.orderId || "-"} • Đặt bàn: {item.reservationId || "-"}</small>
                        <p>{item.notes || "Chưa có ghi chú chi trả."}</p>
                      </article>
                    ))}
                  {!driverCommissions.filter((item) => item.driverId === selectedDriver.id).length ? (
                    <AdminEmptyState title="Chưa có giao dịch hoa hồng." description="Các giao dịch hoa hồng sẽ hiển thị sau khi có lượt giới thiệu hoặc thanh toán." />
                  ) : null}
                </div>
              </AdminSurfaceCard>
            </div>
          ) : (
            <AdminEmptyState title="Chưa có tài xế." description="Tạo tài xế mới hoặc quay lại danh sách để kiểm tra bộ lọc." />
          )}
        </AdminDetailShell>
      ) : null}
    </section>
  );
}
