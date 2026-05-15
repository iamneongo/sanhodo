"use client";

import { useState } from "react";
import AdminActiveFilters from "../admin-active-filters";
import AdminEmptyState from "../admin-empty-state";
import AdminFormDialog from "../admin-form-dialog";
import AdminPageToolbar from "../admin-page-toolbar";
import AdminStatCard from "../admin-stat-card";
import AdminSurfaceCard from "../admin-surface-card";
import AdminTableFooter from "../admin-table-footer";
import { AdminDetailShell, AdminListShell } from "../admin-panel-shell";
import useTablePagination from "../use-table-pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { getBranchLandingPath } from "../../../lib/branches";
import styles from "../../admin.module.css";

export default function AdminBranchesSection({
  detailOnlyLayout,
  permissions,
  branchStats,
  branchDetailStats,
  branchCreateOpen,
  setBranchCreateOpen,
  branchStaffCreateOpen,
  setBranchStaffCreateOpen,
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
  uploadLandingImage,
  deleteBranchEntry,
  branchAssignments,
  profiles,
  availableProfilesForBranch,
  branchStaffDraft,
  setBranchStaffDraft,
  branchStaffSaving,
  createBranchStaffAssignment,
  updateBranchStaffAssignment,
  deleteBranchStaffAssignment,
  roleLabels,
  formatDate,
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
  const branchRoleOptions = [
    { value: "manager", label: roleLabels.manager || "Quản lý" },
    { value: "branch_manager", label: roleLabels.branch_manager || "Quản lý chi nhánh" },
    { value: "staff", label: roleLabels.staff || "Nhân viên" },
    { value: "driver", label: roleLabels.driver || "Tài xế" },
    { value: "admin", label: roleLabels.admin || "Quản trị viên" }
  ];
  const getProfileName = (profileId) =>
    profiles.find((item) => item.id === profileId)?.fullName ||
    profiles.find((item) => item.id === profileId)?.email ||
    "Nhân sự nội bộ";
  const [uploadingLandingField, setUploadingLandingField] = useState("");
  const updateLandingConfig = (key, value) =>
    setBranchEdit((prev) => ({
      ...prev,
      landingConfig: {
        ...(prev.landingConfig || {}),
        [key]: value
      }
    }));
  const handleLandingImageUpload = async (fieldKey, file) => {
    if (!file || !selectedManagedBranch) {
      return;
    }

    setUploadingLandingField(fieldKey);
    try {
      const uploadedUrl = await uploadLandingImage(file, selectedManagedBranch.id);
      if (uploadedUrl) {
        updateLandingConfig(fieldKey, uploadedUrl);
      }
    } finally {
      setUploadingLandingField("");
    }
  };
  const renderLandingImageField = (fieldKey, label, helperText) => {
    const value = branchEdit.landingConfig?.[fieldKey] || "";
    const uploading = uploadingLandingField === fieldKey;

    return (
      <div className={styles.fullWidth}>
        <div className="grid gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
          <div className="grid gap-1">
            <span className="text-sm font-medium text-zinc-900">{label}</span>
            {helperText ? <p className="text-sm text-zinc-500">{helperText}</p> : null}
          </div>
          {value ? (
            <img
              src={value}
              alt={label}
              className="h-44 w-full rounded-xl border border-zinc-200 object-cover"
            />
          ) : (
            <div className="flex h-44 items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-white text-sm text-zinc-500">
              Chưa có ảnh cho khu vực này
            </div>
          )}
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
            <Input
              type="text"
              value={value}
              disabled={!permissions.canManageBranches}
              placeholder="Dán URL ảnh hoặc upload trực tiếp"
              onChange={(event) => updateLandingConfig(fieldKey, event.target.value)}
            />
            <Input
              type="file"
              accept="image/*"
              disabled={!permissions.canManageBranches || uploading}
              onChange={(event) => handleLandingImageUpload(fieldKey, event.target.files?.[0])}
            />
          </div>
          {permissions.canManageBranches && value ? (
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => updateLandingConfig(fieldKey, "")}
              >
                Gỡ ảnh
              </Button>
            </div>
          ) : null}
          {uploading ? <p className="text-sm text-zinc-500">Đang xử lý và upload ảnh...</p> : null}
        </div>
      </div>
    );
  };

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
                <Button type="submit" loading={branchSaving} loadingLabel="Đang tạo...">
                  Lưu chi nhánh
                </Button>
              </form>
            </AdminFormDialog>
          ) : null}

          <div className={styles.statsStrip}>
            <AdminStatCard
              label="Tổng chi nhánh"
              value={branchStats.total}
              detail={`${branchStats.active} đang hoạt động`}
              accent="soft"
            />
            <AdminStatCard
              label="Chi nhánh tạm ẩn"
              value={branchStats.inactive}
              detail="Có thể bật lại bất kỳ lúc nào"
              accent="default"
            />
          </div>

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
            <>
              <AdminSurfaceCard
                kicker="Chi tiết chi nhánh"
                title={selectedManagedBranch.name}
                actions={detailHeaderActions(
                  "branches",
                  permissions.canManageBranches ? (
                    <Button
                      className={styles.deleteButton}
                      variant="destructive"
                      type="button"
                      onClick={() => deleteBranchEntry(selectedManagedBranch.id)}
                    >
                      Xóa chi nhánh
                    </Button>
                  ) : null
                )}
                className={styles.subsectionCard}
              >
                <div className={styles.metaGrid}>
                  <div>
                    <span>Tạo lúc</span>
                    <strong>{selectedManagedBranch.createdAt ? formatDate(selectedManagedBranch.createdAt) : "-"}</strong>
                  </div>
                  <div>
                    <span>Cập nhật gần nhất</span>
                    <strong>{selectedManagedBranch.updatedAt ? formatDate(selectedManagedBranch.updatedAt) : "-"}</strong>
                  </div>
                </div>
                <div className={styles.statsStrip}>
                  <AdminStatCard label="Nhân sự" value={branchDetailStats.staff} detail="Người đang được gán" accent="soft" />
                  <AdminStatCard label="Bàn" value={branchDetailStats.tables} detail="Sơ đồ chỗ ngồi" accent="default" />
                  <AdminStatCard label="Món ăn" value={branchDetailStats.menuItems} detail="Món đang thuộc chi nhánh" accent="default" />
                  <AdminStatCard label="Đặt bàn" value={branchDetailStats.reservations} detail="Lead đã ghi nhận" accent="default" />
                  <AdminStatCard label="Đơn hàng" value={branchDetailStats.orders} detail="Đơn đang lưu" accent="default" />
                  <AdminStatCard label="Voucher" value={branchDetailStats.vouchers} detail="Lead nhận ưu đãi" accent="default" />
                </div>
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
                    <Button
                      type="button"
                      className={styles.saveButton}
                      onClick={saveBranchEdit}
                      loading={branchSaving}
                      loadingLabel="Đang lưu..."
                    >
                      Lưu chi nhánh
                    </Button>
                  </div>
                ) : null}
              </AdminSurfaceCard>

              <AdminSurfaceCard
                kicker="Landing page chi nhánh"
                title="Nội dung công khai cho landing page"
                actions={
                  <a
                    className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                    href={getBranchLandingPath(selectedManagedBranch)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Mở landing page
                  </a>
                }
                className={styles.subsectionCard}
              >
                <div className={styles.editGrid}>
                  <label>
                    <span>SEO title</span>
                    <Input
                      type="text"
                      value={branchEdit.landingConfig?.seoTitle || ""}
                      disabled={!permissions.canManageBranches}
                      onChange={(event) => updateLandingConfig("seoTitle", event.target.value)}
                    />
                  </label>
                  <label className={styles.fullWidth}>
                    <span>SEO description</span>
                    <Textarea
                      rows={3}
                      value={branchEdit.landingConfig?.seoDescription || ""}
                      disabled={!permissions.canManageBranches}
                      onChange={(event) => updateLandingConfig("seoDescription", event.target.value)}
                    />
                  </label>
                  {renderLandingImageField(
                    "heroImageUrl",
                    "Ảnh hero",
                    "Ảnh đầu trang lớn nhất. Nên dùng ảnh ngang rộng, sáng rõ mặt tiền hoặc không gian nổi bật."
                  )}
                  <label>
                    <span>Brand dòng 1</span>
                    <Input
                      type="text"
                      value={branchEdit.landingConfig?.brandPrimary || ""}
                      disabled={!permissions.canManageBranches}
                      onChange={(event) => updateLandingConfig("brandPrimary", event.target.value)}
                    />
                  </label>
                  <label>
                    <span>Brand dòng 2</span>
                    <Input
                      type="text"
                      value={branchEdit.landingConfig?.brandSecondary || ""}
                      disabled={!permissions.canManageBranches}
                      onChange={(event) => updateLandingConfig("brandSecondary", event.target.value)}
                    />
                  </label>
                  <label>
                    <span>Hero eyebrow</span>
                    <Input
                      type="text"
                      value={branchEdit.landingConfig?.heroEyebrow || ""}
                      disabled={!permissions.canManageBranches}
                      onChange={(event) => updateLandingConfig("heroEyebrow", event.target.value)}
                    />
                  </label>
                  <label>
                    <span>Hero title</span>
                    <Input
                      type="text"
                      value={branchEdit.landingConfig?.heroTitle || ""}
                      disabled={!permissions.canManageBranches}
                      onChange={(event) => updateLandingConfig("heroTitle", event.target.value)}
                    />
                  </label>
                  <label>
                    <span>Hero subtitle</span>
                    <Input
                      type="text"
                      value={branchEdit.landingConfig?.heroSubtitle || ""}
                      disabled={!permissions.canManageBranches}
                      onChange={(event) => updateLandingConfig("heroSubtitle", event.target.value)}
                    />
                  </label>
                  <label className={styles.fullWidth}>
                    <span>Mô tả hero</span>
                    <Textarea
                      rows={4}
                      value={branchEdit.landingConfig?.heroDescription || ""}
                      disabled={!permissions.canManageBranches}
                      onChange={(event) => updateLandingConfig("heroDescription", event.target.value)}
                    />
                  </label>
                  <label>
                    <span>Nút chính</span>
                    <Input
                      type="text"
                      value={branchEdit.landingConfig?.primaryCtaLabel || ""}
                      disabled={!permissions.canManageBranches}
                      onChange={(event) => updateLandingConfig("primaryCtaLabel", event.target.value)}
                    />
                  </label>
                  <label>
                    <span>Nút phụ</span>
                    <Input
                      type="text"
                      value={branchEdit.landingConfig?.secondaryCtaLabel || ""}
                      disabled={!permissions.canManageBranches}
                      onChange={(event) => updateLandingConfig("secondaryCtaLabel", event.target.value)}
                    />
                  </label>
                  <label>
                    <span>Kicker combo</span>
                    <Input
                      type="text"
                      value={branchEdit.landingConfig?.comboSectionKicker || ""}
                      disabled={!permissions.canManageBranches}
                      onChange={(event) => updateLandingConfig("comboSectionKicker", event.target.value)}
                    />
                  </label>
                  <label className={styles.fullWidth}>
                    <span>Tiêu đề combo</span>
                    <Input
                      type="text"
                      value={branchEdit.landingConfig?.comboSectionTitle || ""}
                      disabled={!permissions.canManageBranches}
                      onChange={(event) => updateLandingConfig("comboSectionTitle", event.target.value)}
                    />
                  </label>
                  <label>
                    <span>Combo 1 - tên</span>
                    <Input
                      type="text"
                      value={branchEdit.landingConfig?.comboOneTitle || ""}
                      disabled={!permissions.canManageBranches}
                      onChange={(event) => updateLandingConfig("comboOneTitle", event.target.value)}
                    />
                  </label>
                  <label>
                    <span>Combo 1 - giá</span>
                    <Input
                      type="text"
                      value={branchEdit.landingConfig?.comboOnePrice || ""}
                      disabled={!permissions.canManageBranches}
                      onChange={(event) => updateLandingConfig("comboOnePrice", event.target.value)}
                    />
                  </label>
                  <label>
                    <span>Combo 1 - giá gốc</span>
                    <Input
                      type="text"
                      value={branchEdit.landingConfig?.comboOneOriginalPrice || ""}
                      disabled={!permissions.canManageBranches}
                      onChange={(event) => updateLandingConfig("comboOneOriginalPrice", event.target.value)}
                    />
                  </label>
                  <label>
                    <span>Combo 1 - badge</span>
                    <Input
                      type="text"
                      value={branchEdit.landingConfig?.comboOneBadge || ""}
                      disabled={!permissions.canManageBranches}
                      onChange={(event) => updateLandingConfig("comboOneBadge", event.target.value)}
                    />
                  </label>
                  <label>
                    <span>Combo 1 - phục vụ</span>
                    <Input
                      type="text"
                      value={branchEdit.landingConfig?.comboOneServes || ""}
                      disabled={!permissions.canManageBranches}
                      onChange={(event) => updateLandingConfig("comboOneServes", event.target.value)}
                    />
                  </label>
                  <label className={styles.fullWidth}>
                    <span>Combo 1 - mô tả</span>
                    <Textarea
                      rows={3}
                      value={branchEdit.landingConfig?.comboOneDescription || ""}
                      disabled={!permissions.canManageBranches}
                      onChange={(event) => updateLandingConfig("comboOneDescription", event.target.value)}
                    />
                  </label>
                  <label>
                    <span>Combo 2 - tên</span>
                    <Input
                      type="text"
                      value={branchEdit.landingConfig?.comboTwoTitle || ""}
                      disabled={!permissions.canManageBranches}
                      onChange={(event) => updateLandingConfig("comboTwoTitle", event.target.value)}
                    />
                  </label>
                  <label>
                    <span>Combo 2 - giá</span>
                    <Input
                      type="text"
                      value={branchEdit.landingConfig?.comboTwoPrice || ""}
                      disabled={!permissions.canManageBranches}
                      onChange={(event) => updateLandingConfig("comboTwoPrice", event.target.value)}
                    />
                  </label>
                  <label>
                    <span>Combo 2 - giá gốc</span>
                    <Input
                      type="text"
                      value={branchEdit.landingConfig?.comboTwoOriginalPrice || ""}
                      disabled={!permissions.canManageBranches}
                      onChange={(event) => updateLandingConfig("comboTwoOriginalPrice", event.target.value)}
                    />
                  </label>
                  <label>
                    <span>Combo 2 - badge</span>
                    <Input
                      type="text"
                      value={branchEdit.landingConfig?.comboTwoBadge || ""}
                      disabled={!permissions.canManageBranches}
                      onChange={(event) => updateLandingConfig("comboTwoBadge", event.target.value)}
                    />
                  </label>
                  <label>
                    <span>Combo 2 - phục vụ</span>
                    <Input
                      type="text"
                      value={branchEdit.landingConfig?.comboTwoServes || ""}
                      disabled={!permissions.canManageBranches}
                      onChange={(event) => updateLandingConfig("comboTwoServes", event.target.value)}
                    />
                  </label>
                  <label className={styles.fullWidth}>
                    <span>Combo 2 - mô tả</span>
                    <Textarea
                      rows={3}
                      value={branchEdit.landingConfig?.comboTwoDescription || ""}
                      disabled={!permissions.canManageBranches}
                      onChange={(event) => updateLandingConfig("comboTwoDescription", event.target.value)}
                    />
                  </label>
                  <label>
                    <span>Combo 3 - tên</span>
                    <Input
                      type="text"
                      value={branchEdit.landingConfig?.comboThreeTitle || ""}
                      disabled={!permissions.canManageBranches}
                      onChange={(event) => updateLandingConfig("comboThreeTitle", event.target.value)}
                    />
                  </label>
                  <label>
                    <span>Combo 3 - giá</span>
                    <Input
                      type="text"
                      value={branchEdit.landingConfig?.comboThreePrice || ""}
                      disabled={!permissions.canManageBranches}
                      onChange={(event) => updateLandingConfig("comboThreePrice", event.target.value)}
                    />
                  </label>
                  <label>
                    <span>Combo 3 - giá gốc</span>
                    <Input
                      type="text"
                      value={branchEdit.landingConfig?.comboThreeOriginalPrice || ""}
                      disabled={!permissions.canManageBranches}
                      onChange={(event) => updateLandingConfig("comboThreeOriginalPrice", event.target.value)}
                    />
                  </label>
                  <label>
                    <span>Combo 3 - badge</span>
                    <Input
                      type="text"
                      value={branchEdit.landingConfig?.comboThreeBadge || ""}
                      disabled={!permissions.canManageBranches}
                      onChange={(event) => updateLandingConfig("comboThreeBadge", event.target.value)}
                    />
                  </label>
                  <label>
                    <span>Combo 3 - phục vụ</span>
                    <Input
                      type="text"
                      value={branchEdit.landingConfig?.comboThreeServes || ""}
                      disabled={!permissions.canManageBranches}
                      onChange={(event) => updateLandingConfig("comboThreeServes", event.target.value)}
                    />
                  </label>
                  <label className={styles.fullWidth}>
                    <span>Combo 3 - mô tả</span>
                    <Textarea
                      rows={3}
                      value={branchEdit.landingConfig?.comboThreeDescription || ""}
                      disabled={!permissions.canManageBranches}
                      onChange={(event) => updateLandingConfig("comboThreeDescription", event.target.value)}
                    />
                  </label>
                  <label className={styles.fullWidth}>
                    <span>Tiêu đề giới thiệu</span>
                    <Input
                      type="text"
                      value={branchEdit.landingConfig?.aboutTitle || ""}
                      disabled={!permissions.canManageBranches}
                      onChange={(event) => updateLandingConfig("aboutTitle", event.target.value)}
                    />
                  </label>
                  <label className={styles.fullWidth}>
                    <span>Đoạn giới thiệu 1</span>
                    <Textarea
                      rows={4}
                      value={branchEdit.landingConfig?.aboutParagraphOne || ""}
                      disabled={!permissions.canManageBranches}
                      onChange={(event) => updateLandingConfig("aboutParagraphOne", event.target.value)}
                    />
                  </label>
                  <label className={styles.fullWidth}>
                    <span>Đoạn giới thiệu 2</span>
                    <Textarea
                      rows={4}
                      value={branchEdit.landingConfig?.aboutParagraphTwo || ""}
                      disabled={!permissions.canManageBranches}
                      onChange={(event) => updateLandingConfig("aboutParagraphTwo", event.target.value)}
                    />
                  </label>
                  {renderLandingImageField(
                    "aboutImageUrl",
                    "Ảnh giới thiệu",
                    "Ảnh này nằm cạnh khối giới thiệu ở phần Về chúng tôi."
                  )}
                  <label>
                    <span>Badge mặt tiền</span>
                    <Input
                      type="text"
                      value={branchEdit.landingConfig?.aboutBadgeTitle || ""}
                      disabled={!permissions.canManageBranches}
                      onChange={(event) => updateLandingConfig("aboutBadgeTitle", event.target.value)}
                    />
                  </label>
                  <label>
                    <span>Badge phụ</span>
                    <Input
                      type="text"
                      value={branchEdit.landingConfig?.aboutBadgeSubtitle || ""}
                      disabled={!permissions.canManageBranches}
                      onChange={(event) => updateLandingConfig("aboutBadgeSubtitle", event.target.value)}
                    />
                  </label>
                  <label>
                    <span>Kicker không gian</span>
                    <Input
                      type="text"
                      value={branchEdit.landingConfig?.spaceKicker || ""}
                      disabled={!permissions.canManageBranches}
                      onChange={(event) => updateLandingConfig("spaceKicker", event.target.value)}
                    />
                  </label>
                  <label>
                    <span>CTA không gian</span>
                    <Input
                      type="text"
                      value={branchEdit.landingConfig?.spaceActionLabel || ""}
                      disabled={!permissions.canManageBranches}
                      onChange={(event) => updateLandingConfig("spaceActionLabel", event.target.value)}
                    />
                  </label>
                  <label className={styles.fullWidth}>
                    <span>Tiêu đề không gian</span>
                    <Input
                      type="text"
                      value={branchEdit.landingConfig?.spaceTitle || ""}
                      disabled={!permissions.canManageBranches}
                      onChange={(event) => updateLandingConfig("spaceTitle", event.target.value)}
                    />
                  </label>
                  <label>
                    <span>Feature 1</span>
                    <Input
                      type="text"
                      value={branchEdit.landingConfig?.featureSeafoodTitle || ""}
                      disabled={!permissions.canManageBranches}
                      onChange={(event) => updateLandingConfig("featureSeafoodTitle", event.target.value)}
                    />
                  </label>
                  <label className={styles.fullWidth}>
                    <span>Mô tả feature 1</span>
                    <Textarea
                      rows={3}
                      value={branchEdit.landingConfig?.featureSeafoodDescription || ""}
                      disabled={!permissions.canManageBranches}
                      onChange={(event) => updateLandingConfig("featureSeafoodDescription", event.target.value)}
                    />
                  </label>
                  <label>
                    <span>Feature 2</span>
                    <Input
                      type="text"
                      value={branchEdit.landingConfig?.featureChefTitle || ""}
                      disabled={!permissions.canManageBranches}
                      onChange={(event) => updateLandingConfig("featureChefTitle", event.target.value)}
                    />
                  </label>
                  <label className={styles.fullWidth}>
                    <span>Mô tả feature 2</span>
                    <Textarea
                      rows={3}
                      value={branchEdit.landingConfig?.featureChefDescription || ""}
                      disabled={!permissions.canManageBranches}
                      onChange={(event) => updateLandingConfig("featureChefDescription", event.target.value)}
                    />
                  </label>
                  <label>
                    <span>Feature 3</span>
                    <Input
                      type="text"
                      value={branchEdit.landingConfig?.featureSpaceTitle || ""}
                      disabled={!permissions.canManageBranches}
                      onChange={(event) => updateLandingConfig("featureSpaceTitle", event.target.value)}
                    />
                  </label>
                  <label className={styles.fullWidth}>
                    <span>Mô tả feature 3</span>
                    <Textarea
                      rows={3}
                      value={branchEdit.landingConfig?.featureSpaceDescription || ""}
                      disabled={!permissions.canManageBranches}
                      onChange={(event) => updateLandingConfig("featureSpaceDescription", event.target.value)}
                    />
                  </label>
                  <label>
                    <span>Feature 4</span>
                    <Input
                      type="text"
                      value={branchEdit.landingConfig?.featureServiceTitle || ""}
                      disabled={!permissions.canManageBranches}
                      onChange={(event) => updateLandingConfig("featureServiceTitle", event.target.value)}
                    />
                  </label>
                  <label className={styles.fullWidth}>
                    <span>Mô tả feature 4</span>
                    <Textarea
                      rows={3}
                      value={branchEdit.landingConfig?.featureServiceDescription || ""}
                      disabled={!permissions.canManageBranches}
                      onChange={(event) => updateLandingConfig("featureServiceDescription", event.target.value)}
                    />
                  </label>
                  {renderLandingImageField(
                    "spaceImageOneUrl",
                    "Ảnh không gian 1",
                    "Ảnh đầu tiên trong gallery không gian."
                  )}
                  {renderLandingImageField(
                    "spaceImageTwoUrl",
                    "Ảnh không gian 2",
                    "Ảnh thứ hai trong gallery không gian."
                  )}
                  {renderLandingImageField(
                    "spaceImageThreeUrl",
                    "Ảnh không gian 3",
                    "Ảnh thứ ba trong gallery không gian."
                  )}
                  {renderLandingImageField(
                    "spaceImageFourUrl",
                    "Ảnh không gian 4",
                    "Ảnh thứ tư trong gallery không gian."
                  )}
                  {renderLandingImageField(
                    "newsImageOneUrl",
                    "Ảnh tin tức 1",
                    "Ảnh đầu tiên ở khối Tin tức & Ưu đãi."
                  )}
                  <label>
                    <span>Kicker tin tức</span>
                    <Input
                      type="text"
                      value={branchEdit.landingConfig?.newsKicker || ""}
                      disabled={!permissions.canManageBranches}
                      onChange={(event) => updateLandingConfig("newsKicker", event.target.value)}
                    />
                  </label>
                  <label className={styles.fullWidth}>
                    <span>Tiêu đề tin tức</span>
                    <Input
                      type="text"
                      value={branchEdit.landingConfig?.newsTitle || ""}
                      disabled={!permissions.canManageBranches}
                      onChange={(event) => updateLandingConfig("newsTitle", event.target.value)}
                    />
                  </label>
                  <label>
                    <span>Tin 1 - tag</span>
                    <Input
                      type="text"
                      value={branchEdit.landingConfig?.newsOneTag || ""}
                      disabled={!permissions.canManageBranches}
                      onChange={(event) => updateLandingConfig("newsOneTag", event.target.value)}
                    />
                  </label>
                  <label>
                    <span>Tin 1 - nhãn phụ</span>
                    <Input
                      type="text"
                      value={branchEdit.landingConfig?.newsOneDateLabel || ""}
                      disabled={!permissions.canManageBranches}
                      onChange={(event) => updateLandingConfig("newsOneDateLabel", event.target.value)}
                    />
                  </label>
                  <label className={styles.fullWidth}>
                    <span>Tin 1 - tiêu đề</span>
                    <Input
                      type="text"
                      value={branchEdit.landingConfig?.newsOneTitle || ""}
                      disabled={!permissions.canManageBranches}
                      onChange={(event) => updateLandingConfig("newsOneTitle", event.target.value)}
                    />
                  </label>
                  <label className={styles.fullWidth}>
                    <span>Tin 1 - mô tả</span>
                    <Textarea
                      rows={3}
                      value={branchEdit.landingConfig?.newsOneDescription || ""}
                      disabled={!permissions.canManageBranches}
                      onChange={(event) => updateLandingConfig("newsOneDescription", event.target.value)}
                    />
                  </label>
                  {renderLandingImageField(
                    "newsImageTwoUrl",
                    "Ảnh tin tức 2",
                    "Ảnh thứ hai ở khối Tin tức & Ưu đãi."
                  )}
                  <label>
                    <span>Tin 2 - tag</span>
                    <Input
                      type="text"
                      value={branchEdit.landingConfig?.newsTwoTag || ""}
                      disabled={!permissions.canManageBranches}
                      onChange={(event) => updateLandingConfig("newsTwoTag", event.target.value)}
                    />
                  </label>
                  <label>
                    <span>Tin 2 - nhãn phụ</span>
                    <Input
                      type="text"
                      value={branchEdit.landingConfig?.newsTwoDateLabel || ""}
                      disabled={!permissions.canManageBranches}
                      onChange={(event) => updateLandingConfig("newsTwoDateLabel", event.target.value)}
                    />
                  </label>
                  <label className={styles.fullWidth}>
                    <span>Tin 2 - tiêu đề</span>
                    <Input
                      type="text"
                      value={branchEdit.landingConfig?.newsTwoTitle || ""}
                      disabled={!permissions.canManageBranches}
                      onChange={(event) => updateLandingConfig("newsTwoTitle", event.target.value)}
                    />
                  </label>
                  <label className={styles.fullWidth}>
                    <span>Tin 2 - mô tả</span>
                    <Textarea
                      rows={3}
                      value={branchEdit.landingConfig?.newsTwoDescription || ""}
                      disabled={!permissions.canManageBranches}
                      onChange={(event) => updateLandingConfig("newsTwoDescription", event.target.value)}
                    />
                  </label>
                  {renderLandingImageField(
                    "newsImageThreeUrl",
                    "Ảnh tin tức 3",
                    "Ảnh thứ ba ở khối Tin tức & Ưu đãi."
                  )}
                  <label>
                    <span>Tin 3 - tag</span>
                    <Input
                      type="text"
                      value={branchEdit.landingConfig?.newsThreeTag || ""}
                      disabled={!permissions.canManageBranches}
                      onChange={(event) => updateLandingConfig("newsThreeTag", event.target.value)}
                    />
                  </label>
                  <label>
                    <span>Tin 3 - nhãn phụ</span>
                    <Input
                      type="text"
                      value={branchEdit.landingConfig?.newsThreeDateLabel || ""}
                      disabled={!permissions.canManageBranches}
                      onChange={(event) => updateLandingConfig("newsThreeDateLabel", event.target.value)}
                    />
                  </label>
                  <label className={styles.fullWidth}>
                    <span>Tin 3 - tiêu đề</span>
                    <Input
                      type="text"
                      value={branchEdit.landingConfig?.newsThreeTitle || ""}
                      disabled={!permissions.canManageBranches}
                      onChange={(event) => updateLandingConfig("newsThreeTitle", event.target.value)}
                    />
                  </label>
                  <label className={styles.fullWidth}>
                    <span>Tin 3 - mô tả</span>
                    <Textarea
                      rows={3}
                      value={branchEdit.landingConfig?.newsThreeDescription || ""}
                      disabled={!permissions.canManageBranches}
                      onChange={(event) => updateLandingConfig("newsThreeDescription", event.target.value)}
                    />
                  </label>
                  <label className={styles.fullWidth}>
                    <span>Mô tả footer</span>
                    <Textarea
                      rows={4}
                      value={branchEdit.landingConfig?.footerDescription || ""}
                      disabled={!permissions.canManageBranches}
                      onChange={(event) => updateLandingConfig("footerDescription", event.target.value)}
                    />
                  </label>
                </div>
              </AdminSurfaceCard>

              <AdminSurfaceCard
                kicker="Nhân sự chi nhánh"
                title="Người phụ trách và nhân sự đang được gán"
                actions={
                  permissions.canManageBranches ? (
                    <Button type="button" variant="secondary" onClick={() => setBranchStaffCreateOpen(true)}>
                      Gán nhân sự
                    </Button>
                  ) : null
                }
                className={styles.subsectionCard}
              >
                {permissions.canManageBranches ? (
                  <AdminFormDialog
                    open={branchStaffCreateOpen}
                    onOpenChange={setBranchStaffCreateOpen}
                    title="Gán nhân sự vào chi nhánh"
                    description="Chọn người phụ trách, vai trò và đánh dấu người phụ trách chính nếu cần."
                  >
                    <form className={styles.inlineForm} onSubmit={createBranchStaffAssignment}>
                      <FormSelect
                        value={branchStaffDraft.profileId}
                        onValueChange={(value) =>
                          setBranchStaffDraft((prev) => {
                            const matchedProfile = availableProfilesForBranch.find((item) => item.id === value);
                            return {
                              ...prev,
                              profileId: value,
                              role: matchedProfile?.role || prev.role || "staff"
                            };
                          })
                        }
                        options={availableProfilesForBranch.map((item) => ({
                          value: item.id,
                          label: item.fullName ? `${item.fullName} • ${item.email}` : item.email
                        }))}
                        placeholder="Chọn nhân sự"
                      />
                      <div className={styles.inlineRow}>
                        <FormSelect
                          value={branchStaffDraft.role}
                          onValueChange={(value) => setBranchStaffDraft((prev) => ({ ...prev, role: value }))}
                          options={branchRoleOptions}
                          placeholder="Vai trò"
                        />
                        <FormSelect
                          value={branchStaffDraft.isPrimary ? "primary" : "secondary"}
                          onValueChange={(value) =>
                            setBranchStaffDraft((prev) => ({ ...prev, isPrimary: value === "primary" }))
                          }
                          options={[
                            { value: "secondary", label: "Phân công phụ" },
                            { value: "primary", label: "Phụ trách chính" }
                          ]}
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={!availableProfilesForBranch.length}
                        loading={branchStaffSaving}
                        loadingLabel="Đang lưu..."
                      >
                        Lưu phân công
                      </Button>
                    </form>
                  </AdminFormDialog>
                ) : null}

                {branchAssignments.length ? (
                  <div className={styles.lineItemList}>
                    {branchAssignments.map((assignment) => (
                      <div key={assignment.id} className={styles.lineItemRow}>
                        <div>
                          <strong>{getProfileName(assignment.profileId)}</strong>
                          <span>
                            {profiles.find((item) => item.id === assignment.profileId)?.email || "-"}
                            {assignment.isPrimary ? " • Phụ trách chính" : ""}
                          </span>
                        </div>
                        <FormSelect
                          value={assignment.role}
                          disabled={!permissions.canManageBranches || branchStaffSaving}
                          onValueChange={(value) =>
                            updateBranchStaffAssignment(assignment.id, {
                              branchId: assignment.branchId,
                              profileId: assignment.profileId,
                              role: value,
                              isPrimary: assignment.isPrimary
                            })
                          }
                          options={branchRoleOptions}
                        />
                        <FormSelect
                          value={assignment.isPrimary ? "primary" : "secondary"}
                          disabled={!permissions.canManageBranches || branchStaffSaving}
                          onValueChange={(value) =>
                            updateBranchStaffAssignment(assignment.id, {
                              branchId: assignment.branchId,
                              profileId: assignment.profileId,
                              role: assignment.role,
                              isPrimary: value === "primary"
                            })
                          }
                          options={[
                            { value: "secondary", label: "Phân công phụ" },
                            { value: "primary", label: "Phụ trách chính" }
                          ]}
                        />
                        {permissions.canManageBranches ? (
                          <Button
                            type="button"
                            variant="outline"
                            disabled={branchStaffSaving}
                            onClick={() => deleteBranchStaffAssignment(assignment.id)}
                          >
                            Gỡ
                          </Button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <AdminEmptyState
                    title="Chưa có nhân sự nào được gán."
                    description="Bạn có thể gán quản lý, nhân viên hoặc tài xế vào chi nhánh này để quản trị rõ ràng hơn."
                  />
                )}
              </AdminSurfaceCard>
            </>
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
