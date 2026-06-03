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

function MediaPreview({ asset }) {
  const previewUrl = asset.thumbnailUrl || asset.fileUrl;
  if (!previewUrl) {
    return <div className="grid h-16 w-24 place-items-center rounded-2xl bg-zinc-100 text-xs font-semibold text-zinc-500">No file</div>;
  }

  if (["image", "banner", "logo", "qr"].includes(asset.assetType)) {
    return <img src={previewUrl} alt={asset.title} className="h-16 w-24 rounded-2xl object-cover" loading="lazy" />;
  }

  return (
    <div className="grid h-16 w-24 place-items-center rounded-2xl border border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase text-zinc-600">
      {asset.assetType || "file"}
    </div>
  );
}

function MediaFields({ draft, setDraft, FormSelect, mediaTypeOptions, mediaStatusOptions, disabled = false }) {
  return (
    <>
      <Input
        type="text"
        placeholder="Tiêu đề media"
        value={draft.title}
        disabled={disabled}
        onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
        required
      />
      <Input
        type="text"
        placeholder="Danh mục, ví dụ: landing, menu, logo"
        value={draft.category}
        disabled={disabled}
        onChange={(event) => setDraft((prev) => ({ ...prev, category: event.target.value }))}
      />
      <div className={styles.inlineRow}>
        <FormSelect
          value={draft.assetType}
          onValueChange={(value) => setDraft((prev) => ({ ...prev, assetType: value }))}
          options={mediaTypeOptions}
          placeholder="Loại media"
          disabled={disabled}
        />
        <FormSelect
          value={draft.status}
          onValueChange={(value) => setDraft((prev) => ({ ...prev, status: value }))}
          options={mediaStatusOptions}
          placeholder="Trạng thái"
          disabled={disabled}
        />
      </div>
      <Input
        className={styles.fullWidth}
        type="url"
        placeholder="URL file public/CDN"
        value={draft.fileUrl}
        disabled={disabled}
        onChange={(event) => setDraft((prev) => ({ ...prev, fileUrl: event.target.value }))}
        required
      />
      <Input
        type="url"
        placeholder="URL thumbnail nếu có"
        value={draft.thumbnailUrl}
        disabled={disabled}
        onChange={(event) => setDraft((prev) => ({ ...prev, thumbnailUrl: event.target.value }))}
      />
      <Input
        type="text"
        placeholder="Tên file"
        value={draft.fileName}
        disabled={disabled}
        onChange={(event) => setDraft((prev) => ({ ...prev, fileName: event.target.value }))}
      />
      <div className={styles.inlineRow}>
        <Input
          type="number"
          min="0"
          placeholder="Dung lượng byte"
          value={draft.fileSize}
          disabled={disabled}
          onChange={(event) => setDraft((prev) => ({ ...prev, fileSize: Number(event.target.value) }))}
        />
        <Input
          type="text"
          placeholder="MIME type"
          value={draft.mimeType}
          disabled={disabled}
          onChange={(event) => setDraft((prev) => ({ ...prev, mimeType: event.target.value }))}
        />
      </div>
      <Textarea
        className={styles.fullWidth}
        rows={3}
        placeholder="Ghi chú nội bộ / metadata mô tả cách dùng asset"
        value={draft.notes || ""}
        disabled={disabled}
        onChange={(event) => setDraft((prev) => ({ ...prev, notes: event.target.value }))}
      />
    </>
  );
}

