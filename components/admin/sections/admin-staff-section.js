"use client";

import AdminActiveFilters from "../admin-active-filters";
import AdminEmptyState from "../admin-empty-state";
import AdminPageToolbar from "../admin-page-toolbar";
import AdminStatCard from "../admin-stat-card";
import AdminSurfaceCard from "../admin-surface-card";
import AdminTableFooter from "../admin-table-footer";
import { AdminDetailShell, AdminListShell } from "../admin-panel-shell";
import useTablePagination from "../use-table-pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import styles from "../../admin.module.css";

export default function AdminStaffSection({
  detailOnlyLayout,
  permissions,
  staffQuery,
  setStaffQuery,
  staffRoleFilter,
  setStaffRoleFilter,
  staffActivityFilter,
  setStaffActivityFilter,
  staffActivityOptions,
  staffAccountStatusFilter,
  setStaffAccountStatusFilter,
  staffAccountStatusOptions,
  staffSort,
  setStaffSort,
  staffSortOptions,
  staffRoleOptions,
  filteredProfiles,
  selectedStaff,
  selectedStaffAssignments,
  branchStaffAssignments,
  branches,
  openSectionDetail,
  detailHeaderActions,
  staffEdit,
  setStaffEdit,
  saveStaffEdit,
  profileSaving,
  roleLabels,
  formatDate,
  FormSelect
}) {
  const pagination = useTablePagination(filteredProfiles);
  const activeFilterItems = [
    {
      key: "query",
      active: Boolean(staffQuery.trim()),
      label: `Tìm: ${staffQuery.trim()}`,
      onClear: () => setStaffQuery("")
    },
    {
      key: "role",
      active: staffRoleFilter !== "all",
      label: `Vai trò: ${staffRoleOptions.find((item) => item.value === staffRoleFilter)?.label || staffRoleFilter}`,
      onClear: () => setStaffRoleFilter("all")
    },
    {
      key: "activity",
      active: staffActivityFilter !== "all",
      label: `Hoạt động: ${staffActivityOptions.find((item) => item.value === staffActivityFilter)?.label || staffActivityFilter}`,
      onClear: () => setStaffActivityFilter("all")
    },
    {
      key: "account",
      active: staffAccountStatusFilter !== "all",
      label: `Tài khoản: ${staffAccountStatusOptions.find((item) => item.value === staffAccountStatusFilter)?.label || staffAccountStatusFilter}`,
      onClear: () => setStaffAccountStatusFilter("all")
    },
    {
      key: "sort",
      active: staffSort !== "name_asc",
      label: `Sắp xếp: ${staffSortOptions.find((item) => item.value === staffSort)?.label || staffSort}`,
      onClear: () => setStaffSort("name_asc")
    }
  ];
  const findBranchName = (branchId) =>
    branches.find((item) => item.id === branchId)?.shortName ||
    branches.find((item) => item.id === branchId)?.name ||
    "-";
  const getAssignmentCount = (profileId) =>
    branchStaffAssignments.filter((assignment) => assignment.profileId === profileId).length;
  const getActivityLabel = (item) => {
    if (item.isActive === false) return "Đang khóa";
    if (!item.lastLoginAt) return "Chưa đăng nhập";
    const time = new Date(item.lastLoginAt).getTime();
    if (!Number.isFinite(time)) return "Chưa rõ";
    return Date.now() - time <= 1000 * 60 * 60 * 24 * 7 ? "Đang hoạt động" : "Ít hoạt động";
  };
  const getActivityClassName = (item) => {
    if (item.isActive === false) return styles.status_cancelled || styles.status_inactive;
    if (!item.lastLoginAt) return styles.status_pending;
    const time = new Date(item.lastLoginAt).getTime();
    if (!Number.isFinite(time)) return styles.status_pending;
    return Date.now() - time <= 1000 * 60 * 60 * 24 * 7
      ? styles.status_active || styles.status_confirmed
      : styles.status_inactive || styles.status_cancelled;
  };
  const staffStats = {
    total: filteredProfiles.length,
    activeRecently: filteredProfiles.filter((item) => {
      if (!item.lastLoginAt) return false;
      const time = new Date(item.lastLoginAt).getTime();
      return Number.isFinite(time) && Date.now() - time <= 1000 * 60 * 60 * 24 * 7;
    }).length,
    assigned: filteredProfiles.filter((item) =>
      branchStaffAssignments.some((assignment) => assignment.profileId === item.id)
    ).length
  };

  return (
    <section className="grid w-full min-w-0 gap-4">
      {!detailOnlyLayout ? (
        <AdminListShell>
          <AdminPageToolbar
            footer={
              <AdminActiveFilters
                items={activeFilterItems}
                onClearAll={() => {
                  setStaffQuery("");
                  setStaffRoleFilter("all");
                  setStaffActivityFilter("all");
                  setStaffAccountStatusFilter("all");
                  setStaffSort("name_asc");
                }}
              />
            }
          >
            <Input
              type="search"
              placeholder="Tìm tên hoặc email nhân sự..."
              value={staffQuery}
              onChange={(event) => setStaffQuery(event.target.value)}
            />
            <FormSelect
              value={staffRoleFilter}
              onValueChange={setStaffRoleFilter}
              options={[{ value: "all", label: "Tất cả vai trò" }, ...staffRoleOptions]}
              placeholder="Lọc vai trò"
            />
            <FormSelect
              value={staffActivityFilter}
              onValueChange={setStaffActivityFilter}
              options={staffActivityOptions}
              placeholder="Lọc hoạt động"
            />
            <FormSelect
              value={staffAccountStatusFilter}
              onValueChange={setStaffAccountStatusFilter}
              options={staffAccountStatusOptions}
              placeholder="Lọc tài khoản"
            />
            <FormSelect value={staffSort} onValueChange={setStaffSort} options={staffSortOptions} placeholder="Sắp xếp" />
          </AdminPageToolbar>

          <div className={styles.statsStrip}>
            <AdminStatCard
              label="Tổng nhân sự"
              value={staffStats.total}
              detail={`${staffStats.assigned} người đã có phân công`}
              accent="soft"
            />
            <AdminStatCard
              label="Hoạt động 7 ngày"
              value={staffStats.activeRecently}
              detail="Có đăng nhập gần đây"
              accent="default"
            />
          </div>

          <div className={styles.tableWrap}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nhân sự</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Chi nhánh chính</TableHead>
                  <TableHead>Phân công</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Đăng nhập gần nhất</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagination.pagedItems.map((item) => (
                  <TableRow
                    key={item.id}
                    className={styles.interactiveRow}
                    onClick={() => openSectionDetail("staff", item.id)}
                  >
                    <TableCell data-label="Nhân sự">
                      <strong>{item.fullName || "Chưa đặt tên"}</strong>
                      <span>{item.email || "-"}</span>
                    </TableCell>
                    <TableCell data-label="Vai trò">{roleLabels[item.role] || item.role}</TableCell>
                    <TableCell data-label="Chi nhánh chính">{findBranchName(item.branchId)}</TableCell>
                    <TableCell data-label="Phân công">{getAssignmentCount(item.id)}</TableCell>
                    <TableCell data-label="Trạng thái">
                      <span className={`${styles.statusBadge} ${getActivityClassName(item)}`}>
                        {getActivityLabel(item)}
                      </span>
                    </TableCell>
                    <TableCell data-label="Đăng nhập gần nhất">
                      {item.lastLoginAt ? formatDate(item.lastLoginAt) : "Chưa ghi nhận"}
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
          {selectedStaff ? (
            <>
              <AdminSurfaceCard
                kicker="Tài khoản nội bộ"
                title={selectedStaff.fullName || selectedStaff.email}
                actions={detailHeaderActions("staff")}
                className={styles.subsectionCard}
              >
                <div className={styles.metaGrid}>
                  <div>
                    <span>Email</span>
                    <strong>{selectedStaff.email || "-"}</strong>
                  </div>
                  <div>
                    <span>Chi nhánh chính</span>
                    <strong>{findBranchName(selectedStaff.branchId)}</strong>
                  </div>
                  <div>
                    <span>Đăng nhập gần nhất</span>
                    <strong>{selectedStaff.lastLoginAt ? formatDate(selectedStaff.lastLoginAt) : "Chưa ghi nhận"}</strong>
                  </div>
                  <div>
                    <span>Số phân công</span>
                    <strong>{selectedStaffAssignments.length}</strong>
                  </div>
                  <div>
                    <span>Cập nhật gần nhất</span>
                    <strong>{selectedStaff.updatedAt ? formatDate(selectedStaff.updatedAt) : "-"}</strong>
                  </div>
                </div>

                <div className={styles.editGrid}>
                  <label>
                    <span>Họ tên</span>
                    <Input
                      type="text"
                      value={staffEdit.fullName}
                      disabled={!permissions.canManageStaff}
                      onChange={(event) => setStaffEdit((prev) => ({ ...prev, fullName: event.target.value }))}
                    />
                  </label>
                  <label>
                    <span>Email</span>
                    <Input type="email" value={staffEdit.email} disabled />
                  </label>
                  <label>
                    <span>Vai trò</span>
                    <FormSelect
                      value={staffEdit.role}
                      disabled={!permissions.canManageStaff}
                      onValueChange={(value) => setStaffEdit((prev) => ({ ...prev, role: value }))}
                      options={staffRoleOptions}
                    />
                  </label>
                  <label>
                    <span>Chi nhánh chính</span>
                    <FormSelect
                      value={staffEdit.branchId || "__none__"}
                      disabled={!permissions.canManageStaff}
                      onValueChange={(value) =>
                        setStaffEdit((prev) => ({ ...prev, branchId: value === "__none__" ? "" : value }))
                      }
                      options={[
                        { value: "__none__", label: "Chưa gán chi nhánh chính" },
                        ...branches.map((item) => ({
                          value: item.id,
                          label: item.shortName || item.name
                        }))
                      ]}
                    />
                  </label>
                  <label>
                    <span>Tài khoản</span>
                    <FormSelect
                      value={staffEdit.isActive ? "active" : "inactive"}
                      disabled={!permissions.canManageStaff}
                      onValueChange={(value) => setStaffEdit((prev) => ({ ...prev, isActive: value === "active" }))}
                      options={[
                        { value: "active", label: "Đang bật" },
                        { value: "inactive", label: "Đang khóa" }
                      ]}
                    />
                  </label>
                </div>

                {permissions.canManageStaff ? (
                  <div className={styles.detailActions}>
                    <Button type="button" className={styles.saveButton} onClick={saveStaffEdit} disabled={profileSaving}>
                      {profileSaving ? "Đang lưu..." : "Lưu tài khoản"}
                    </Button>
                  </div>
                ) : null}
              </AdminSurfaceCard>

              <AdminSurfaceCard
                kicker="Phân công chi nhánh"
                title="Danh sách chi nhánh đã gán"
                className={styles.subsectionCard}
              >
                {selectedStaffAssignments.length ? (
                  <div className={styles.lineItemList}>
                    {selectedStaffAssignments.map((assignment) => (
                      <div key={assignment.id} className={styles.lineItemRow}>
                        <div>
                          <strong>{findBranchName(assignment.branchId)}</strong>
                          <span>
                            {roleLabels[assignment.role] || assignment.role}
                            {assignment.isPrimary ? " • Phụ trách chính" : ""}
                          </span>
                        </div>
                        <span className={styles.statusBadge}>
                          {assignment.isPrimary ? "Chính" : "Phụ"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <AdminEmptyState
                    title="Nhân sự này chưa có phân công nào."
                    description="Bạn có thể gán chi nhánh từ trang Chi nhánh, hoặc đặt chi nhánh chính ngay ở đây."
                  />
                )}
              </AdminSurfaceCard>
            </>
          ) : (
            <AdminEmptyState
              title="Không tìm thấy tài khoản nhân sự."
              description="Tài khoản này có thể đã bị thay đổi hoặc không còn tồn tại trong dữ liệu hiện tại."
            />
          )}
        </AdminDetailShell>
      ) : null}
    </section>
  );
}
