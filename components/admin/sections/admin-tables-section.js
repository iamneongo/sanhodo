"use client";

import AdminEmptyState from "../admin-empty-state";
import AdminFormDialog from "../admin-form-dialog";
import AdminActiveFilters from "../admin-active-filters";
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

export default function AdminTablesSection({
  detailOnlyLayout,
  permissions,
  tableCreateOpen,
  setTableCreateOpen,
  tableQuery,
  setTableQuery,
  tableStatusFilter,
  setTableStatusFilter,
  tableSort,
  setTableSort,
  tableSortOptions,
  tableStatuses,
  createTableEntry,
  tableDraft,
  setTableDraft,
  tableSaving,
  filteredTables,
  selectedTable,
  openSectionDetail,
  formatCurrency,
  formatLabel,
  detailHeaderActions,
  deleteTableEntry,
  tableEdit,
  setTableEdit,
  saveTableEdit,
  FormSelect
}) {
  const pagination = useTablePagination(filteredTables);
  const activeFilterItems = [
    {
      key: "query",
      active: Boolean(tableQuery.trim()),
      label: `Tìm: ${tableQuery.trim()}`,
      onClear: () => setTableQuery("")
    },
    {
      key: "status",
      active: tableStatusFilter !== "all",
      label: `Trạng thái: ${formatLabel(tableStatusFilter)}`,
      onClear: () => setTableStatusFilter("all")
    },
    {
      key: "sort",
      active: tableSort !== "name_asc",
      label: `Sắp xếp: ${tableSortOptions.find((item) => item.value === tableSort)?.label || tableSort}`,
      onClear: () => setTableSort("name_asc")
    }
  ];

  return (
    <section className="grid w-full min-w-0 gap-4">
      {!detailOnlyLayout ? (
        <AdminListShell>
          <AdminPageToolbar
            actions={
              permissions.canManageTables ? (
                <Button type="button" variant="secondary" onClick={() => setTableCreateOpen(true)}>
                  Tạo bàn
                </Button>
              ) : null
            }
            footer={
              <AdminActiveFilters
                items={activeFilterItems}
                onClearAll={() => {
                  setTableQuery("");
                  setTableStatusFilter("all");
                  setTableSort("name_asc");
                }}
              />
            }
          >
            <Input type="search" placeholder="Tìm bàn..." value={tableQuery} onChange={(event) => setTableQuery(event.target.value)} />
            <FormSelect value={tableStatusFilter} onValueChange={setTableStatusFilter} options={[{ value: "all", label: "Tất cả trạng thái" }, ...tableStatuses]} placeholder="Lọc trạng thái" />
            <FormSelect value={tableSort} onValueChange={setTableSort} options={tableSortOptions} placeholder="Sắp xếp" />
          </AdminPageToolbar>
          {permissions.canManageTables ? (
            <AdminFormDialog
              open={tableCreateOpen}
              onOpenChange={setTableCreateOpen}
              title="Tạo bàn mới"
              description="Thiết lập nhanh bàn, khu vực và sức chứa."
              size="default"
            >
            <form className={styles.inlineForm} onSubmit={createTableEntry}>
              <Input type="text" placeholder="Tên bàn" value={tableDraft.name} onChange={(event) => setTableDraft((prev) => ({ ...prev, name: event.target.value }))} required />
              <Input type="text" placeholder="Khu vực" value={tableDraft.area} onChange={(event) => setTableDraft((prev) => ({ ...prev, area: event.target.value }))} />
              <div className={styles.inlineRow}>
                <Input type="number" min="1" placeholder="Sức chứa" value={tableDraft.capacity} onChange={(event) => setTableDraft((prev) => ({ ...prev, capacity: Number(event.target.value) }))} />
                <FormSelect value={tableDraft.status} onValueChange={(value) => setTableDraft((prev) => ({ ...prev, status: value }))} options={tableStatuses} placeholder="Trạng thái" />
              </div>
              <Textarea placeholder="Ghi chú" rows={3} value={tableDraft.notes} onChange={(event) => setTableDraft((prev) => ({ ...prev, notes: event.target.value }))} />
              <Button type="submit" disabled={tableSaving}>{tableSaving ? "Đang tạo..." : "Lưu bàn"}</Button>
            </form>
            </AdminFormDialog>
          ) : null}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bàn</TableHead>
                <TableHead>Khu vực</TableHead>
                <TableHead>Sức chứa</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagination.pagedItems.map((item) => (
                <TableRow key={item.id} className={styles.interactiveRow} onClick={() => openSectionDetail("tables", item.id)}>
                  <TableCell data-label="Bàn"><strong>{item.name}</strong><span>{formatCurrency(item.minSpend)}</span></TableCell>
                  <TableCell data-label="Khu vực">{item.area}</TableCell>
                  <TableCell data-label="Sức chứa">{item.capacity}</TableCell>
                  <TableCell data-label="Trạng thái"><span className={`${styles.statusBadge} ${styles[`status_${item.status}`] || styles.status_new}`}>{formatLabel(item.status)}</span></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <AdminTableFooter {...pagination} />
        </AdminListShell>
      ) : null}
      {detailOnlyLayout ? (
        <AdminDetailShell>
          {selectedTable ? (
            <AdminSurfaceCard
              kicker="Chi tiết bàn"
              title={selectedTable.name}
              actions={detailHeaderActions("tables", permissions.canManageTables ? <Button className={styles.deleteButton} variant="destructive" type="button" onClick={() => deleteTableEntry(selectedTable.id)}>Xóa bàn</Button> : null)}
              className={styles.subsectionCard}
            >
              <div className={styles.editGrid}>
                <label><span>Tên bàn</span><Input type="text" value={tableEdit.name} disabled={!permissions.canManageTables} onChange={(event) => setTableEdit((prev) => ({ ...prev, name: event.target.value }))} /></label>
                <label><span>Khu vực</span><Input type="text" value={tableEdit.area} disabled={!permissions.canManageTables} onChange={(event) => setTableEdit((prev) => ({ ...prev, area: event.target.value }))} /></label>
                <label><span>Sức chứa</span><Input type="number" min="1" value={tableEdit.capacity} disabled={!permissions.canManageTables} onChange={(event) => setTableEdit((prev) => ({ ...prev, capacity: Number(event.target.value) }))} /></label>
                <label><span>Trạng thái</span><FormSelect value={tableEdit.status} disabled={!permissions.canManageTables} onValueChange={(value) => setTableEdit((prev) => ({ ...prev, status: value }))} options={tableStatuses} placeholder="Trạng thái" /></label>
                <label className={styles.fullWidth}><span>Ghi chú</span><Textarea rows={5} value={tableEdit.notes} disabled={!permissions.canManageTables} onChange={(event) => setTableEdit((prev) => ({ ...prev, notes: event.target.value }))} /></label>
              </div>
              {permissions.canManageTables ? <div className={styles.detailActions}><Button type="button" className={styles.saveButton} onClick={saveTableEdit} disabled={tableSaving}>{tableSaving ? "Đang lưu..." : "Lưu bàn"}</Button></div> : null}
            </AdminSurfaceCard>
          ) : (
            <AdminEmptyState title="Không tìm thấy bàn." description="Bàn có thể đã bị xóa hoặc không thuộc chi nhánh đang xem." />
          )}
        </AdminDetailShell>
      ) : null}
    </section>
  );
}