export default function AdminMediaSection({
  detailOnlyLayout,
  permissions,
  mediaCreateOpen,
  setMediaCreateOpen,
  mediaQuery,
  setMediaQuery,
  mediaTypeFilter,
  setMediaTypeFilter,
  mediaStatusFilter,
  setMediaStatusFilter,
  mediaTypeOptions,
  mediaStatusOptions,
  createMediaEntry,
  mediaDraft,
  setMediaDraft,
  mediaSaving,
  filteredMediaAssets,
  selectedMediaAsset,
  openSectionDetail,
  detailHeaderActions,
  deleteMediaEntry,
  mediaEdit,
  setMediaEdit,
  saveMediaEdit,
  formatDate,
  formatFileSize,
  FormSelect
}) {
  const pagination = useTablePagination(filteredMediaAssets);
  const activeFilterItems = [
    {
      key: "query",
      active: Boolean(mediaQuery.trim()),
      label: `Tìm: ${mediaQuery.trim()}`,
      onClear: () => setMediaQuery("")
    },
    {
      key: "type",
      active: mediaTypeFilter !== "all",
      label: `Loại: ${mediaTypeOptions.find((item) => item.value === mediaTypeFilter)?.label || mediaTypeFilter}`,
      onClear: () => setMediaTypeFilter("all")
    },
    {
      key: "status",
      active: mediaStatusFilter !== "all",
      label: `Trạng thái: ${mediaStatusOptions.find((item) => item.value === mediaStatusFilter)?.label || mediaStatusFilter}`,
      onClear: () => setMediaStatusFilter("all")
    }
  ];

  return (
    <section className="grid w-full min-w-0 gap-4">
      {!detailOnlyLayout ? (
        <AdminListShell>
          <AdminPageToolbar
            actions={
              permissions.canManageMedia ? (
                <Button type="button" variant="secondary" onClick={() => setMediaCreateOpen(true)}>
                  Thêm media
                </Button>
              ) : null
            }
            footer={
              <AdminActiveFilters
                items={activeFilterItems}
                onClearAll={() => {
                  setMediaQuery("");
                  setMediaTypeFilter("all");
                  setMediaStatusFilter("all");
                }}
              />
            }
          >
            <Input type="search" placeholder="Tìm media..." value={mediaQuery} onChange={(event) => setMediaQuery(event.target.value)} />
            <FormSelect value={mediaTypeFilter} onValueChange={setMediaTypeFilter} options={[{ value: "all", label: "Tất cả loại" }, ...mediaTypeOptions]} placeholder="Lọc loại" />
            <FormSelect value={mediaStatusFilter} onValueChange={setMediaStatusFilter} options={[{ value: "all", label: "Tất cả trạng thái" }, ...mediaStatusOptions]} placeholder="Lọc trạng thái" />
          </AdminPageToolbar>

          {permissions.canManageMedia ? (
            <AdminFormDialog
              open={mediaCreateOpen}
              onOpenChange={setMediaCreateOpen}
              title="Thêm media"
              description="Gắn ảnh, banner, logo, video hoặc PDF public vào thư viện theo chi nhánh."
              size="wide"
            >
              <form className={styles.inlineForm} onSubmit={createMediaEntry}>
                <MediaFields
                  draft={mediaDraft}
                  setDraft={setMediaDraft}
                  FormSelect={FormSelect}
                  mediaTypeOptions={mediaTypeOptions}
                  mediaStatusOptions={mediaStatusOptions}
                />
                <Button type="submit" loading={mediaSaving} loadingLabel="Đang lưu...">
                  Lưu media
                </Button>
              </form>
            </AdminFormDialog>
          ) : null}

          {filteredMediaAssets.length ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Preview</TableHead>
                    <TableHead>Tên media</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Danh mục</TableHead>
                    <TableHead>Cập nhật</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagination.pagedItems.map((item) => (
                    <TableRow key={item.id} className={styles.interactiveRow} onClick={() => openSectionDetail("media", item.id)}>
                      <TableCell data-label="Preview"><MediaPreview asset={item} /></TableCell>
                      <TableCell data-label="Tên media">
                        <strong>{item.title}</strong>
                        <span>{item.fileName || item.fileUrl}</span>
                      </TableCell>
                      <TableCell data-label="Loại">{mediaTypeOptions.find((option) => option.value === item.assetType)?.label || item.assetType}</TableCell>
                      <TableCell data-label="Danh mục">{item.category || "-"}</TableCell>
                      <TableCell data-label="Cập nhật">{formatDate(item.updatedAt || item.createdAt)}</TableCell>
                      <TableCell data-label="Trạng thái"><span className={`${styles.statusBadge} ${item.status === "active" ? styles.status_confirmed : styles.status_pending}`}>{mediaStatusOptions.find((option) => option.value === item.status)?.label || item.status}</span></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <AdminTableFooter {...pagination} />
            </>
          ) : (
            <AdminEmptyState title="Chưa có media" description="Thêm ảnh, banner, logo hoặc PDF để landing page và marketing dùng lại thống nhất." />
          )}
        </AdminListShell>
      ) : null}

      {detailOnlyLayout ? (
        <AdminDetailShell>
          {selectedMediaAsset ? (
            <AdminSurfaceCard
              kicker="Chi tiết media"
              title={selectedMediaAsset.title}
              description={selectedMediaAsset.fileUrl}
              actions={detailHeaderActions(
                "media",
                permissions.canManageMedia ? (
                  <Button className={styles.deleteButton} variant="destructive" type="button" onClick={() => deleteMediaEntry(selectedMediaAsset.id)}>
                    Xóa media
                  </Button>
                ) : null
              )}
              className={styles.subsectionCard}
            >
              <div className="mb-5 grid gap-4 rounded-3xl border border-zinc-100 bg-zinc-50 p-4 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center">
                <MediaPreview asset={selectedMediaAsset} />
                <div className="grid gap-1 text-sm text-zinc-600">
                  <p><strong className="text-zinc-950">Loại:</strong> {mediaTypeOptions.find((option) => option.value === selectedMediaAsset.assetType)?.label || selectedMediaAsset.assetType}</p>
                  <p><strong className="text-zinc-950">Dung lượng:</strong> {formatFileSize(selectedMediaAsset.fileSize)}</p>
                  <p><strong className="text-zinc-950">Tạo lúc:</strong> {formatDate(selectedMediaAsset.createdAt)}</p>
                </div>
              </div>
              <div className={styles.editGrid}>
                <MediaFields
                  draft={mediaEdit}
                  setDraft={setMediaEdit}
                  FormSelect={FormSelect}
                  mediaTypeOptions={mediaTypeOptions}
                  mediaStatusOptions={mediaStatusOptions}
                  disabled={!permissions.canManageMedia}
                />
              </div>
              {permissions.canManageMedia ? (
                <Button type="button" onClick={saveMediaEdit} loading={mediaSaving} loadingLabel="Đang lưu...">
                  Lưu thay đổi
                </Button>
              ) : null}
            </AdminSurfaceCard>
          ) : (
            <AdminEmptyState title="Không tìm thấy media" description="Media này có thể đã bị xóa hoặc không thuộc chi nhánh đang xem." />
          )}
        </AdminDetailShell>
      ) : null}
    </section>
  );
}
