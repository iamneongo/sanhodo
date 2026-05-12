"use client";

import AdminActiveFilters from "../admin-active-filters";
import AdminEmptyState from "../admin-empty-state";
import AdminFormDialog from "../admin-form-dialog";
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

export default function AdminBranchesSection({
  detailOnlyLayout,
  permissions,
  branchCreateOpen,
  setBranchCreateOpen,
  branchQuery,
  setBranchQuery,
  branchStatusFilter,
  setBranchStatusFilter,
  branchSort,
  setBranchSort,
  branchSortOptions,
  createBranchEntry,
  branchDraft,
  setBranchDraft,
  branchSaving,
  filteredBranches,
  selectedManagedBranch,
  openSectionDetail,
  detailHeaderActions,
  branchEdit,
  setBranchEdit,
  saveBranchEdit,
  FormSelect
}) {
  const pagination = useTablePagination(filteredBranches);
  const activeFilterItems = [
    {
      key: "query",
      active: Boolean(branchQuery.trim()),
      label: `Tìm: ${branchQuery.trim()}`,
      onClear: () => setBranchQuery("")
    },
    {
      key: "status",
      active: branchStatusFilter !== "all",
      label: `Trạng thái: ${branchStatusFilter === "active" ? "Đang hoạt động" : "Tạm ẩn"}`,
      onClear: () => setBranchStatusFilter("all")
    },
    {
      key: "sort",
      active: branchSort !== "sort_asc",
      label: `Sắp xếp: ${branchSortOptions.find((item) => item.value === branchSort)?.label || branchSort}`,
      onClear: () => setBranchSort("sort_asc")
    }
  ];

  return (
    <section className="grid w-full min-w-0 gap-4">
      {!detailOnlyLayout ? (
        <AdminListShell>
          <AdminPageToolbar
            actions={
              permissions.canManageBranches ? (
                <Button type="button" variant="secondary" onClick={() => setBranchCreateOpen(true)}>
                  Tạo chi nhánh
                </Button>
              ) : null
            }
            footer={
              <AdminActiveFilters
                items={activeFilterItems}
                onClearAll={() => {
                  setBranchQuery("");
                  setBranchStatusFilter("all");
                  setBranchSort("sort_asc");
                }}
              />
            }
          >
            <Input
              type="search"
              placeholder="Tìm chi nhánh..."
              value={branchQuery}
              onChange={(event) => setBranchQuery(event.target.value)}
            />
            <FormSelect
              value={branchStatusFilter}
              onValueChange={setBranchStatusFilter}
              options={[
                { value: "all", label: "Tất cả trạng thái" },
                { value: "active", label: "Đang hoạt động" },
                { value: "inactive", label: "Tạm ẩn" }
              ]}
              placeholder="Lọc trạng thái"
            />
            <FormSelect value={branchSort} onValueChange={setBranchSort} options={branchSortOptions} placeholder="Sắp xếp" />
          </AdminPageToolbar>

          {permissions.canManageBranches ? (
            <AdminFormDialog
              open={branchCreateOpen}
              onOpenChange={setBranchCreateOpen}
              title="Tạo chi nhánh mới"
              description="Thêm chi nhánh để áp vào menu, bàn, lead và bộ lọc toàn hệ thống."
              size="wide"
            >
              <form className={styles.inlineForm} onSubmit={createBranchEntry}>
                <div className={styles.inlineRow}>
                  <Input
                    type="text"
                    placeholder="Tên chi nhánh"
                    value={branchDraft.name}
                    onChange={(event) => setBranchDraft((prev) => ({ ...prev, name: event.target.value }))}
                    required
                  />
                  <Input
                    type="text"
                    placeholder="Tên ngắn"
                    value={branchDraft.shortName}
                    onChange={(event) => setBranchDraft((prev) => ({ ...prev, shortName: event.target.value }))}
                  />
                </div>
                <div className={styles.inlineRow}>
                  <Input
                    type="text"
                    placeholder="Mã chi nhánh"
                    value={branchDraft.code}
                    onChange={(event) => setBranchDraft((prev) => ({ ...prev, code: event.target.value }))}
                  />
                  <Input
                    type="tel"
                    placeholder="Số điện thoại"
                    value={branchDraft.phone}
                    onChange={(event) => setBranchDraft((prev) => ({ ...prev, phone: event.target.value }))}
                  />
                </div>
                <div className={styles.inlineRow}>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Thứ tự hiển thị"
                    value={branchDraft.sortOrder}
                    onChange={(event) => setBranchDraft((prev) => ({ ...prev, sortOrder: Number(event.target.value) }))}
                  />
                  <FormSelect
                    value={branchDraft.isActive ? "active" : "inactive"}
                    onValueChange={(value) =>
                      setBranchDraft((prev) => ({ ...prev, isActive: value === "active" }))
                    }
                    options={[
                      { value: "active", label: "Đang hoạt động" },
                      { value: "inactive", label: "Tạm ẩn" }
                    ]}
                  />
                </div>
                <Textarea
                  placeholder="Địa chỉ chi nhánh"
                  rows={3}
                  value={branchDraft.address}
                  onChange={(event) => setBranchDraft((prev) => ({ ...prev, address: event.target.value }))}
                />
                <Button type="submit" disabled={branchSaving}>
                  {branchSaving ? "Đang tạo..." : "Lưu chi nhánh"}
                </Button>
              </form>
            </AdminFormDialog>
          ) : null}

          <div className={styles.tableWrap}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Chi nhánh</TableHead>
                  <TableHead>Mã</TableHead>
                  <TableHead>Liên hệ</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagination.pagedItems.map((item) => (
                  <TableRow
                    key={item.id}
                    className={styles.interactiveRow}
                    onClick={() => openSectionDetail("branches", item.id)}
                  >
                    <TableCell data-label="Chi nhánh">
                      <strong>{item.name}</strong>
                      <span>{item.shortName || item.address || "-"}</span>
                    </TableCell>
                    <TableCell data-label="Mã">{item.code}</TableCell>
                    <TableCell data-label="Liên hệ">{item.phone || "-"}</TableCell>
                    <TableCell data-label="Trạng thái">
                      <span
                        className={`${styles.statusBadge} ${
                          item.isActive
                            ? styles.status_active || styles.status_confirmed
                            : styles.status_inactive || styles.status_cancelled
                        }`}
                      >
                        {item.isActive ? "Đang hoạt động" : "Tạm ẩn"}
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
          {selectedManagedBranch ? (
            <AdminSurfaceCard
              kicker="Chi tiết chi nhánh"
              title={selectedManagedBranch.name}
              actions={detailHeaderActions("branches")}
              className={styles.subsectionCard}
            >
              <div className={styles.editGrid}>
                <label>
                  <span>Tên chi nhánh</span>
                  <Input
                    type="text"
                    value={branchEdit.name}
                    disabled={!permissions.canManageBranches}
                    onChange={(event) => setBranchEdit((prev) => ({ ...prev, name: event.target.value }))}
                  />
                </label>
                <label>
                  <span>Tên ngắn</span>
                  <Input
                    type="text"
                    value={branchEdit.shortName}
                    disabled={!permissions.canManageBranches}
                    onChange={(event) => setBranchEdit((prev) => ({ ...prev, shortName: event.target.value }))}
                  />
                </label>
                <label>
                  <span>Mã chi nhánh</span>
                  <Input
                    type="text"
                    value={branchEdit.code}
                    disabled={!permissions.canManageBranches}
                    onChange={(event) => setBranchEdit((prev) => ({ ...prev, code: event.target.value }))}
                  />
                </label>
                <label>
                  <span>Số điện thoại</span>
                  <Input
                    type="tel"
                    value={branchEdit.phone}
                    disabled={!permissions.canManageBranches}
                    onChange={(event) => setBranchEdit((prev) => ({ ...prev, phone: event.target.value }))}
                  />
                </label>
                <label>
                  <span>Thứ tự hiển thị</span>
                  <Input
                    type="number"
                    min="0"
                    value={branchEdit.sortOrder}
                    disabled={!permissions.canManageBranches}
                    onChange={(event) => setBranchEdit((prev) => ({ ...prev, sortOrder: Number(event.target.value) }))}
                  />
                </label>
                <label>
                  <span>Trạng thái</span>
                  <FormSelect
                    value={branchEdit.isActive ? "active" : "inactive"}
                    disabled={!permissions.canManageBranches}
                    onValueChange={(value) =>
                      setBranchEdit((prev) => ({ ...prev, isActive: value === "active" }))
                    }
                    options={[
                      { value: "active", label: "Đang hoạt động" },
                      { value: "inactive", label: "Tạm ẩn" }
                    ]}
                  />
                </label>
                <label className={styles.fullWidth}>
                  <span>Địa chỉ</span>
                  <Textarea
                    rows={4}
                    value={branchEdit.address}
                    disabled={!permissions.canManageBranches}
                    onChange={(event) => setBranchEdit((prev) => ({ ...prev, address: event.target.value }))}
                  />
                </label>
              </div>
              {permissions.canManageBranches ? (
                <div className={styles.detailActions}>
                  <Button type="button" className={styles.saveButton} onClick={saveBranchEdit} disabled={branchSaving}>
                    {branchSaving ? "Đang lưu..." : "Lưu chi nhánh"}
                  </Button>
                </div>
              ) : null}
            </AdminSurfaceCard>
          ) : (
            <AdminEmptyState
              title="Không tìm thấy chi nhánh."
              description="Chi nhánh này có thể đã bị đổi mã hoặc chưa đồng bộ kịp với dữ liệu hiện tại."
            />
          )}
        </AdminDetailShell>
      ) : null}
    </section>
  );
}
