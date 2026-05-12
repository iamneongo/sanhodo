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

export default function AdminPartnersSection({
  detailOnlyLayout,
  permissions,
  partnerCreateOpen,
  setPartnerCreateOpen,
  partnerQuery,
  setPartnerQuery,
  partnerStatusFilter,
  setPartnerStatusFilter,
  partnerSort,
  setPartnerSort,
  partnerStatuses,
  partnerSortOptions,
  createPartnerEntry,
  partnerDraft,
  setPartnerDraft,
  partnerTypes,
  partnerSaving,
  filteredPartners,
  selectedPartner,
  openSectionDetail,
  formatLabel,
  formatCurrency,
  detailHeaderActions,
  deletePartnerEntry,
  partnerBookings,
  partnerEdit,
  setPartnerEdit,
  savePartnerEdit,
  FormSelect,
  partnerContractCreateOpen,
  setPartnerContractCreateOpen,
  createPartnerContractEntry,
  partnerContractDraft,
  setPartnerContractDraft,
  partnerContractStatuses,
  partnerContracts,
  formatDate,
  partnerBookingCreateOpen,
  setPartnerBookingCreateOpen,
  createPartnerBookingEntry,
  partnerBookingDraft,
  setPartnerBookingDraft,
  partnerBookingStatuses,
  patchPartnerBooking,
  deletePartnerBookingEntry
}) {
  const pagination = useTablePagination(filteredPartners);
  const activeFilterItems = [
    {
      key: "query",
      active: Boolean(partnerQuery.trim()),
      label: `Tìm: ${partnerQuery.trim()}`,
      onClear: () => setPartnerQuery("")
    },
    {
      key: "status",
      active: partnerStatusFilter !== "all",
      label: `Trạng thái: ${formatLabel(partnerStatusFilter)}`,
      onClear: () => setPartnerStatusFilter("all")
    },
    {
      key: "sort",
      active: partnerSort !== "name_asc",
      label: `Sắp xếp: ${partnerSortOptions.find((item) => item.value === partnerSort)?.label || partnerSort}`,
      onClear: () => setPartnerSort("name_asc")
    }
  ];

  return (
    <section className="grid w-full min-w-0 gap-4">
      {!detailOnlyLayout ? (
        <AdminListShell>
          <AdminPageToolbar
            actions={
              permissions.canManagePartners ? (
                <Button type="button" variant="secondary" onClick={() => setPartnerCreateOpen(true)}>
                  Tạo đối tác
                </Button>
              ) : null
            }
            footer={
              <AdminActiveFilters
                items={activeFilterItems}
                onClearAll={() => {
                  setPartnerQuery("");
                  setPartnerStatusFilter("all");
                  setPartnerSort("name_asc");
                }}
              />
            }
          >
            <Input
              type="search"
              placeholder="Tìm đối tác / HDV..."
              value={partnerQuery}
              onChange={(event) => setPartnerQuery(event.target.value)}
            />
            <FormSelect
              value={partnerStatusFilter}
              onValueChange={setPartnerStatusFilter}
              options={[{ value: "all", label: "Tất cả trạng thái" }, ...partnerStatuses]}
              placeholder="Lọc trạng thái"
            />
            <FormSelect value={partnerSort} onValueChange={setPartnerSort} options={partnerSortOptions} placeholder="Sắp xếp" />
          </AdminPageToolbar>

          {permissions.canManagePartners ? (
            <AdminFormDialog
              open={partnerCreateOpen}
              onOpenChange={setPartnerCreateOpen}
              title="Tạo đối tác / HDV"
              description="Khai báo đối tác mới, loại hợp tác và chính sách chiết khấu cơ bản."
              size="wide"
            >
            <form className={styles.inlineForm} onSubmit={createPartnerEntry}>
              <Input type="text" placeholder="Mã đối tác" value={partnerDraft.code} onChange={(event) => setPartnerDraft((prev) => ({ ...prev, code: event.target.value }))} required />
              <Input type="text" placeholder="Tên đối tác / HDV" value={partnerDraft.name} onChange={(event) => setPartnerDraft((prev) => ({ ...prev, name: event.target.value }))} required />
              <div className={styles.inlineRow}>
                <FormSelect value={partnerDraft.partnerType} onValueChange={(value) => setPartnerDraft((prev) => ({ ...prev, partnerType: value }))} options={partnerTypes} />
                <FormSelect value={partnerDraft.status} onValueChange={(value) => setPartnerDraft((prev) => ({ ...prev, status: value }))} options={partnerStatuses} />
              </div>
              <div className={styles.inlineRow}>
                <Input type="text" placeholder="Người liên hệ" value={partnerDraft.contactName} onChange={(event) => setPartnerDraft((prev) => ({ ...prev, contactName: event.target.value }))} />
                <Input type="tel" placeholder="SĐT" value={partnerDraft.phone} onChange={(event) => setPartnerDraft((prev) => ({ ...prev, phone: event.target.value }))} required />
              </div>
              <div className={styles.inlineRow}>
                <Input type="email" placeholder="Email" value={partnerDraft.email} onChange={(event) => setPartnerDraft((prev) => ({ ...prev, email: event.target.value }))} />
                <Input type="number" min="0" placeholder="Hoa hồng / chiết khấu" value={partnerDraft.commissionValue} onChange={(event) => setPartnerDraft((prev) => ({ ...prev, commissionValue: Number(event.target.value) }))} />
              </div>
              <div className={styles.inlineRow}>
                <FormSelect value={partnerDraft.commissionType} onValueChange={(value) => setPartnerDraft((prev) => ({ ...prev, commissionType: value }))} options={[{ value: "percent", label: "Phần trăm" }, { value: "amount", label: "Số tiền" }]} />
                <Input type="datetime-local" placeholder="Bắt đầu hợp tác" value={partnerDraft.contractStartAt} onChange={(event) => setPartnerDraft((prev) => ({ ...prev, contractStartAt: event.target.value }))} />
              </div>
              <Input type="datetime-local" placeholder="Kết thúc hợp tác" value={partnerDraft.contractEndAt} onChange={(event) => setPartnerDraft((prev) => ({ ...prev, contractEndAt: event.target.value }))} />
              <Textarea placeholder="Ghi chú" rows={3} value={partnerDraft.notes} onChange={(event) => setPartnerDraft((prev) => ({ ...prev, notes: event.target.value }))} />
              <Button type="submit" disabled={partnerSaving}>{partnerSaving ? "Đang tạo..." : "Lưu đối tác"}</Button>
            </form>
            </AdminFormDialog>
          ) : null}

          <div className={styles.tableWrap}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Đối tác</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Hoa hồng</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagination.pagedItems.map((item) => (
                  <TableRow key={item.id} className={styles.interactiveRow} onClick={() => openSectionDetail("partners", item.id)}>
                    <TableCell><strong>{item.name}</strong><span>{item.contactName || item.phone}</span></TableCell>
                    <TableCell>{formatLabel(item.partnerType)}</TableCell>
                    <TableCell>{item.commissionType === "amount" ? formatCurrency(item.commissionValue) : `${item.commissionValue}%`}</TableCell>
                    <TableCell><span className={`${styles.statusBadge} ${styles[`status_${item.status}`] || styles.status_confirmed}`}>{formatLabel(item.status)}</span></TableCell>
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
          {selectedPartner ? (
            <div>
              <AdminDetailHeader kicker="Đối tác / hướng dẫn viên" title={selectedPartner.name} actions={detailHeaderActions("partners")} />
              {permissions.canManagePartners ? (
                <div className={styles.detailActions}>
                  <Button className={styles.deleteButton} variant="destructive" type="button" onClick={() => deletePartnerEntry(selectedPartner.id)}>Xóa đối tác</Button>
                </div>
              ) : null}
              <div className={styles.metaGrid}>
                <div><span>Mã đối tác</span><strong>{selectedPartner.code}</strong></div>
                <div><span>Loại</span><strong>{formatLabel(selectedPartner.partnerType)}</strong></div>
                <div><span>Booking mở</span><strong>{partnerBookings.filter((item) => item.partnerId === selectedPartner.id && ["lead", "confirmed"].includes(item.status)).length}</strong></div>
                <div><span>Tổng ngân sách</span><strong>{formatCurrency(partnerBookings.filter((item) => item.partnerId === selectedPartner.id).reduce((sum, item) => sum + Number(item.menuBudget || 0), 0))}</strong></div>
              </div>
              <div className={styles.editGrid}>
                <label><span>Tên đối tác</span><Input type="text" value={partnerEdit.name} disabled={!permissions.canManagePartners} onChange={(event) => setPartnerEdit((prev) => ({ ...prev, name: event.target.value }))} /></label>
                <label><span>Người liên hệ</span><Input type="text" value={partnerEdit.contactName} disabled={!permissions.canManagePartners} onChange={(event) => setPartnerEdit((prev) => ({ ...prev, contactName: event.target.value }))} /></label>
                <label><span>SĐT</span><Input type="text" value={partnerEdit.phone} disabled={!permissions.canManagePartners} onChange={(event) => setPartnerEdit((prev) => ({ ...prev, phone: event.target.value }))} /></label>
                <label><span>Email</span><Input type="text" value={partnerEdit.email} disabled={!permissions.canManagePartners} onChange={(event) => setPartnerEdit((prev) => ({ ...prev, email: event.target.value }))} /></label>
                <label><span>Loại</span><FormSelect value={partnerEdit.partnerType} disabled={!permissions.canManagePartners} onValueChange={(value) => setPartnerEdit((prev) => ({ ...prev, partnerType: value }))} options={partnerTypes} /></label>
                <label><span>Trạng thái</span><FormSelect value={partnerEdit.status} disabled={!permissions.canManagePartners} onValueChange={(value) => setPartnerEdit((prev) => ({ ...prev, status: value }))} options={partnerStatuses} /></label>
                <label><span>Kiểu chiết khấu</span><FormSelect value={partnerEdit.commissionType} disabled={!permissions.canManagePartners} onValueChange={(value) => setPartnerEdit((prev) => ({ ...prev, commissionType: value }))} options={["percent", "amount"]} /></label>
                <label><span>Giá trị</span><Input type="number" min="0" value={partnerEdit.commissionValue} disabled={!permissions.canManagePartners} onChange={(event) => setPartnerEdit((prev) => ({ ...prev, commissionValue: Number(event.target.value) }))} /></label>
                <label><span>Bắt đầu hợp tác</span><Input type="datetime-local" value={partnerEdit.contractStartAt ? String(partnerEdit.contractStartAt).slice(0, 16) : ""} disabled={!permissions.canManagePartners} onChange={(event) => setPartnerEdit((prev) => ({ ...prev, contractStartAt: event.target.value }))} /></label>
                <label><span>Kết thúc hợp tác</span><Input type="datetime-local" value={partnerEdit.contractEndAt ? String(partnerEdit.contractEndAt).slice(0, 16) : ""} disabled={!permissions.canManagePartners} onChange={(event) => setPartnerEdit((prev) => ({ ...prev, contractEndAt: event.target.value }))} /></label>
                <label className={styles.fullWidth}><span>Ghi chú</span><Textarea rows={4} value={partnerEdit.notes} disabled={!permissions.canManagePartners} onChange={(event) => setPartnerEdit((prev) => ({ ...prev, notes: event.target.value }))} /></label>
              </div>
              {permissions.canManagePartners ? <div className={styles.detailActions}><Button type="button" className={styles.saveButton} onClick={savePartnerEdit} disabled={partnerSaving}>{partnerSaving ? "Đang lưu..." : "Lưu đối tác"}</Button></div> : null}

              <AdminSurfaceCard kicker="Hợp đồng" title="Chính sách áp dụng" actions={permissions.canManagePartnerContracts ? <Button type="button" variant="secondary" onClick={() => setPartnerContractCreateOpen(true)}>Thêm hợp đồng</Button> : null} className={styles.subsectionCard}>
                {permissions.canManagePartnerContracts ? (
                  <AdminFormDialog
                    open={partnerContractCreateOpen}
                    onOpenChange={setPartnerContractCreateOpen}
                    title="Tạo hợp đồng đối tác"
                    description="Thiết lập chính sách chiết khấu, hoa hồng và thời gian hiệu lực."
                    size="medium"
                  >
                  <form className={styles.inlineForm} onSubmit={createPartnerContractEntry}>
                    <Input type="text" placeholder="Tên hợp đồng" value={partnerContractDraft.title} onChange={(event) => setPartnerContractDraft((prev) => ({ ...prev, title: event.target.value }))} required />
                    <div className={styles.inlineRow}>
                      <Input type="number" min="0" placeholder="% chiết khấu" value={partnerContractDraft.discountPercent} onChange={(event) => setPartnerContractDraft((prev) => ({ ...prev, discountPercent: Number(event.target.value) }))} />
                      <Input type="number" min="0" placeholder="% hoa hồng" value={partnerContractDraft.commissionPercent} onChange={(event) => setPartnerContractDraft((prev) => ({ ...prev, commissionPercent: Number(event.target.value) }))} />
                    </div>
                    <div className={styles.inlineRow}>
                      <FormSelect value={partnerContractDraft.status} onValueChange={(value) => setPartnerContractDraft((prev) => ({ ...prev, status: value }))} options={partnerContractStatuses} />
                      <Input type="datetime-local" value={partnerContractDraft.startsAt} onChange={(event) => setPartnerContractDraft((prev) => ({ ...prev, startsAt: event.target.value }))} />
                    </div>
                    <Input type="datetime-local" value={partnerContractDraft.endsAt} onChange={(event) => setPartnerContractDraft((prev) => ({ ...prev, endsAt: event.target.value }))} />
                    <Textarea placeholder="Điều khoản thanh toán / ghi chú" rows={3} value={partnerContractDraft.paymentTerms} onChange={(event) => setPartnerContractDraft((prev) => ({ ...prev, paymentTerms: event.target.value }))} />
                    <Button type="submit" disabled={partnerSaving}>{partnerSaving ? "Đang tạo..." : "Lưu hợp đồng"}</Button>
                  </form>
                  </AdminFormDialog>
                ) : null}
                <div className={styles.logList}>
                  {partnerContracts.filter((item) => item.partnerId === selectedPartner.id).slice(0, 6).map((item) => (
                    <article key={item.id} className={styles.logItem}>
                      <div className={styles.logHead}><strong>{item.title}</strong><span className={`${styles.statusBadge} ${styles[`status_${item.status}`] || styles.status_new}`}>{formatLabel(item.status)}</span></div>
                      <small>{formatDate(item.startsAt)} → {formatDate(item.endsAt)}</small>
                      <p>Chiết khấu {item.discountPercent}% • Hoa hồng {item.commissionPercent}%</p>
                    </article>
                  ))}
                  {!partnerContracts.filter((item) => item.partnerId === selectedPartner.id).length ? <AdminEmptyState title="Chưa có hợp đồng." description="Thêm hợp đồng mới để áp dụng chiết khấu và hoa hồng cho đối tác này." /> : null}
                </div>
              </AdminSurfaceCard>

              <AdminSurfaceCard kicker="Booking đoàn" title="Đơn từ đối tác / HDV" actions={permissions.canManagePartnerBookings ? <Button type="button" variant="secondary" onClick={() => setPartnerBookingCreateOpen(true)}>Tạo booking đoàn</Button> : null} className={styles.subsectionCard}>
                {permissions.canManagePartnerBookings ? (
                  <AdminFormDialog
                    open={partnerBookingCreateOpen}
                    onOpenChange={setPartnerBookingCreateOpen}
                    title="Tạo booking đoàn"
                    description="Tạo booking từ HDV hoặc đối tác với số khách, ngân sách và mức hoa hồng."
                    size="wide"
                  >
                  <form className={styles.inlineForm} onSubmit={createPartnerBookingEntry}>
                    <Input type="text" placeholder="Mã booking" value={partnerBookingDraft.code} onChange={(event) => setPartnerBookingDraft((prev) => ({ ...prev, code: event.target.value }))} />
                    <Input type="text" placeholder="Tên trưởng đoàn / khách" value={partnerBookingDraft.customerName} onChange={(event) => setPartnerBookingDraft((prev) => ({ ...prev, customerName: event.target.value }))} required />
                    <div className={styles.inlineRow}>
                      <Input type="tel" placeholder="SĐT" value={partnerBookingDraft.customerPhone} onChange={(event) => setPartnerBookingDraft((prev) => ({ ...prev, customerPhone: event.target.value }))} required />
                      <Input type="number" min="1" placeholder="Số khách" value={partnerBookingDraft.groupSize} onChange={(event) => setPartnerBookingDraft((prev) => ({ ...prev, groupSize: Number(event.target.value) }))} />
                    </div>
                    <div className={styles.inlineRow}>
                      <Input type="datetime-local" value={partnerBookingDraft.bookingAt} onChange={(event) => setPartnerBookingDraft((prev) => ({ ...prev, bookingAt: event.target.value }))} required />
                      <FormSelect value={partnerBookingDraft.status} onValueChange={(value) => setPartnerBookingDraft((prev) => ({ ...prev, status: value }))} options={partnerBookingStatuses} />
                    </div>
                    <div className={styles.inlineRow}>
                      <Input type="text" placeholder="Set menu / package" value={partnerBookingDraft.packageName} onChange={(event) => setPartnerBookingDraft((prev) => ({ ...prev, packageName: event.target.value }))} />
                      <Input type="number" min="0" placeholder="Ngân sách menu" value={partnerBookingDraft.menuBudget} onChange={(event) => setPartnerBookingDraft((prev) => ({ ...prev, menuBudget: Number(event.target.value) }))} />
                    </div>
                    <div className={styles.inlineRow}>
                      <Input type="number" min="0" placeholder="Chiết khấu" value={partnerBookingDraft.discountAmount} onChange={(event) => setPartnerBookingDraft((prev) => ({ ...prev, discountAmount: Number(event.target.value) }))} />
                      <Input type="number" min="0" placeholder="Hoa hồng" value={partnerBookingDraft.commissionAmount} onChange={(event) => setPartnerBookingDraft((prev) => ({ ...prev, commissionAmount: Number(event.target.value) }))} />
                    </div>
                    <Input type="url" placeholder="Link manifest / danh sách khách" value={partnerBookingDraft.guestManifestUrl} onChange={(event) => setPartnerBookingDraft((prev) => ({ ...prev, guestManifestUrl: event.target.value }))} />
                    <Textarea placeholder="Ghi chú" rows={3} value={partnerBookingDraft.notes} onChange={(event) => setPartnerBookingDraft((prev) => ({ ...prev, notes: event.target.value }))} />
                    <Button type="submit" disabled={partnerSaving}>{partnerSaving ? "Đang tạo..." : "Lưu booking đoàn"}</Button>
                  </form>
                  </AdminFormDialog>
                ) : null}
                <div className={styles.logList}>
                  {partnerBookings.filter((item) => item.partnerId === selectedPartner.id).slice(0, 8).map((item) => (
                    <article key={item.id} className={styles.logItem}>
                      <div className={styles.logHead}><strong>{item.customerName}</strong><span className={`${styles.statusBadge} ${styles[`status_${item.status}`] || styles.status_new}`}>{formatLabel(item.status)}</span></div>
                      <small>{item.code || "Chưa có mã"} • {item.groupSize} khách • {formatDate(item.bookingAt)}</small>
                      <p>{item.packageName || "Chưa chọn set menu"} • Ngân sách {formatCurrency(item.menuBudget)} • Hoa hồng {formatCurrency(item.commissionAmount)}</p>
                      <div className={styles.inlineRow}>
                        <FormSelect value={item.status} disabled={!permissions.canManagePartnerBookings} onValueChange={(value) => patchPartnerBooking(item.id, { ...item, status: value })} options={partnerBookingStatuses} />
                        {permissions.canManagePartnerBookings ? <Button type="button" variant="destructive" className={styles.deleteButton} onClick={() => deletePartnerBookingEntry(item.id)}>Xóa</Button> : null}
                      </div>
                    </article>
                  ))}
                  {!partnerBookings.filter((item) => item.partnerId === selectedPartner.id).length ? <AdminEmptyState title="Chưa có booking đoàn." description="Khi đối tác tạo booking đoàn, lịch sử sẽ hiển thị trong khối này." /> : null}
                </div>
              </AdminSurfaceCard>
            </div>
          ) : (
            <AdminEmptyState title="Chưa có đối tác / HDV." description="Tạo đối tác mới hoặc quay lại danh sách để chọn bản ghi khác." />
          )}
        </AdminDetailShell>
      ) : null}
    </section>
  );
}
