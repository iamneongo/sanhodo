"use client";

import AdminDetailHeader from "../admin-detail-header";
import AdminFormDialog from "../admin-form-dialog";
import AdminActiveFilters from "../admin-active-filters";
import AdminEmptyState from "../admin-empty-state";
import AdminPageToolbar from "../admin-page-toolbar";
import AdminTableFooter from "../admin-table-footer";
import { AdminDetailShell, AdminListShell } from "../admin-panel-shell";
import useTablePagination from "../use-table-pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import styles from "../../admin.module.css";

export default function AdminReservationsSection({
  detailOnlyLayout,
  permissions,
  manualOpen,
  setManualOpen,
  reservationQuery,
  setReservationQuery,
  reservationStatus,
  setReservationStatus,
  reservationSort,
  setReservationSort,
  reservationStatuses,
  reservationSortOptions,
  createManualReservation,
  manualForm,
  setManualForm,
  drivers,
  restaurantTables,
  reservationSaving,
  filteredReservations,
  selectedReservation,
  openSectionDetail,
  formatDate,
  formatLabel,
  findTableName,
  detailHeaderActions,
  deleteReservation,
  patchReservation,
  integrations,
  selectedIntegrationId,
  setSelectedIntegrationId,
  syncReservation,
  integrationSaving,
  FormSelect
}) {
  const pagination = useTablePagination(filteredReservations);
  const activeFilterItems = [
    {
      key: "query",
      active: Boolean(reservationQuery.trim()),
      label: `Tìm: ${reservationQuery.trim()}`,
      onClear: () => setReservationQuery("")
    },
    {
      key: "status",
      active: reservationStatus !== "all",
      label: `Trạng thái: ${reservationStatuses.find((item) => item.value === reservationStatus)?.label || reservationStatus}`,
      onClear: () => setReservationStatus("all")
    },
    {
      key: "sort",
      active: reservationSort !== "newest",
      label: `Sắp xếp: ${reservationSortOptions.find((item) => item.value === reservationSort)?.label || reservationSort}`,
      onClear: () => setReservationSort("newest")
    }
  ];

  return (
    <section className="grid w-full min-w-0 gap-4">
      {!detailOnlyLayout ? (
        <AdminListShell>
          <AdminPageToolbar
            actions={
              permissions.canManageReservations ? (
                <Button type="button" variant="secondary" onClick={() => setManualOpen(true)}>
                  Tạo đặt bàn
                </Button>
              ) : null
            }
            footer={
              <AdminActiveFilters
                items={activeFilterItems}
                onClearAll={() => {
                  setReservationQuery("");
                  setReservationStatus("all");
                  setReservationSort("newest");
                }}
              />
            }
          >
            <Input
              type="search"
              placeholder="Tìm khách đặt bàn..."
              value={reservationQuery}
              onChange={(event) => setReservationQuery(event.target.value)}
            />
            <Select value={reservationStatus} onValueChange={setReservationStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                {reservationStatuses.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={reservationSort} onValueChange={setReservationSort}>
              <SelectTrigger>
                <SelectValue placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent>
                {reservationSortOptions.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </AdminPageToolbar>

          {permissions.canManageReservations ? (
            <AdminFormDialog
              open={manualOpen}
              onOpenChange={setManualOpen}
              title="Tạo đặt bàn mới"
              description="Nhập nhanh thông tin khách để tạo lead đặt bàn thủ công."
              size="medium"
            >
            <form className={styles.inlineForm} onSubmit={createManualReservation}>
              <Input
                type="text"
                placeholder="Tên khách"
                value={manualForm.name}
                onChange={(event) => setManualForm((prev) => ({ ...prev, name: event.target.value }))}
                required
              />
              <Input
                type="tel"
                placeholder="SĐT"
                value={manualForm.phone}
                onChange={(event) => setManualForm((prev) => ({ ...prev, phone: event.target.value }))}
                required
              />
              <div className={styles.inlineRow}>
                <Input
                  type="text"
                  placeholder="Số khách"
                  value={manualForm.guests}
                  onChange={(event) => setManualForm((prev) => ({ ...prev, guests: event.target.value }))}
                  required
                />
                <Input
                  type="datetime-local"
                  value={manualForm.datetime}
                  onChange={(event) => setManualForm((prev) => ({ ...prev, datetime: event.target.value }))}
                  required
                />
              </div>
              <div className={styles.inlineRow}>
                <FormSelect
                  value={manualForm.driverId || "none"}
                  onValueChange={(value) => setManualForm((prev) => ({ ...prev, driverId: value === "none" ? "" : value }))}
                  options={[{ value: "none", label: "Chưa gán tài xế" }, ...drivers.map((driver) => ({ value: driver.id, label: driver.fullName }))]}
                  placeholder="Chưa gán tài xế"
                />
                <Input
                  type="text"
                  placeholder="Mã giới thiệu"
                  value={manualForm.referralCode}
                  onChange={(event) => setManualForm((prev) => ({ ...prev, referralCode: event.target.value }))}
                />
              </div>
              <FormSelect
                value={manualForm.tableId || "none"}
                onValueChange={(value) => setManualForm((prev) => ({ ...prev, tableId: value === "none" ? "" : value }))}
                options={[{ value: "none", label: "Chưa gán bàn" }, ...restaurantTables.map((table) => ({ value: table.id, label: table.name }))]}
                placeholder="Chưa gán bàn"
              />
              <Textarea
                placeholder="Ghi chú"
                value={manualForm.notes}
                onChange={(event) => setManualForm((prev) => ({ ...prev, notes: event.target.value }))}
                rows={3}
              />
              <Button type="submit" loading={reservationSaving} loadingLabel="Đang lưu...">
                Lưu đặt bàn
              </Button>
            </form>
            </AdminFormDialog>
          ) : null}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Khách</TableHead>
                <TableHead>SĐT</TableHead>
                <TableHead>Thời gian</TableHead>
                <TableHead>Bàn</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagination.pagedItems.map((item) => (
                <TableRow key={item.id} className={styles.interactiveRow} onClick={() => openSectionDetail("reservations", item.id)}>
                  <TableCell data-label="Khách">
                    <strong>{item.name}</strong>
                    <span>{item.guests} khách</span>
                  </TableCell>
                  <TableCell data-label="SĐT">{item.phone}</TableCell>
                  <TableCell data-label="Thời gian">{formatDate(item.datetime)}</TableCell>
                  <TableCell data-label="Bàn">{findTableName(item.tableId)}</TableCell>
                  <TableCell data-label="Trạng thái">
                    <span className={`${styles.statusBadge} ${styles[`status_${item.status}`] || styles.status_new}`}>{formatLabel(item.status)}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <AdminTableFooter {...pagination} />
        </AdminListShell>
      ) : null}

      {detailOnlyLayout ? (
        <AdminDetailShell>
          {selectedReservation ? (
            <div>
              <AdminDetailHeader
                kicker="Chi tiết đặt bàn"
                title={selectedReservation.name}
                actions={detailHeaderActions(
                  "reservations",
                  permissions.canManageReservations ? (
                    <Button
                      className={styles.deleteButton}
                      variant="destructive"
                      type="button"
                      onClick={() => deleteReservation(selectedReservation.id)}
                    >
                      Xóa lead
                    </Button>
                  ) : null
                )}
              />
              {permissions.canManageReservations ? (
                <div className={styles.quickStatusRow}>
                  {reservationStatuses
                    .filter((item) => item.value !== "all")
                    .map((item) => (
                      <Button
                        type="button"
                        variant={selectedReservation.status === item.value ? "default" : "outline"}
                        key={item.value}
                        className={selectedReservation.status === item.value ? styles.quickActive : ""}
                        onClick={() => patchReservation(selectedReservation.id, { ...selectedReservation, status: item.value })}
                      >
                        {item.label}
                      </Button>
                    ))}
                </div>
              ) : null}
              <div className={styles.editGrid}>
                <label>
                  <span>SĐT</span>
                  <Input
                    type="text"
                    defaultValue={selectedReservation.phone}
                    disabled={!permissions.canManageReservations}
                    onBlur={(event) => patchReservation(selectedReservation.id, { ...selectedReservation, phone: event.target.value })}
                  />
                </label>
                <label>
                  <span>Số khách</span>
                  <Input
                    type="text"
                    defaultValue={selectedReservation.guests}
                    disabled={!permissions.canManageReservations}
                    onBlur={(event) => patchReservation(selectedReservation.id, { ...selectedReservation, guests: event.target.value })}
                  />
                </label>
                <label>
                  <span>Thời gian</span>
                  <Input
                    type="datetime-local"
                    defaultValue={selectedReservation.datetime}
                    disabled={!permissions.canManageReservations}
                    onBlur={(event) => patchReservation(selectedReservation.id, { ...selectedReservation, datetime: event.target.value })}
                  />
                </label>
                <label>
                  <span>Gán bàn</span>
                  <FormSelect
                    value={selectedReservation.tableId || "none"}
                    disabled={!permissions.canManageReservations}
                    onValueChange={(value) =>
                      patchReservation(selectedReservation.id, { ...selectedReservation, tableId: value === "none" ? "" : value })
                    }
                    options={[{ value: "none", label: "Chưa gán bàn" }, ...restaurantTables.map((table) => ({ value: table.id, label: table.name }))]}
                    placeholder="Chưa gán bàn"
                  />
                </label>
                <label className={styles.fullWidth}>
                  <span>Ghi chú</span>
                  <Textarea
                    rows={5}
                    defaultValue={selectedReservation.notes || ""}
                    disabled={!permissions.canManageReservations}
                    onBlur={(event) => patchReservation(selectedReservation.id, { ...selectedReservation, notes: event.target.value })}
                  />
                </label>
              </div>
              {permissions.canViewIntegrations ? (
                <div className={styles.syncBox}>
                  <div>
                    <span className={styles.kicker}>Sync POS/PMS</span>
                    <p>Đồng bộ yêu cầu này sang hệ POS/PMS.</p>
                  </div>
                  <div className={styles.syncActions}>
                    <Select
                      value={selectedIntegrationId}
                      onValueChange={setSelectedIntegrationId}
                      disabled={!permissions.canManageIntegrations}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn tích hợp" />
                      </SelectTrigger>
                      <SelectContent>
                        {integrations.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {permissions.canSyncIntegrations ? (
                      <Button
                        type="button"
                        onClick={() => syncReservation(selectedReservation.id, selectedIntegrationId)}
                        loading={integrationSaving}
                        loadingLabel="Đang đồng bộ..."
                      >
                        Đồng bộ ngay
                      </Button>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <AdminEmptyState
              title="Không tìm thấy lead đặt bàn."
              description="Lead có thể đã bị xóa hoặc không thuộc chi nhánh đang xem."
            />
          )}
        </AdminDetailShell>
      ) : null}
    </section>
  );
}
