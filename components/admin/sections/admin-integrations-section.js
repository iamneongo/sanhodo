"use client";

import { useMemo, useState } from "react";
import AdminActiveFilters from "../admin-active-filters";
import AdminEmptyState from "../admin-empty-state";
import AdminPageToolbar from "../admin-page-toolbar";
import AdminSurfaceCard from "../admin-surface-card";
import AdminTableFooter from "../admin-table-footer";
import { AdminDetailShell, AdminListShell } from "../admin-panel-shell";
import useTablePagination from "../use-table-pagination";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import styles from "../../admin.module.css";

const statusOptions = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "enabled", label: "Đang bật" },
  { value: "disabled", label: "Đang tắt" }
];

const syncModeOptions = [
  { value: "all", label: "Tất cả chế độ" },
  { value: "manual", label: "Thủ công" },
  { value: "auto", label: "Tự động" }
];

const sortOptions = [
  { value: "name_asc", label: "Tên A-Z" },
  { value: "category_asc", label: "Theo nhóm tích hợp" },
  { value: "enabled_first", label: "Ưu tiên tích hợp đang bật" },
  { value: "auto_first", label: "Ưu tiên đồng bộ tự động" }
];

function matchesQuery(item, query) {
  if (!query.trim()) return true;
  const normalized = query.trim().toLowerCase();
  return [item.name, item.category, item.market, item.description, item.code]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(normalized));
}

