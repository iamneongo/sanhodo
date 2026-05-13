"use client";

import AdminEmptyState from "../admin-empty-state";
import AdminActiveFilters from "../admin-active-filters";
import AdminFormDialog from "../admin-form-dialog";
import AdminPageToolbar from "../admin-page-toolbar";
import AdminStatCard from "../admin-stat-card";
import AdminSurfaceCard from "../admin-surface-card";
import AdminTableFooter from "../admin-table-footer";
import { AdminDetailShell, AdminListShell } from "../admin-panel-shell";
import useTablePagination from "../use-table-pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import styles from "../../admin.module.css";

export default function AdminVouchersSection({
  detailOnlyLayout,
  permissions,
  voucherQuery,
  setVoucherQuery,
  voucherStatus,
  setVoucherStatus,
  voucherSort,
  setVoucherSort,
  voucherStatuses,
  voucherSortOptions,
  voucherStats,
  loyaltyStats,
  filteredVouchers,
  selectedVoucher,
  openSectionDetail,
  formatDate,
  formatLabel,
  voucherCreateOpen,
  setVoucherCreateOpen,
  createVoucherEntry,
  voucherDraft,
  setVoucherDraft,
  campaignCreateOpen,
  setCampaignCreateOpen,
  createVoucherCampaignEntry,
  campaignDraft,
  setCampaignDraft,
  voucherSaving,
  voucherCampaigns,
  selectedVoucherCampaign,
  selectedVoucherCampaignId,
  setSelectedVoucherCampaignId,
  formatVoucherBenefit,
  patchVoucherCampaign,
  deleteVoucherCampaignEntry,
  selectedVoucherCustomer,
  formatVoucherValue,
  backToSection,
  redeemVoucher,
  deleteVoucherEntry,
  patchVoucher,
  customerProfiles,
  formatCurrency
}) {
  const pagination = useTablePagination(filteredVouchers);
  const activeFilterItems = [
    {
      key: "query",
      active: Boolean(voucherQuery.trim()),
      label: `Tìm: ${voucherQuery.trim()}`,
      onClear: () => setVoucherQuery("")
    },
    {
      key: "status",
      active: voucherStatus !== "all",
      label: `Trạng thái: ${voucherStatuses.find((item) => item.value === voucherStatus)?.label || voucherStatus}`,
      onClear: () => setVoucherStatus("all")
    },
    {
      key: "sort",
      active: voucherSort !== "newest",
      label: `Sắp xếp: ${voucherSortOptions.find((item) => item.value === voucherSort)?.label || voucherSort}`,
      onClear: () => setVoucherSort("newest")
    }
  ];

  return (
    <section className="grid w-full min-w-0 gap-4">
      {!detailOnlyLayout ? (
        <AdminListShell>
          <AdminPageToolbar
            actions={
              permissions.canManageVouchers ? (
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={() => setVoucherCreateOpen(true)}>
                    Tạo voucher
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setCampaignCreateOpen(true)}>
                    Tạo chiến dịch
                  </Button>
                </div>
              ) : null
            }
            footer={
              <AdminActiveFilters
                items={activeFilterItems}
                onClearAll={() => {
                  setVoucherQuery("");
                  setVoucherStatus("all");
                  setVoucherSort("newest");
                }}
              />
            }
          >
            <Input
              type="search"
              placeholder="Tìm voucher..."
              value={voucherQuery}
              onChange={(event) => setVoucherQuery(event.target.value)}
            />
            <Select value={voucherStatus} onValueChange={setVoucherStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Trạng thái voucher" />
              </SelectTrigger>
              <SelectContent>
                {voucherStatuses.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={voucherSort} onValueChange={setVoucherSort}>
              <SelectTrigger>
                <SelectValue placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent>
                {voucherSortOptions.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </AdminPageToolbar>

          {permissions.canManageVouchers ? (
            <>
              <AdminFormDialog
                open={voucherCreateOpen}
                onOpenChange={setVoucherCreateOpen}
                title="Tạo voucher thủ công"
                description="Tạo nhanh một voucher lead mới từ admin để test hoặc chăm sóc khách hàng."
                size="medium"
              >
                <form className={styles.inlineForm} onSubmit={createVoucherEntry}>
                  <Input
                    type="text"
                    placeholder="Tên khách (không bắt buộc)"
                    value={voucherDraft.fullName}
                    onChange={(event) => setVoucherDraft((prev) => ({ ...prev, fullName: event.target.value }))}
                  />
                  <Input
                    type="tel"
                    placeholder="Số điện thoại"
                    value={voucherDraft.phone}
                    onChange={(event) => setVoucherDraft((prev) => ({ ...prev, phone: event.target.value }))}
                    required
                  />
                  <Select
                    value={voucherDraft.campaignId || "auto"}
                    onValueChange={(value) =>
                      setVoucherDraft((prev) => ({ ...prev, campaignId: value === "auto" ? "" : value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn chiến dịch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Tự chọn chiến dịch phù hợp</SelectItem>
                      {voucherCampaigns.map((campaign) => (
                        <SelectItem key={campaign.id} value={campaign.id}>
                          {campaign.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className={styles.inlineRow}>
                    <Select
                      value={voucherDraft.status}
                      onValueChange={(value) => setVoucherDraft((prev) => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Trạng thái" />
                      </SelectTrigger>
                      <SelectContent>
                        {voucherStatuses
                          .filter((item) => item.value !== "all")
                          .map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="text"
                      placeholder="Nguồn"
                      value={voucherDraft.source}
                      onChange={(event) => setVoucherDraft((prev) => ({ ...prev, source: event.target.value }))}
                    />
                  </div>
                  <Textarea
                    rows={3}
                    placeholder="Ghi chú"
                    value={voucherDraft.notes}
                    onChange={(event) => setVoucherDraft((prev) => ({ ...prev, notes: event.target.value }))}
                  />
                  <Button type="submit" loading={voucherSaving} loadingLabel="Đang tạo...">
                    Lưu voucher
                  </Button>
                </form>
              </AdminFormDialog>

              <AdminFormDialog
                open={campaignCreateOpen}
                onOpenChange={setCampaignCreateOpen}
                title="Tạo chiến dịch voucher"
                description="Thiết lập ưu đãi mới cho landing page và loyalty flow."
                size="medium"
              >
                <form className={styles.inlineForm} onSubmit={createVoucherCampaignEntry}>
                  <Input
                    type="text"
                    placeholder="Tiêu đề chiến dịch"
                    value={campaignDraft.title}
                    onChange={(event) =>
                      setCampaignDraft((prev) => ({
                        ...prev,
                        title: event.target.value,
                        name: prev.name || event.target.value
                      }))
                    }
                    required
                  />
                  <Input
                    type="text"
                    placeholder="Mã chiến dịch"
                    value={campaignDraft.code}
                    onChange={(event) => setCampaignDraft((prev) => ({ ...prev, code: event.target.value }))}
                  />
                  <div className={styles.inlineRow}>
                    <Select
                      value={campaignDraft.discountType}
                      onValueChange={(value) =>
                        setCampaignDraft((prev) => ({
                          ...prev,
                          discountType: value
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Kiểu ưu đãi" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percent">Phần trăm</SelectItem>
                        <SelectItem value="amount">Số tiền</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min="0"
                      placeholder="Giá trị ưu đãi"
                      value={campaignDraft.discountValue}
                      onChange={(event) =>
                        setCampaignDraft((prev) => ({
                          ...prev,
                          discountValue: Number(event.target.value)
                        }))
                      }
                    />
                  </div>
                  <Textarea
                    rows={3}
                    placeholder="Mô tả chiến dịch"
                    value={campaignDraft.description}
                    onChange={(event) => setCampaignDraft((prev) => ({ ...prev, description: event.target.value }))}
                  />
                  <Button type="submit" loading={voucherSaving} loadingLabel="Đang tạo...">
                    Lưu chiến dịch
                  </Button>
                </form>
              </AdminFormDialog>
            </>
          ) : null}

          <div className={styles.statsStrip}>
            <AdminStatCard
              label="Chiến dịch đang chạy"
              value={voucherStats.campaigns}
              detail={`${voucherStats.redeemed} voucher đã đổi`}
              accent="warm"
            />
            <AdminStatCard
              label="Khách loyalty"
              value={loyaltyStats.members}
              detail={`${loyaltyStats.redemptions} lượt đổi đã ghi nhận`}
              accent="soft"
            />
          </div>

          <AdminSurfaceCard
            kicker="Chiến dịch voucher"
            title="Quản lý chiến dịch và loyalty"
            description="Tạo, chỉnh sửa và tắt/mở các ưu đãi đang dùng ở landing page."
            className={styles.subsectionCard}
          >
            <div className={styles.campaignRail}>
              {voucherCampaigns.map((campaign) => (
                <Button
                  key={campaign.id}
                  type="button"
                  variant="ghost"
                  className={`${styles.campaignTile} ${
                    campaign.id === selectedVoucherCampaignId ? styles.campaignTileActive : ""
                  }`}
                  onClick={() => setSelectedVoucherCampaignId(campaign.id)}
                >
                  <strong>{campaign.title}</strong>
                  <span>{formatVoucherBenefit(campaign)}</span>
                  <small>{campaign.isActive ? "Đang chạy" : "Đã tắt"} • {campaign.validDays} ngày</small>
                </Button>
              ))}
            </div>

            {selectedVoucherCampaign ? (
              <div className={styles.editGrid}>
                <label>
                  <span>Tiêu đề</span>
                  <Input
                    type="text"
                    defaultValue={selectedVoucherCampaign.title}
                    disabled={!permissions.canManageVouchers}
                    onBlur={(event) =>
                      patchVoucherCampaign(selectedVoucherCampaign.id, {
                        ...selectedVoucherCampaign,
                        title: event.target.value
                      })
                    }
                  />
                </label>
                <label>
                  <span>Mã chiến dịch</span>
                  <Input
                    type="text"
                    defaultValue={selectedVoucherCampaign.code}
                    disabled={!permissions.canManageVouchers}
                    onBlur={(event) =>
                      patchVoucherCampaign(selectedVoucherCampaign.id, {
                        ...selectedVoucherCampaign,
                        code: event.target.value
                      })
                    }
                  />
                </label>
                <label>
                  <span>Giá trị ưu đãi</span>
                  <Input
                    type="number"
                    min="0"
                    defaultValue={selectedVoucherCampaign.discountValue}
                    disabled={!permissions.canManageVouchers}
                    onBlur={(event) =>
                      patchVoucherCampaign(selectedVoucherCampaign.id, {
                        ...selectedVoucherCampaign,
                        discountValue: Number(event.target.value)
                      })
                    }
                  />
                </label>
                <label>
                  <span>Số ngày hiệu lực</span>
                  <Input
                    type="number"
                    min="1"
                    defaultValue={selectedVoucherCampaign.validDays}
                    disabled={!permissions.canManageVouchers}
                    onBlur={(event) =>
                      patchVoucherCampaign(selectedVoucherCampaign.id, {
                        ...selectedVoucherCampaign,
                        validDays: Number(event.target.value)
                      })
                    }
                  />
                </label>
                <label className={styles.fullWidth}>
                  <span>Mô tả</span>
                  <Textarea
                    rows={3}
                    defaultValue={selectedVoucherCampaign.description}
                    disabled={!permissions.canManageVouchers}
                    onBlur={(event) =>
                      patchVoucherCampaign(selectedVoucherCampaign.id, {
                        ...selectedVoucherCampaign,
                        description: event.target.value
                      })
                    }
                  />
                </label>
                {permissions.canManageVouchers ? (
                  <div className={styles.detailActions}>
                    <Button
                      type="button"
                      variant="destructive"
                      className={styles.deleteButton}
                      onClick={() => deleteVoucherCampaignEntry(selectedVoucherCampaign.id)}
                    >
                      Xóa chiến dịch
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </AdminSurfaceCard>

          <div className="w-full min-w-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SĐT</TableHead>
                  <TableHead>Mã</TableHead>
                  <TableHead>Chiến dịch</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Tạo lúc</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagination.pagedItems.map((item) => (
                  <TableRow
                    key={item.id}
                    className={styles.interactiveRow}
                    onClick={() => openSectionDetail("vouchers", item.id)}
                  >
                    <TableCell data-label="SĐT">{item.phone}</TableCell>
                    <TableCell data-label="Mã">{item.voucherCode || "-"}</TableCell>
                    <TableCell data-label="Chiến dịch">{item.voucherTitle || "-"}</TableCell>
                    <TableCell data-label="Trạng thái">
                      <span
                        className={`${styles.statusBadge} ${
                          styles[`status_${item.status}`] || styles.status_new
                        }`}
                      >
                        {formatLabel(item.status)}
                      </span>
                    </TableCell>
                    <TableCell data-label="Tạo lúc">{formatDate(item.createdAt)}</TableCell>
                    <TableCell data-label="Thao tác" className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={(event) => {
                            event.stopPropagation();
                            openSectionDetail("vouchers", item.id);
                          }}
                        >
                          Xem
                        </Button>
                        {permissions.canManageVouchers ? (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={(event) => {
                              event.stopPropagation();
                              redeemVoucher(item);
                            }}
                          >
                            Đổi
                          </Button>
                        ) : null}
                        {permissions.canManageVouchers ? (
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={(event) => {
                              event.stopPropagation();
                              deleteVoucherEntry(item.id);
                            }}
                          >
                            Xóa
                          </Button>
                        ) : null}
                      </div>
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
          <AdminSurfaceCard
            kicker="Chiến dịch voucher"
            title="Quản lý chiến dịch và loyalty"
            actions={
              permissions.canManageVouchers ? (
                <Button type="button" variant="secondary" onClick={() => setCampaignCreateOpen(true)}>
                  Tạo chiến dịch
                </Button>
              ) : null
            }
            className={styles.subsectionCard}
          >
            {permissions.canManageVouchers ? (
              <AdminFormDialog
                open={campaignCreateOpen}
                onOpenChange={setCampaignCreateOpen}
                title="Tạo chiến dịch voucher"
                description="Thiết lập ưu đãi mới cho landing page và loyalty flow."
                size="medium"
              >
              <form className={styles.inlineForm} onSubmit={createVoucherCampaignEntry}>
                <Input
                  type="text"
                  placeholder="Tiêu đề chiến dịch"
                  value={campaignDraft.title}
                  onChange={(event) =>
                    setCampaignDraft((prev) => ({
                      ...prev,
                      title: event.target.value,
                      name: prev.name || event.target.value
                    }))
                  }
                  required
                />
                <Input
                  type="text"
                  placeholder="Mã chiến dịch"
                  value={campaignDraft.code}
                  onChange={(event) => setCampaignDraft((prev) => ({ ...prev, code: event.target.value }))}
                />
                <div className={styles.inlineRow}>
                  <Select
                    value={campaignDraft.discountType}
                    onValueChange={(value) =>
                      setCampaignDraft((prev) => ({
                        ...prev,
                        discountType: value
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Kiểu ưu đãi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">Phần trăm</SelectItem>
                      <SelectItem value="amount">Số tiền</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Giá trị ưu đãi"
                    value={campaignDraft.discountValue}
                    onChange={(event) =>
                      setCampaignDraft((prev) => ({
                        ...prev,
                        discountValue: Number(event.target.value)
                      }))
                    }
                  />
                </div>
                <Textarea
                  rows={3}
                  placeholder="Mô tả chiến dịch"
                  value={campaignDraft.description}
                  onChange={(event) => setCampaignDraft((prev) => ({ ...prev, description: event.target.value }))}
                />
                <Button type="submit" loading={voucherSaving} loadingLabel="Đang tạo...">
                  Lưu chiến dịch
                </Button>
              </form>
              </AdminFormDialog>
            ) : null}

            <div className={styles.campaignRail}>
              {voucherCampaigns.map((campaign) => (
                <Button
                  key={campaign.id}
                  type="button"
                  variant="ghost"
                  className={`${styles.campaignTile} ${
                    campaign.id === selectedVoucherCampaignId ? styles.campaignTileActive : ""
                  }`}
                  onClick={() => setSelectedVoucherCampaignId(campaign.id)}
                >
                  <strong>{campaign.title}</strong>
                  <span>{formatVoucherBenefit(campaign)}</span>
                  <small>{campaign.isActive ? "Đang chạy" : "Đã tắt"} • {campaign.validDays} ngày</small>
                </Button>
              ))}
            </div>

            {selectedVoucherCampaign ? (
              <div className={styles.editGrid}>
                <label>
                  <span>Tiêu đề</span>
                  <Input
                    type="text"
                    defaultValue={selectedVoucherCampaign.title}
                    disabled={!permissions.canManageVouchers}
                    onBlur={(event) =>
                      patchVoucherCampaign(selectedVoucherCampaign.id, {
                        ...selectedVoucherCampaign,
                        title: event.target.value
                      })
                    }
                  />
                </label>
                <label>
                  <span>Mã chiến dịch</span>
                  <Input
                    type="text"
                    defaultValue={selectedVoucherCampaign.code}
                    disabled={!permissions.canManageVouchers}
                    onBlur={(event) =>
                      patchVoucherCampaign(selectedVoucherCampaign.id, {
                        ...selectedVoucherCampaign,
                        code: event.target.value
                      })
                    }
                  />
                </label>
                <label>
                  <span>Giá trị ưu đãi</span>
                  <Input
                    type="number"
                    min="0"
                    defaultValue={selectedVoucherCampaign.discountValue}
                    disabled={!permissions.canManageVouchers}
                    onBlur={(event) =>
                      patchVoucherCampaign(selectedVoucherCampaign.id, {
                        ...selectedVoucherCampaign,
                        discountValue: Number(event.target.value)
                      })
                    }
                  />
                </label>
                <label>
                  <span>Số ngày hiệu lực</span>
                  <Input
                    type="number"
                    min="1"
                    defaultValue={selectedVoucherCampaign.validDays}
                    disabled={!permissions.canManageVouchers}
                    onBlur={(event) =>
                      patchVoucherCampaign(selectedVoucherCampaign.id, {
                        ...selectedVoucherCampaign,
                        validDays: Number(event.target.value)
                      })
                    }
                  />
                </label>
                <label className={styles.fullWidth}>
                  <span>Mô tả</span>
                  <Textarea
                    rows={3}
                    defaultValue={selectedVoucherCampaign.description}
                    disabled={!permissions.canManageVouchers}
                    onBlur={(event) =>
                      patchVoucherCampaign(selectedVoucherCampaign.id, {
                        ...selectedVoucherCampaign,
                        description: event.target.value
                      })
                    }
                  />
                </label>
                {permissions.canManageVouchers ? (
                  <div className={styles.detailActions}>
                    <Button
                      type="button"
                      variant="destructive"
                      className={styles.deleteButton}
                      onClick={() => deleteVoucherCampaignEntry(selectedVoucherCampaign.id)}
                    >
                      Xóa chiến dịch
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </AdminSurfaceCard>

          {selectedVoucher ? (
            <AdminSurfaceCard
              kicker="Chi tiết voucher"
              title={selectedVoucher.phone}
              actions={
                <div className={styles.detailActions}>
                  <Button type="button" variant="outline" onClick={() => backToSection("vouchers")}>
                    Quay lại danh sách
                  </Button>
                  {permissions.canManageVouchers ? (
                    <Button
                      type="button"
                      className={styles.saveButton}
                      onClick={() => redeemVoucher(selectedVoucher)}
                      loading={voucherSaving}
                      loadingLabel="Đang xử lý..."
                    >
                      Đổi voucher + tích điểm
                    </Button>
                  ) : null}
                  {permissions.canManageVouchers ? (
                    <Button
                      className={styles.deleteButton}
                      variant="destructive"
                      type="button"
                      onClick={() => deleteVoucherEntry(selectedVoucher.id)}
                    >
                      Xóa lead
                    </Button>
                  ) : null}
                </div>
              }
              className={styles.subsectionCard}
            >
              {permissions.canManageVouchers ? (
                <div className={styles.quickStatusRow}>
                  {voucherStatuses
                    .filter((item) => item.value !== "all")
                    .map((item) => (
                      <Button
                        type="button"
                        variant={selectedVoucher.status === item.value ? "default" : "outline"}
                        key={item.value}
                        className={selectedVoucher.status === item.value ? styles.quickActive : ""}
                        onClick={() =>
                          patchVoucher(selectedVoucher.id, {
                            ...selectedVoucher,
                            status: item.value
                          })
                        }
                      >
                        {item.label}
                      </Button>
                    ))}
                </div>
              ) : null}

              <div className={styles.metaGrid}>
                <div>
                  <span>Mã voucher</span>
                  <strong>{selectedVoucher.voucherCode || "-"}</strong>
                </div>
                <div>
                  <span>Ưu đãi</span>
                  <strong>{selectedVoucher.voucherTitle || "-"}</strong>
                </div>
                <div>
                  <span>Giá trị</span>
                  <strong>{formatVoucherValue(selectedVoucher)}</strong>
                </div>
                <div>
                  <span>Hạn dùng</span>
                  <strong>{selectedVoucher.expiresAt ? formatDate(selectedVoucher.expiresAt) : "-"}</strong>
                </div>
                <div>
                  <span>Khách loyalty</span>
                  <strong>{selectedVoucherCustomer?.fullName || selectedVoucherCustomer?.phone || "-"}</strong>
                </div>
                <div>
                  <span>Điểm hiện có</span>
                  <strong>{selectedVoucherCustomer?.loyaltyPoints || 0}</strong>
                </div>
              </div>

              <div className={styles.editGrid}>
                <label>
                  <span>Nguồn</span>
                  <Input
                    type="text"
                    defaultValue={selectedVoucher.source || ""}
                    disabled={!permissions.canManageVouchers}
                    onBlur={(event) =>
                      patchVoucher(selectedVoucher.id, {
                        ...selectedVoucher,
                        source: event.target.value
                      })
                    }
                  />
                </label>
                <label>
                  <span>Mô tả ưu đãi</span>
                  <Input
                    type="text"
                    defaultValue={selectedVoucher.voucherDescription || ""}
                    disabled={!permissions.canManageVouchers}
                    onBlur={(event) =>
                      patchVoucher(selectedVoucher.id, {
                        ...selectedVoucher,
                        voucherDescription: event.target.value
                      })
                    }
                  />
                </label>
                <label className={styles.fullWidth}>
                  <span>Ghi chú</span>
                  <Textarea
                    rows={6}
                    defaultValue={selectedVoucher.notes || ""}
                    disabled={!permissions.canManageVouchers}
                    onBlur={(event) =>
                      patchVoucher(selectedVoucher.id, {
                        ...selectedVoucher,
                        notes: event.target.value
                      })
                    }
                  />
                </label>
              </div>
            </AdminSurfaceCard>
          ) : (
            <AdminEmptyState
              title={detailOnlyLayout ? "Không tìm thấy voucher." : "Chưa có voucher."}
              description={
                detailOnlyLayout
                  ? "Voucher có thể đã bị xóa hoặc không còn trong chi nhánh đang xem."
                  : "Khi có voucher lead, danh sách sẽ hiển thị tại đây."
              }
            />
          )}

          <AdminSurfaceCard
            kicker="Khách hàng thân thiết"
            title="Top khách hàng giữ chân"
            className={styles.subsectionCard}
          >
            <div className={styles.metaGrid}>
              <div>
                <span>Tổng khách</span>
                <strong>{loyaltyStats.members}</strong>
              </div>
              <div>
                <span>Tổng điểm</span>
                <strong>{loyaltyStats.totalPoints}</strong>
              </div>
              <div>
                <span>Tổng chi tiêu</span>
                <strong>{formatCurrency(loyaltyStats.totalSpent)}</strong>
              </div>
              <div>
                <span>Lượt đổi</span>
                <strong>{loyaltyStats.redemptions}</strong>
              </div>
            </div>
            <div className={styles.loyaltyList}>
              {customerProfiles.slice(0, 6).map((customer) => (
                <article key={customer.id} className={styles.loyaltyCard}>
                  <strong>{customer.fullName || customer.phone}</strong>
                  <span>{customer.phone}</span>
                  <small>
                    {customer.loyaltyPoints} điểm • {formatCurrency(customer.totalSpent)}
                  </small>
                </article>
              ))}
              {!customerProfiles.length ? (
                <AdminEmptyState
                  title="Chưa có hồ sơ loyalty."
                  description="Khi có khách nhận hoặc đổi voucher, hồ sơ loyalty sẽ xuất hiện ở đây."
                />
              ) : null}
            </div>
          </AdminSurfaceCard>
        </AdminDetailShell>
      ) : null}
    </section>
  );
}
