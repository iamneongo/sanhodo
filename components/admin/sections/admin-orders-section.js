"use client";

import AdminDetailHeader from "../admin-detail-header";
import AdminActiveFilters from "../admin-active-filters";
import AdminEmptyState from "../admin-empty-state";
import AdminPageToolbar from "../admin-page-toolbar";
import AdminTableFooter from "../admin-table-footer";
import { AdminDetailShell, AdminListShell } from "../admin-panel-shell";
import useTablePagination from "../use-table-pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import styles from "../../admin.module.css";

export default function AdminOrdersSection({
  detailOnlyLayout,
  permissions,
  orderCreateOpen,
  setOrderCreateOpen,
  orderQuery,
  setOrderQuery,
  orderStatus,
  setOrderStatus,
  orderSort,
  setOrderSort,
  orderStatuses,
  orderSortOptions,
  createManualOrder,
  orderDraft,
  setOrderDraft,
  orderDraftMenuItemId,
  setOrderDraftMenuItemId,
  restaurantTables,
  drivers,
  menuItems,
  addItemToState,
  updateLineItem,
  removeLineItem,
  orderDraftTotals,
  orderSaving,
  filteredOrders,
  selectedOrder,
  openSectionDetail,
  formatDate,
  formatCurrency,
  formatLabel,
  findTableName,
  detailHeaderActions,
  deleteOrder,
  orderEdit,
  setOrderEdit,
  reservations,
  orderChannels,
  orderEditMenuItemId,
  setOrderEditMenuItemId,
  orderEditTotals,
  saveOrderEdit,
  FormSelect
}) {
  const pagination = useTablePagination(filteredOrders);
  const activeFilterItems = [
    {
      key: "query",
      active: Boolean(orderQuery.trim()),
      label: `Tìm: ${orderQuery.trim()}`,
      onClear: () => setOrderQuery("")
    },
    {
      key: "status",
      active: orderStatus !== "all",
      label: `Trạng thái: ${orderStatuses.find((item) => item.value === orderStatus)?.label || orderStatus}`,
      onClear: () => setOrderStatus("all")
    },
    {
      key: "sort",
      active: orderSort !== "newest",
      label: `Sắp xếp: ${orderSortOptions.find((item) => item.value === orderSort)?.label || orderSort}`,
      onClear: () => setOrderSort("newest")
    }
  ];

  return (
    <section className="grid w-full min-w-0 gap-4">
      {!detailOnlyLayout ? (
        <AdminListShell>
          <AdminPageToolbar
            actions={
              permissions.canManageOrders ? (
                <Button type="button" variant="secondary" onClick={() => setOrderCreateOpen((prev) => !prev)}>
                  {orderCreateOpen ? "Đóng form" : "Tạo đơn hàng"}
                </Button>
              ) : null
            }
            footer={
              <AdminActiveFilters
                items={activeFilterItems}
                onClearAll={() => {
                  setOrderQuery("");
                  setOrderStatus("all");
                  setOrderSort("newest");
                }}
              />
            }
          >
            <Input
              type="search"
              placeholder="Tìm khách đặt món..."
              value={orderQuery}
              onChange={(event) => setOrderQuery(event.target.value)}
            />
            <Select value={orderStatus} onValueChange={setOrderStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Trạng thái đơn" />
              </SelectTrigger>
              <SelectContent>
                {orderStatuses.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={orderSort} onValueChange={setOrderSort}>
              <SelectTrigger>
                <SelectValue placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent>
                {orderSortOptions.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </AdminPageToolbar>

          {orderCreateOpen && permissions.canManageOrders ? (
            <form className={styles.inlineForm} onSubmit={createManualOrder}>
              <Input
                type="text"
                placeholder="Tên khách"
                value={orderDraft.customerName}
                onChange={(event) => setOrderDraft((prev) => ({ ...prev, customerName: event.target.value }))}
                required
              />
              <Input
                type="tel"
                placeholder="SĐT"
                value={orderDraft.customerPhone}
                onChange={(event) => setOrderDraft((prev) => ({ ...prev, customerPhone: event.target.value }))}
                required
              />
              <div className={styles.inlineRow}>
                <FormSelect
                  value={orderDraft.tableId || "none"}
                  onValueChange={(value) => setOrderDraft((prev) => ({ ...prev, tableId: value === "none" ? "" : value }))}
                  options={[{ value: "none", label: "Chọn bàn" }, ...restaurantTables.map((table) => ({ value: table.id, label: table.name }))]}
                  placeholder="Chọn bàn"
                />
                <FormSelect
                  value={orderDraft.orderChannel}
                  onValueChange={(value) => setOrderDraft((prev) => ({ ...prev, orderChannel: value }))}
                  options={orderChannels}
                  placeholder="Kênh nhận order"
                />
              </div>
              <div className={styles.inlineRow}>
                <FormSelect
                  value={orderDraft.driverId || "none"}
                  onValueChange={(value) => setOrderDraft((prev) => ({ ...prev, driverId: value === "none" ? "" : value }))}
                  options={[{ value: "none", label: "Chưa gán tài xế" }, ...drivers.map((driver) => ({ value: driver.id, label: driver.fullName }))]}
                  placeholder="Chưa gán tài xế"
                />
                <Input
                  type="text"
                  placeholder="Mã giới thiệu"
                  value={orderDraft.referralCode}
                  onChange={(event) => setOrderDraft((prev) => ({ ...prev, referralCode: event.target.value }))}
                />
              </div>
              <div className={styles.inlineAddRow}>
                <FormSelect
                  value={orderDraftMenuItemId}
                  onValueChange={(value) => {
                    if (value !== "placeholder") {
                      addItemToState(value, setOrderDraft);
                      setOrderDraftMenuItemId("placeholder");
                    }
                  }}
                  options={[
                    { value: "placeholder", label: "Thêm món vào đơn" },
                    ...menuItems
                      .filter((item) => item.isAvailable)
                      .map((item) => ({ value: item.id, label: `${item.name} - ${formatCurrency(item.price)}` }))
                  ]}
                  placeholder="Thêm món vào đơn"
                />
              </div>
              <div className={styles.lineItemList}>
                {orderDraft.items.map((item, index) => (
                  <div key={`${item.menuItemId}-${index}`} className={styles.lineItemRow}>
                    <strong>{item.itemName}</strong>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(event) => updateLineItem(setOrderDraft, index, "quantity", event.target.value)}
                    />
                    <Input
                      type="number"
                      min="0"
                      value={item.unitPrice}
                      onChange={(event) => updateLineItem(setOrderDraft, index, "unitPrice", event.target.value)}
                    />
                    <Button type="button" variant="outline" onClick={() => removeLineItem(setOrderDraft, index)}>
                      Xóa
                    </Button>
                  </div>
                ))}
              </div>
              <div className={styles.inlineRow}>
                <Input
                  type="number"
                  min="0"
                  placeholder="Giảm giá"
                  value={orderDraft.discountAmount}
                  onChange={(event) => setOrderDraft((prev) => ({ ...prev, discountAmount: Number(event.target.value) }))}
                />
                <Input
                  type="number"
                  min="0"
                  placeholder="Phụ thu dịch vụ"
                  value={orderDraft.serviceCharge}
                  onChange={(event) => setOrderDraft((prev) => ({ ...prev, serviceCharge: Number(event.target.value) }))}
                />
              </div>
              <Textarea
                placeholder="Ghi chú đơn hàng"
                rows={3}
                value={orderDraft.notes}
                onChange={(event) => setOrderDraft((prev) => ({ ...prev, notes: event.target.value }))}
              />
              <div className={styles.summaryRow}>
                <span>Tạm tính: {formatCurrency(orderDraftTotals.subtotal)}</span>
                <span>Tổng: {formatCurrency(orderDraftTotals.total)}</span>
              </div>
              <Button type="submit" disabled={orderSaving}>
                {orderSaving ? "Đang tạo..." : "Lưu đơn hàng"}
              </Button>
            </form>
          ) : null}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Khách</TableHead>
                <TableHead>Bàn</TableHead>
                <TableHead>Món</TableHead>
                <TableHead>Tổng</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagination.pagedItems.map((item) => (
                <TableRow key={item.id} className={styles.interactiveRow} onClick={() => openSectionDetail("orders", item.id)}>
                  <TableCell>
                    <strong>{item.customerName}</strong>
                    <span>{formatDate(item.createdAt)}</span>
                  </TableCell>
                  <TableCell>{findTableName(item.tableId)}</TableCell>
                  <TableCell>{item.items.length}</TableCell>
                  <TableCell>{formatCurrency(item.totalAmount)}</TableCell>
                  <TableCell>
                    <span className={`${styles.statusBadge} ${styles[`status_${item.status}`] || styles.status_contacted}`}>{formatLabel(item.status)}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <AdminTableFooter {...pagination} />
        </AdminListShell>
      ) : null}

      {detailOnlyLayout ? (
        <AdminDetailShell>
          {selectedOrder ? (
            <div>
              <AdminDetailHeader
                kicker="Chi tiết đơn hàng"
                title={selectedOrder.customerName}
                actions={detailHeaderActions(
                  "orders",
                  permissions.canManageOrders ? (
                    <Button className={styles.deleteButton} variant="destructive" type="button" onClick={() => deleteOrder(selectedOrder.id)}>
                      Xóa đơn
                    </Button>
                  ) : null
                )}
              />
              {permissions.canManageOrders ? (
                <div className={styles.quickStatusRow}>
                  {orderStatuses
                    .filter((item) => item.value !== "all")
                    .map((item) => (
                      <Button
                        type="button"
                        variant={orderEdit.status === item.value ? "default" : "outline"}
                        key={item.value}
                        className={orderEdit.status === item.value ? styles.quickActive : ""}
                        onClick={() => setOrderEdit((prev) => ({ ...prev, status: item.value }))}
                      >
                        {item.label}
                      </Button>
                    ))}
                </div>
              ) : null}
              <div className={styles.editGrid}>
                <label>
                  <span>Tên khách</span>
                  <Input type="text" value={orderEdit.customerName} onChange={(event) => setOrderEdit((prev) => ({ ...prev, customerName: event.target.value }))} />
                </label>
                <label>
                  <span>SĐT</span>
                  <Input type="text" value={orderEdit.customerPhone} onChange={(event) => setOrderEdit((prev) => ({ ...prev, customerPhone: event.target.value }))} />
                </label>
                <label>
                  <span>Đặt bàn liên kết</span>
                  <FormSelect
                    value={orderEdit.reservationId || "none"}
                    onValueChange={(value) => setOrderEdit((prev) => ({ ...prev, reservationId: value === "none" ? "" : value }))}
                    options={[{ value: "none", label: "Không gắn" }, ...reservations.map((reservation) => ({ value: reservation.id, label: reservation.name }))]}
                    placeholder="Không gắn"
                  />
                </label>
                <label>
                  <span>Bàn</span>
                  <FormSelect
                    value={orderEdit.tableId || "none"}
                    onValueChange={(value) => setOrderEdit((prev) => ({ ...prev, tableId: value === "none" ? "" : value }))}
                    options={[{ value: "none", label: "Không gắn" }, ...restaurantTables.map((table) => ({ value: table.id, label: table.name }))]}
                    placeholder="Không gắn"
                  />
                </label>
                <label>
                  <span>Kênh nhận order</span>
                  <FormSelect
                    value={orderEdit.orderChannel}
                    onValueChange={(value) => setOrderEdit((prev) => ({ ...prev, orderChannel: value }))}
                    options={orderChannels}
                    placeholder="Kênh nhận order"
                  />
                </label>
                <label>
                  <span>Giảm giá</span>
                  <Input type="number" min="0" value={orderEdit.discountAmount} onChange={(event) => setOrderEdit((prev) => ({ ...prev, discountAmount: Number(event.target.value) }))} />
                </label>
                <label>
                  <span>Phụ thu dịch vụ</span>
                  <Input type="number" min="0" value={orderEdit.serviceCharge} onChange={(event) => setOrderEdit((prev) => ({ ...prev, serviceCharge: Number(event.target.value) }))} />
                </label>
                <label className={styles.fullWidth}>
                  <span>Ghi chú</span>
                  <Textarea rows={4} value={orderEdit.notes} onChange={(event) => setOrderEdit((prev) => ({ ...prev, notes: event.target.value }))} />
                </label>
              </div>
              <div className={styles.inlineAddRow}>
                <FormSelect
                  value={orderEditMenuItemId}
                  onValueChange={(value) => {
                    if (value !== "placeholder") {
                      addItemToState(value, setOrderEdit);
                      setOrderEditMenuItemId("placeholder");
                    }
                  }}
                  options={[
                    { value: "placeholder", label: "Thêm món vào order" },
                    ...menuItems
                      .filter((item) => item.isAvailable)
                      .map((item) => ({ value: item.id, label: `${item.name} - ${formatCurrency(item.price)}` }))
                  ]}
                  placeholder="Thêm món vào đơn"
                />
              </div>
              <div className={styles.lineItemList}>
                {orderEdit.items.map((item, index) => (
                  <div key={`${item.menuItemId || item.id}-${index}`} className={styles.lineItemRow}>
                    <strong>{item.itemName}</strong>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(event) => updateLineItem(setOrderEdit, index, "quantity", event.target.value)}
                    />
                    <Input
                      type="number"
                      min="0"
                      value={item.unitPrice}
                      onChange={(event) => updateLineItem(setOrderEdit, index, "unitPrice", event.target.value)}
                    />
                    <Button type="button" variant="outline" onClick={() => removeLineItem(setOrderEdit, index)}>
                      Xóa
                    </Button>
                  </div>
                ))}
              </div>
              <div className={styles.summaryRow}>
                <span>Tạm tính: {formatCurrency(orderEditTotals.subtotal)}</span>
                <span>Tổng: {formatCurrency(orderEditTotals.total)}</span>
              </div>
              {permissions.canManageOrders ? (
                <div className={styles.detailActions}>
                  <Button type="button" className={styles.saveButton} onClick={saveOrderEdit} disabled={orderSaving}>
                    {orderSaving ? "Đang lưu..." : "Lưu đơn"}
                  </Button>
                </div>
              ) : null}
            </div>
          ) : (
            <AdminEmptyState title="Không tìm thấy đơn hàng." description="Đơn hàng có thể đã bị xóa hoặc không thuộc chi nhánh đang xem." />
          )}
        </AdminDetailShell>
      ) : null}
    </section>
  );
}