export default function AdminIntegrationsSection({
  detailOnlyLayout,
  permissions,
  integrations,
  selectedIntegration,
  openSectionDetail,
  formatLabel,
  detailHeaderActions,
  FormSelect,
  patchIntegration,
  syncLogs,
  formatDate
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [syncModeFilter, setSyncModeFilter] = useState("all");
  const [sort, setSort] = useState("name_asc");

  const filteredIntegrations = useMemo(() => {
    const nextItems = integrations
      .filter((item) => matchesQuery(item, query))
      .filter((item) => {
        if (statusFilter === "all") return true;
        return statusFilter === "enabled" ? item.enabled : !item.enabled;
      })
      .filter((item) => (syncModeFilter === "all" ? true : item.syncMode === syncModeFilter));

    nextItems.sort((a, b) => {
      if (sort === "enabled_first") {
        return Number(b.enabled) - Number(a.enabled) || a.name.localeCompare(b.name, "vi");
      }
      if (sort === "auto_first") {
        return Number(b.syncMode === "auto") - Number(a.syncMode === "auto") || a.name.localeCompare(b.name, "vi");
      }
      if (sort === "category_asc") {
        return String(a.category || "").localeCompare(String(b.category || ""), "vi") || a.name.localeCompare(b.name, "vi");
      }
      return a.name.localeCompare(b.name, "vi");
    });

    return nextItems;
  }, [integrations, query, statusFilter, syncModeFilter, sort]);

  const pagination = useTablePagination(filteredIntegrations);

  const activeFilterItems = [
    {
      key: "query",
      active: Boolean(query.trim()),
      label: `Tìm: ${query.trim()}`,
      onClear: () => setQuery("")
    },
    {
      key: "status",
      active: statusFilter !== "all",
      label: `Trạng thái: ${statusOptions.find((item) => item.value === statusFilter)?.label || statusFilter}`,
      onClear: () => setStatusFilter("all")
    },
    {
      key: "syncMode",
      active: syncModeFilter !== "all",
      label: `Đồng bộ: ${syncModeOptions.find((item) => item.value === syncModeFilter)?.label || syncModeFilter}`,
      onClear: () => setSyncModeFilter("all")
    },
    {
      key: "sort",
      active: sort !== "name_asc",
      label: `Sắp xếp: ${sortOptions.find((item) => item.value === sort)?.label || sort}`,
      onClear: () => setSort("name_asc")
    }
  ];

  return (
    <section className="grid w-full min-w-0 gap-4">
      {!detailOnlyLayout ? (
        <AdminListShell>
          <AdminPageToolbar
            footer={
              <AdminActiveFilters
                items={activeFilterItems}
                onClearAll={() => {
                  setQuery("");
                  setStatusFilter("all");
                  setSyncModeFilter("all");
                  setSort("name_asc");
                }}
              />
            }
          >
            <Input type="search" placeholder="Tìm tích hợp..." value={query} onChange={(event) => setQuery(event.target.value)} />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={syncModeFilter} onValueChange={setSyncModeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Chế độ đồng bộ" />
              </SelectTrigger>
              <SelectContent>
                {syncModeOptions.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger>
                <SelectValue placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </AdminPageToolbar>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tích hợp</TableHead>
                <TableHead>Nhóm</TableHead>
                <TableHead>Thị trường</TableHead>
                <TableHead>Đồng bộ</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
              <TableBody>
                {pagination.pagedItems.map((item) => (
                  <TableRow key={item.id} className={styles.interactiveRow} onClick={() => openSectionDetail("integrations", item.id)}>
                    <TableCell data-label="Tích hợp">
                      <strong>{item.name}</strong>
                      <span>{item.description || item.code}</span>
                    </TableCell>
                    <TableCell data-label="Nhóm">{String(item.category || "-").toUpperCase()}</TableCell>
                    <TableCell data-label="Thị trường">{item.market || "-"}</TableCell>
                    <TableCell data-label="Đồng bộ">{item.syncMode === "auto" ? "Tự động" : "Thủ công"}</TableCell>
                    <TableCell data-label="Trạng thái">
                      <span className={`${styles.statusBadge} ${item.enabled ? styles.status_confirmed : styles.status_cancelled}`}>
                        {item.enabled ? formatLabel("enabled") : formatLabel("disabled")}
                      </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <AdminTableFooter {...pagination} />
        </AdminListShell>
      ) : null}

      <AdminDetailShell>
        {selectedIntegration ? (
          <AdminSurfaceCard
            kicker="Tích hợp POS/PMS"
            title={selectedIntegration.name}
            description="Quản lý cấu hình đồng bộ, khóa truy cập và endpoint cho hệ thống bên ngoài."
            actions={detailOnlyLayout ? detailHeaderActions("integrations") : null}
            className={styles.subsectionCard}
          >
            <div className={styles.editGrid}>
              <label><span>Trạng thái</span><FormSelect value={selectedIntegration.enabled ? "enabled" : "disabled"} disabled={!permissions.canManageIntegrations} onValueChange={(value) => patchIntegration(selectedIntegration.id, { enabled: value === "enabled" })} options={["disabled", "enabled"]} /></label>
              <label><span>Chế độ đồng bộ</span><FormSelect value={selectedIntegration.syncMode} disabled={!permissions.canManageIntegrations} onValueChange={(value) => patchIntegration(selectedIntegration.id, { syncMode: value })} options={["manual", "auto"]} /></label>
              <label className={styles.fullWidth}><span>Địa chỉ webhook</span><Input type="url" defaultValue={selectedIntegration.endpoint} disabled={!permissions.canManageIntegrations} onBlur={(event) => patchIntegration(selectedIntegration.id, { endpoint: event.target.value })} /></label>
              <label><span>Khóa API</span><Input type="text" defaultValue={selectedIntegration.apiKey} disabled={!permissions.canManageIntegrations} onBlur={(event) => patchIntegration(selectedIntegration.id, { apiKey: event.target.value })} /></label>
              <label><span>Bí mật API</span><Input type="text" defaultValue={selectedIntegration.apiSecret} disabled={!permissions.canManageIntegrations} onBlur={(event) => patchIntegration(selectedIntegration.id, { apiSecret: event.target.value })} /></label>
              <label><span>Mã địa điểm</span><Input type="text" defaultValue={selectedIntegration.locationCode} disabled={!permissions.canManageIntegrations} onBlur={(event) => patchIntegration(selectedIntegration.id, { locationCode: event.target.value })} /></label>
              <label><span>Mã tenant</span><Input type="text" defaultValue={selectedIntegration.tenantCode} disabled={!permissions.canManageIntegrations} onBlur={(event) => patchIntegration(selectedIntegration.id, { tenantCode: event.target.value })} /></label>
              <label className={styles.fullWidth}><span>Ghi chú</span><Textarea rows={5} defaultValue={selectedIntegration.notes} disabled={!permissions.canManageIntegrations} onBlur={(event) => patchIntegration(selectedIntegration.id, { notes: event.target.value })} /></label>
            </div>
          </AdminSurfaceCard>
        ) : detailOnlyLayout ? (
          <AdminEmptyState title="Không tìm thấy tích hợp." description="Tích hợp này có thể đã bị gỡ hoặc không thuộc chi nhánh đang xem." />
        ) : null}

        <AdminSurfaceCard
          kicker="Nhật ký đồng bộ"
          title="Lịch sử đồng bộ gần đây"
          description="Các lần đẩy dữ liệu gần nhất sang POS/PMS để đội vận hành đối soát nhanh."
          className={styles.subsectionCard}
          bodyClassName="p-0"
        >
          {syncLogs.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hệ thống</TableHead>
                  <TableHead>Đặt bàn</TableHead>
                  <TableHead>Kết quả</TableHead>
                  <TableHead>Thời gian</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {syncLogs.slice(0, 12).map((log) => (
                  <TableRow key={log.id}>
                    <TableCell data-label="Hệ thống">
                      <strong>{log.integrationName}</strong>
                      <span>{log.endpoint || "Không có endpoint"}</span>
                    </TableCell>
                    <TableCell data-label="Đặt bàn">{log.reservationId || "-"}</TableCell>
                    <TableCell data-label="Kết quả">
                      <span className={`${styles.statusBadge} ${log.ok ? styles.status_confirmed : styles.status_cancelled}`}>
                        {log.ok ? `Thành công ${log.status}` : `Lỗi ${log.status}`}
                      </span>
                    </TableCell>
                    <TableCell data-label="Thời gian">{formatDate(log.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-5">
              <AdminEmptyState title="Chưa có log đồng bộ." description="Các lần đồng bộ POS/PMS thành công hoặc lỗi sẽ xuất hiện ở đây." />
            </div>
          )}
        </AdminSurfaceCard>
      </AdminDetailShell>
    </section>
  );
}
