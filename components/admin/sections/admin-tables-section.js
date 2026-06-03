"use client";

import { useMemo, useState } from "react";
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

function formatElapsedSince(value) {
  if (!value) return "-";
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "-";

  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
  if (minutes < 1) return "vừa cập nhật";
  if (minutes < 60) return `${minutes} phút`;

  const hours = Math.floor(minutes / 60);
  const remainMinutes = minutes % 60;
  if (hours < 24) {
    return remainMinutes ? `${hours} giờ ${remainMinutes} phút` : `${hours} giờ`;
  }

  const days = Math.floor(hours / 24);
  const remainHours = hours % 24;
  return remainHours ? `${days} ngày ${remainHours} giờ` : `${days} ngày`;
}

function getTableTimingMeta(table) {
  const baseTime = table.updatedAt || table.createdAt;
  if (table.status === "reserved") {
    return {
      label: "Đang giữ",
      value: formatElapsedSince(baseTime)
    };
  }

  if (table.status === "occupied") {
    return {
      label: "Đang phục vụ",
      value: formatElapsedSince(baseTime)
    };
  }

  if (table.status === "cleaning") {
    return {
      label: "Đang dọn",
      value: formatElapsedSince(baseTime)
    };
  }

  return {
    label: "Cập nhật",
    value: formatElapsedSince(baseTime)
  };
}

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
  selectedTableEvents = [],
  openSectionDetail,
  formatCurrency,
  formatDate,
  formatLabel,
  detailHeaderActions,
  deleteTableEntry,
  patchTableEntry,
  tableEdit,
  setTableEdit,
  saveTableEdit,
  FormSelect
}) {
  const [viewMode, setViewMode] = useState("floor");
  const pagination = useTablePagination(filteredTables);
  const tablesByArea = useMemo(() => {
    const groups = new Map();
    filteredTables.forEach((table) => {
      const area = table.area || "Chưa phân khu";
      if (!groups.has(area)) {
        groups.set(area, []);
      }
      groups.get(area).push(table);
    });

    return [...groups.entries()].map(([area, items]) => ({
      area,
      items: [...items].sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "vi"))
    }));
  }, [filteredTables]);
  const statusTone = {
    available: "border-emerald-200 bg-emerald-50 text-emerald-900",
    reserved: "border-amber-200 bg-amber-50 text-amber-900",
    occupied: "border-rose-200 bg-rose-50 text-rose-900",
    cleaning: "border-sky-200 bg-sky-50 text-sky-900",
    inactive: "border-zinc-200 bg-zinc-100 text-zinc-500"
  };
  const turnoverStats = useMemo(
    () => ({
      reserved: filteredTables.filter((item) => item.status === "reserved").length,
      occupied: filteredTables.filter((item) => item.status === "occupied").length,
      cleaning: filteredTables.filter((item) => item.status === "cleaning").length,
      available: filteredTables.filter((item) => item.status === "available").length
    }),
    [filteredTables]
  );
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
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={viewMode === "floor" ? "secondary" : "outline"}
                  onClick={() => setViewMode("floor")}
                >
                  Sơ đồ
                </Button>
                <Button
                  type="button"
                  variant={viewMode === "list" ? "secondary" : "outline"}
                  onClick={() => setViewMode("list")}
                >
                  Danh sách
                </Button>
                {permissions.canManageTables ? (
                  <Button type="button" variant="secondary" onClick={() => setTableCreateOpen(true)}>
                    Tạo bàn
                  </Button>
                ) : null}
              </div>
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
                <Input type="number" min="0" placeholder="Giá đặt tối thiểu" value={tableDraft.minSpend} onChange={(event) => setTableDraft((prev) => ({ ...prev, minSpend: Number(event.target.value) }))} />
              </div>
              <div className={styles.inlineRow}>
                <FormSelect value={tableDraft.status} onValueChange={(value) => setTableDraft((prev) => ({ ...prev, status: value }))} options={tableStatuses} placeholder="Trạng thái" />
              </div>
              <Textarea placeholder="Ghi chú" rows={3} value={tableDraft.notes} onChange={(event) => setTableDraft((prev) => ({ ...prev, notes: event.target.value }))} />
              <Button type="submit" loading={tableSaving} loadingLabel="Đang tạo...">Lưu bàn</Button>
            </form>
            </AdminFormDialog>
          ) : null}
          {viewMode === "floor" ? (
            filteredTables.length ? (
              <div className="grid gap-4">
                <div className="grid gap-3 md:grid-cols-4">
                  {[
                    { key: "available", label: "Bàn trống", value: turnoverStats.available },
                    { key: "reserved", label: "Đang giữ", value: turnoverStats.reserved },
                    { key: "occupied", label: "Đang phục vụ", value: turnoverStats.occupied },
                    { key: "cleaning", label: "Đang dọn", value: turnoverStats.cleaning }
                  ].map((item) => (
                    <div key={item.key} className={`rounded-3xl border p-4 shadow-sm ${statusTone[item.key] || "border-zinc-200 bg-white text-zinc-900"}`}>
                      <span className="text-xs font-semibold uppercase tracking-[0.12em] opacity-70">{item.label}</span>
                      <strong className="mt-2 block text-2xl">{item.value}</strong>
                    </div>
                  ))}
                </div>
                {tablesByArea.map((group) => {
                  const availableCount = group.items.filter((item) => item.status === "available").length;
                  return (
                    <AdminSurfaceCard
                      key={group.area}
                      kicker="Khu vực"
                      title={group.area}
                      description={`${group.items.length} bàn • ${availableCount} bàn trống`}
                      bodyClassName="p-4 sm:p-5"
                    >
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                        {group.items.map((item) => (
                          (() => {
                            const timing = getTableTimingMeta(item);
                            return (
                              <article
                                key={item.id}
                                className={`cursor-pointer rounded-3xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${statusTone[item.status] || "border-zinc-200 bg-white text-zinc-900"}`}
                                onClick={() => openSectionDetail("tables", item.id)}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <strong className="block text-lg">{item.name}</strong>
                                    <span className="text-sm opacity-75">{item.capacity} khách • {formatCurrency(item.minSpend)}</span>
                                  </div>
                                  <span className="rounded-full bg-white/70 px-2.5 py-1 text-xs font-semibold shadow-sm">
                                    {formatLabel(item.status)}
                                  </span>
                                </div>
                                <div className="mt-3 rounded-2xl bg-white/65 p-3 text-sm shadow-sm">
                                  <span className="block text-xs font-semibold uppercase tracking-[0.12em] opacity-60">{timing.label}</span>
                                  <strong className="mt-1 block">{timing.value}</strong>
                                </div>
                                {item.notes ? <p className="mt-3 line-clamp-2 text-sm opacity-75">{item.notes}</p> : null}
                                {permissions.canManageTables ? (
                                  <div className="mt-4 flex flex-wrap gap-2">
                                    {["available", "reserved", "occupied", "cleaning"].map((status) => (
                                      <Button
                                        key={status}
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={tableSaving || item.status === status}
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          patchTableEntry(item, { status });
                                        }}
                                      >
                                        {formatLabel(status)}
                                      </Button>
                                    ))}
                                  </div>
                                ) : null}
                              </article>
                            );
                          })()
                        ))}
                      </div>
                    </AdminSurfaceCard>
                  );
                })}
              </div>
            ) : (
              <AdminEmptyState title="Chưa có bàn phù hợp." description="Thử đổi bộ lọc hoặc tạo bàn mới cho chi nhánh này." />
            )
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bàn</TableHead>
                    <TableHead>Khu vực</TableHead>
                    <TableHead>Sức chứa</TableHead>
                    <TableHead>Giá tối thiểu</TableHead>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagination.pagedItems.map((item) => {
                    const timing = getTableTimingMeta(item);
                    return (
                    <TableRow key={item.id} className={styles.interactiveRow} onClick={() => openSectionDetail("tables", item.id)}>
                      <TableCell data-label="Bàn"><strong>{item.name}</strong><span>{item.notes || "Nhấn để xem chi tiết"}</span></TableCell>
                      <TableCell data-label="Khu vực">{item.area}</TableCell>
                      <TableCell data-label="Sức chứa">{item.capacity}</TableCell>
                      <TableCell data-label="Giá tối thiểu">{formatCurrency(item.minSpend)}</TableCell>
                      <TableCell data-label="Thời gian"><strong>{timing.value}</strong><span>{timing.label}</span></TableCell>
                      <TableCell data-label="Trạng thái"><span className={`${styles.statusBadge} ${styles[`status_${item.status}`] || styles.status_new}`}>{formatLabel(item.status)}</span></TableCell>
                      <TableCell data-label="Hành động" className="text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={(event) => {
                              event.stopPropagation();
                              openSectionDetail("tables", item.id);
                            }}
                          >
                            Xem
                          </Button>
                          {permissions.canManageTables ? (
                            <Button
                              type="button"
                              variant="destructive"
                              onClick={(event) => {
                                event.stopPropagation();
                                deleteTableEntry(item.id);
                              }}
                            >
                              Xóa
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                  })}
                </TableBody>
              </Table>
              <AdminTableFooter {...pagination} />
            </>
          )}
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
              <div className="mb-5 grid gap-3 md:grid-cols-3">
                {(() => {
                  const timing = getTableTimingMeta(selectedTable);
                  return (
                    <>
                      <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4">
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Trạng thái</span>
                        <strong className="mt-2 block text-lg">{formatLabel(selectedTable.status)}</strong>
                      </div>
                      <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4">
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">{timing.label}</span>
                        <strong className="mt-2 block text-lg">{timing.value}</strong>
                      </div>
                      <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4">
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Giá tối thiểu</span>
                        <strong className="mt-2 block text-lg">{formatCurrency(selectedTable.minSpend)}</strong>
                      </div>
                    </>
                  );
                })()}
              </div>
              <div className={styles.editGrid}>
                <label><span>Tên bàn</span><Input type="text" value={tableEdit.name} disabled={!permissions.canManageTables} onChange={(event) => setTableEdit((prev) => ({ ...prev, name: event.target.value }))} /></label>
                <label><span>Khu vực</span><Input type="text" value={tableEdit.area} disabled={!permissions.canManageTables} onChange={(event) => setTableEdit((prev) => ({ ...prev, area: event.target.value }))} /></label>
                <label><span>Sức chứa</span><Input type="number" min="1" value={tableEdit.capacity} disabled={!permissions.canManageTables} onChange={(event) => setTableEdit((prev) => ({ ...prev, capacity: Number(event.target.value) }))} /></label>
                <label><span>Giá đặt tối thiểu</span><Input type="number" min="0" value={tableEdit.minSpend} disabled={!permissions.canManageTables} onChange={(event) => setTableEdit((prev) => ({ ...prev, minSpend: Number(event.target.value) }))} /></label>
                <label><span>Trạng thái</span><FormSelect value={tableEdit.status} disabled={!permissions.canManageTables} onValueChange={(value) => setTableEdit((prev) => ({ ...prev, status: value }))} options={tableStatuses} placeholder="Trạng thái" /></label>
                <label className={styles.fullWidth}><span>Ghi chú</span><Textarea rows={5} value={tableEdit.notes} disabled={!permissions.canManageTables} onChange={(event) => setTableEdit((prev) => ({ ...prev, notes: event.target.value }))} /></label>
                              </div>
              {permissions.canManageTables ? <div className={styles.detailActions}><Button type="button" className={styles.saveButton} onClick={saveTableEdit} loading={tableSaving} loadingLabel="Đang lưu...">Lưu bàn</Button></div> : null}
              <div className="mt-6 rounded-3xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Audit bàn</span>
                    <h3 className="mt-1 text-base font-semibold text-zinc-950">Lịch sử trạng thái</h3>
                  </div>
                  <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-500">
                    {selectedTableEvents.length} sự kiện
                  </span>
                </div>
                {selectedTableEvents.length ? (
                  <div className="grid gap-2">
                    {selectedTableEvents.slice(0, 8).map((event) => (
                      <article key={event.id} className="grid gap-2 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                        <div>
                          <strong className="text-sm text-zinc-950">
                            {event.fromStatus ? `${formatLabel(event.fromStatus)} -> ` : ""}
                            {formatLabel(event.toStatus)}
                          </strong>
                          <p className="mt-1 text-sm text-zinc-500">
                            {event.actorName || "Hệ thống"} cập nhật lúc {formatDate(event.createdAt)}
                          </p>
                        </div>
                        {event.durationMinutes !== null ? (
                          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600">
                            Sau {event.durationMinutes} phút
                          </span>
                        ) : null}
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500">
                    Chưa có lịch sử đổi trạng thái. Sau khi chạy migration 015, mỗi lần đổi trạng thái bàn sẽ được ghi tại đây.
                  </p>
                )}
              </div>
            </AdminSurfaceCard>
          ) : (
            <AdminEmptyState title="Không tìm thấy bàn." description="Bàn có thể đã bị xóa hoặc không thuộc chi nhánh đang xem." />
          )}
        </AdminDetailShell>
      ) : null}
    </section>
  );
}
