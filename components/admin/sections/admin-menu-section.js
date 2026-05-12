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

export default function AdminMenuSection({
  detailOnlyLayout,
  permissions,
  menuCreateOpen,
  setMenuCreateOpen,
  menuQuery,
  setMenuQuery,
  menuStatusFilter,
  setMenuStatusFilter,
  menuSort,
  setMenuSort,
  menuSortOptions,
  availabilityStatuses,
  spicyLevels,
  createMenuItemEntry,
  menuDraft,
  setMenuDraft,
  menuSaving,
  filteredMenuItems,
  selectedMenuItem,
  openSectionDetail,
  formatCurrency,
  formatLabel,
  detailHeaderActions,
  deleteMenuItemEntry,
  menuEdit,
  setMenuEdit,
  saveMenuEdit,
  FormSelect
}) {
  const pagination = useTablePagination(filteredMenuItems);
  const activeFilterItems = [
    {
      key: "query",
      active: Boolean(menuQuery.trim()),
      label: `Tìm: ${menuQuery.trim()}`,
      onClear: () => setMenuQuery("")
    },
    {
      key: "status",
      active: menuStatusFilter !== "all",
      label: `Trạng thái: ${formatLabel(menuStatusFilter)}`,
      onClear: () => setMenuStatusFilter("all")
    },
    {
      key: "sort",
      active: menuSort !== "name_asc",
      label: `Sắp xếp: ${menuSortOptions.find((item) => item.value === menuSort)?.label || menuSort}`,
      onClear: () => setMenuSort("name_asc")
    }
  ];

  return (
    <section className="grid w-full min-w-0 gap-4">
      {!detailOnlyLayout ? (
        <AdminListShell>
          <AdminPageToolbar
            actions={
              permissions.canManageMenu ? (
                <Button type="button" variant="secondary" onClick={() => setMenuCreateOpen(true)}>
                  Tạo món
                </Button>
              ) : null
            }
            footer={
              <AdminActiveFilters
                items={activeFilterItems}
                onClearAll={() => {
                  setMenuQuery("");
                  setMenuStatusFilter("all");
                  setMenuSort("name_asc");
                }}
              />
            }
          >
            <Input type="search" placeholder="Tìm món..." value={menuQuery} onChange={(event) => setMenuQuery(event.target.value)} />
            <FormSelect value={menuStatusFilter} onValueChange={setMenuStatusFilter} options={[{ value: "all", label: "Tất cả trạng thái" }, ...availabilityStatuses]} placeholder="Lọc trạng thái" />
            <FormSelect value={menuSort} onValueChange={setMenuSort} options={menuSortOptions} placeholder="Sắp xếp" />
          </AdminPageToolbar>
          {permissions.canManageMenu ? (
            <AdminFormDialog
              open={menuCreateOpen}
              onOpenChange={setMenuCreateOpen}
              title="Tạo món mới"
              description="Thêm món mới vào thực đơn với giá, trạng thái phục vụ và ghi chú theo mùa."
              size="wide"
            >
            <form className={styles.inlineForm} onSubmit={createMenuItemEntry}>
              <Input type="text" placeholder="Tên món" value={menuDraft.name} onChange={(event) => setMenuDraft((prev) => ({ ...prev, name: event.target.value }))} required />
              <Input type="text" placeholder="Danh mục" value={menuDraft.category} onChange={(event) => setMenuDraft((prev) => ({ ...prev, category: event.target.value }))} />
              <div className={styles.inlineRow}>
                <Input type="number" min="0" placeholder="Giá" value={menuDraft.price} onChange={(event) => setMenuDraft((prev) => ({ ...prev, price: Number(event.target.value) }))} />
                <FormSelect value={menuDraft.spicyLevel} onValueChange={(value) => setMenuDraft((prev) => ({ ...prev, spicyLevel: value }))} options={spicyLevels} placeholder="Mức cay" />
              </div>
              <div className={styles.inlineRow}>
                <FormSelect value={menuDraft.availabilityStatus} onValueChange={(value) => setMenuDraft((prev) => ({ ...prev, availabilityStatus: value }))} options={availabilityStatuses} placeholder="Trạng thái món" />
                <FormSelect value={menuDraft.isFeatured ? "yes" : "no"} onValueChange={(value) => setMenuDraft((prev) => ({ ...prev, isFeatured: value === "yes" }))} options={[{ value: "yes", label: "Món nổi bật" }, { value: "no", label: "Món thường" }]} placeholder="Độ ưu tiên" />
              </div>
              <Input type="text" placeholder="Đường dẫn ảnh" value={menuDraft.imageUrl} onChange={(event) => setMenuDraft((prev) => ({ ...prev, imageUrl: event.target.value }))} />
              <Textarea placeholder="Ghi chú theo mùa / tồn kho" rows={2} value={menuDraft.seasonNote} onChange={(event) => setMenuDraft((prev) => ({ ...prev, seasonNote: event.target.value }))} />
              <Textarea placeholder="Mô tả" rows={3} value={menuDraft.description} onChange={(event) => setMenuDraft((prev) => ({ ...prev, description: event.target.value }))} />
              <Button type="submit" disabled={menuSaving}>{menuSaving ? "Đang tạo..." : "Lưu món"}</Button>
            </form>
            </AdminFormDialog>
          ) : null}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Món</TableHead>
                <TableHead>Danh mục</TableHead>
                <TableHead>Giá</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagination.pagedItems.map((item) => (
                <TableRow key={item.id} className={styles.interactiveRow} onClick={() => openSectionDetail("menu", item.id)}>
                  <TableCell data-label="Món"><strong>{item.name}</strong><span>{item.slug}</span></TableCell>
                  <TableCell data-label="Danh mục">{item.category}</TableCell>
                  <TableCell data-label="Giá">{formatCurrency(item.price)}</TableCell>
                  <TableCell data-label="Trạng thái"><span className={`${styles.statusBadge} ${styles[`status_${item.availabilityStatus || (item.isAvailable ? "confirmed" : "cancelled")}`] || styles.status_confirmed}`}>{formatLabel(item.availabilityStatus || (item.isAvailable ? "available" : "hidden"))}</span></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <AdminTableFooter {...pagination} />
        </AdminListShell>
      ) : null}
      {detailOnlyLayout ? (
        <AdminDetailShell>
          {selectedMenuItem ? (
            <AdminSurfaceCard
              kicker="Chi tiết món ăn"
              title={selectedMenuItem.name}
              actions={detailHeaderActions("menu", permissions.canManageMenu ? <Button className={styles.deleteButton} variant="destructive" type="button" onClick={() => deleteMenuItemEntry(selectedMenuItem.id)}>Xóa món</Button> : null)}
              className={styles.subsectionCard}
            >
              <div className={styles.editGrid}>
                <label><span>Tên món</span><Input type="text" value={menuEdit.name} disabled={!permissions.canManageMenu} onChange={(event) => setMenuEdit((prev) => ({ ...prev, name: event.target.value }))} /></label>
                <label><span>Slug</span><Input type="text" value={menuEdit.slug} disabled={!permissions.canManageMenu} onChange={(event) => setMenuEdit((prev) => ({ ...prev, slug: event.target.value }))} /></label>
                <label><span>Danh mục</span><Input type="text" value={menuEdit.category} disabled={!permissions.canManageMenu} onChange={(event) => setMenuEdit((prev) => ({ ...prev, category: event.target.value }))} /></label>
                <label><span>Giá</span><Input type="number" min="0" value={menuEdit.price} disabled={!permissions.canManageMenu} onChange={(event) => setMenuEdit((prev) => ({ ...prev, price: Number(event.target.value) }))} /></label>
                <label><span>Đường dẫn ảnh</span><Input type="text" value={menuEdit.imageUrl} disabled={!permissions.canManageMenu} onChange={(event) => setMenuEdit((prev) => ({ ...prev, imageUrl: event.target.value }))} /></label>
                <label><span>Hiển thị</span><FormSelect value={menuEdit.isAvailable ? "yes" : "no"} disabled={!permissions.canManageMenu} onValueChange={(value) => setMenuEdit((prev) => ({ ...prev, isAvailable: value === "yes" }))} options={[{ value: "yes", label: "Có" }, { value: "no", label: "Không" }]} placeholder="Hiển thị" /></label>
                <label><span>Món nổi bật</span><FormSelect value={menuEdit.isFeatured ? "yes" : "no"} disabled={!permissions.canManageMenu} onValueChange={(value) => setMenuEdit((prev) => ({ ...prev, isFeatured: value === "yes" }))} options={[{ value: "yes", label: "Có" }, { value: "no", label: "Không" }]} placeholder="Món nổi bật" /></label>
                <label><span>Mức cay</span><FormSelect value={menuEdit.spicyLevel} disabled={!permissions.canManageMenu} onValueChange={(value) => setMenuEdit((prev) => ({ ...prev, spicyLevel: value }))} options={spicyLevels} placeholder="Mức cay" /></label>
                <label><span>Trạng thái món</span><FormSelect value={menuEdit.availabilityStatus || "available"} disabled={!permissions.canManageMenu} onValueChange={(value) => setMenuEdit((prev) => ({ ...prev, availabilityStatus: value }))} options={availabilityStatuses} placeholder="Trạng thái món" /></label>
                <label className={styles.fullWidth}><span>Ghi chú theo mùa / tồn kho</span><Textarea rows={3} value={menuEdit.seasonNote || ""} disabled={!permissions.canManageMenu} onChange={(event) => setMenuEdit((prev) => ({ ...prev, seasonNote: event.target.value }))} /></label>
                <label className={styles.fullWidth}><span>Mô tả</span><Textarea rows={5} value={menuEdit.description} disabled={!permissions.canManageMenu} onChange={(event) => setMenuEdit((prev) => ({ ...prev, description: event.target.value }))} /></label>
              </div>
              {permissions.canManageMenu ? <div className={styles.detailActions}><Button type="button" className={styles.saveButton} onClick={saveMenuEdit} disabled={menuSaving}>{menuSaving ? "Đang lưu..." : "Lưu món"}</Button></div> : null}
            </AdminSurfaceCard>
          ) : (
            <AdminEmptyState title="Không tìm thấy món ăn." description="Món này có thể đã bị xóa hoặc không thuộc chi nhánh đang xem." />
          )}
        </AdminDetailShell>
      ) : null}
    </section>
  );
}
