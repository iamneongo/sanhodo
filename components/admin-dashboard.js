"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./admin.module.css";

const reservationStatuses = [
  { value: "all", label: "Tất cả" },
  { value: "new", label: "Mới" },
  { value: "contacted", label: "Đã liên hệ" },
  { value: "confirmed", label: "Đã xác nhận" },
  { value: "arrived", label: "Đã tới" },
  { value: "cancelled", label: "Đã hủy" }
];

const voucherStatuses = [
  { value: "all", label: "Tất cả" },
  { value: "new", label: "Mới" },
  { value: "qualified", label: "Đủ điều kiện" },
  { value: "used", label: "Đã dùng" },
  { value: "closed", label: "Đã chốt" }
];

const orderStatuses = [
  { value: "all", label: "Tất cả" },
  { value: "draft", label: "Draft" },
  { value: "confirmed", label: "Confirmed" },
  { value: "preparing", label: "Preparing" },
  { value: "served", label: "Served" },
  { value: "paid", label: "Paid" },
  { value: "cancelled", label: "Cancelled" }
];

const tableStatuses = ["available", "reserved", "occupied", "cleaning", "inactive"];
const orderChannels = ["admin", "website", "reservation", "walk-in", "phone", "zalo"];
const spicyLevels = ["none", "mild", "medium", "hot"];

function formatDate(value) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "short",
      timeStyle: "short"
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatCurrency(value) {
  return `${new Intl.NumberFormat("vi-VN").format(Number(value || 0))}đ`;
}

function matchesSearch(item, query, fields) {
  if (!query) return true;
  const normalized = query.toLowerCase();
  return fields.some((field) => String(item[field] || "").toLowerCase().includes(normalized));
}

function sortByCreatedDesc(items) {
  return [...items].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

function sortByName(items, field = "name") {
  return [...items].sort((a, b) => String(a[field] || "").localeCompare(String(b[field] || ""), "vi"));
}

function createEmptyOrderDraft() {
  return {
    customerName: "",
    customerPhone: "",
    reservationId: "",
    tableId: "",
    status: "draft",
    orderChannel: "admin",
    notes: "",
    discountAmount: 0,
    serviceCharge: 0,
    items: []
  };
}

function cloneOrder(order) {
  if (!order) return createEmptyOrderDraft();
  return {
    customerName: order.customerName || "",
    customerPhone: order.customerPhone || "",
    reservationId: order.reservationId || "",
    tableId: order.tableId || "",
    status: order.status || "draft",
    orderChannel: order.orderChannel || "admin",
    notes: order.notes || "",
    discountAmount: order.discountAmount || 0,
    serviceCharge: order.serviceCharge || 0,
    items: Array.isArray(order.items) ? order.items.map((item) => ({ ...item })) : []
  };
}

function createEmptyMenuDraft() {
  return {
    name: "",
    slug: "",
    category: "Hải sản",
    description: "",
    price: 0,
    imageUrl: "",
    prepTimeMinutes: 15,
    spicyLevel: "none",
    isFeatured: false,
    isAvailable: true,
    sortOrder: 0
  };
}

function createEmptyTableDraft() {
  return {
    name: "",
    area: "Sảnh chính",
    capacity: 2,
    status: "available",
    minSpend: 0,
    notes: "",
    sortOrder: 0,
    isActive: true
  };
}

function computeOrderTotals(order) {
  const subtotal = (order.items || []).reduce(
    (sum, item) => sum + Number(item.unitPrice || 0) * Number(item.quantity || 0),
    0
  );
  const discountAmount = Number(order.discountAmount || 0);
  const serviceCharge = Number(order.serviceCharge || 0);
  return {
    subtotal,
    total: Math.max(0, subtotal - discountAmount + serviceCharge)
  };
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}

export default function AdminDashboard({
  initialReservations,
  initialVouchers,
  initialIntegrations,
  initialSyncLogs,
  initialMenuItems,
  initialTables,
  initialOrders,
  adminProfile
}) {
  const router = useRouter();
  const [tab, setTab] = useState("reservations");
  const [message, setMessage] = useState("");

  const [reservations, setReservations] = useState(sortByCreatedDesc(initialReservations));
  const [vouchers, setVouchers] = useState(sortByCreatedDesc(initialVouchers));
  const [menuItems, setMenuItems] = useState(sortByName(initialMenuItems));
  const [restaurantTables, setRestaurantTables] = useState(sortByName(initialTables));
  const [orders, setOrders] = useState(sortByCreatedDesc(initialOrders));
  const [integrations, setIntegrations] = useState(initialIntegrations);
  const [syncLogs, setSyncLogs] = useState(initialSyncLogs);

  const [reservationQuery, setReservationQuery] = useState("");
  const [reservationStatus, setReservationStatus] = useState("all");
  const [voucherQuery, setVoucherQuery] = useState("");
  const [voucherStatus, setVoucherStatus] = useState("all");
  const [orderQuery, setOrderQuery] = useState("");
  const [orderStatus, setOrderStatus] = useState("all");
  const [menuQuery, setMenuQuery] = useState("");
  const [tableQuery, setTableQuery] = useState("");

  const [selectedReservationId, setSelectedReservationId] = useState(initialReservations[0]?.id || "");
  const [selectedVoucherId, setSelectedVoucherId] = useState(initialVouchers[0]?.id || "");
  const [selectedOrderId, setSelectedOrderId] = useState(initialOrders[0]?.id || "");
  const [selectedMenuId, setSelectedMenuId] = useState(initialMenuItems[0]?.id || "");
  const [selectedTableId, setSelectedTableId] = useState(initialTables[0]?.id || "");
  const [selectedIntegrationId, setSelectedIntegrationId] = useState(initialIntegrations[0]?.id || "");

  const [manualOpen, setManualOpen] = useState(false);
  const [orderCreateOpen, setOrderCreateOpen] = useState(false);
  const [menuCreateOpen, setMenuCreateOpen] = useState(false);
  const [tableCreateOpen, setTableCreateOpen] = useState(false);

  const [reservationSaving, setReservationSaving] = useState(false);
  const [voucherSaving, setVoucherSaving] = useState(false);
  const [orderSaving, setOrderSaving] = useState(false);
  const [menuSaving, setMenuSaving] = useState(false);
  const [tableSaving, setTableSaving] = useState(false);
  const [integrationSaving, setIntegrationSaving] = useState(false);

  const [manualForm, setManualForm] = useState({
    name: "",
    phone: "",
    guests: "2",
    datetime: "",
    selectedOffer: "",
    notes: "",
    assignedTo: "",
    tableId: ""
  });
  const [orderDraft, setOrderDraft] = useState(createEmptyOrderDraft());
  const [orderEdit, setOrderEdit] = useState(createEmptyOrderDraft());
  const [menuDraft, setMenuDraft] = useState(createEmptyMenuDraft());
  const [menuEdit, setMenuEdit] = useState(createEmptyMenuDraft());
  const [tableDraft, setTableDraft] = useState(createEmptyTableDraft());
  const [tableEdit, setTableEdit] = useState(createEmptyTableDraft());

  const selectedReservation = reservations.find((item) => item.id === selectedReservationId) || null;
  const selectedVoucher = vouchers.find((item) => item.id === selectedVoucherId) || null;
  const selectedOrder = orders.find((item) => item.id === selectedOrderId) || null;
  const selectedMenuItem = menuItems.find((item) => item.id === selectedMenuId) || null;
  const selectedTable = restaurantTables.find((item) => item.id === selectedTableId) || null;
  const selectedIntegration = integrations.find((item) => item.id === selectedIntegrationId) || null;

  useEffect(() => {
    setOrderEdit(cloneOrder(selectedOrder));
  }, [selectedOrderId, selectedOrder]);

  useEffect(() => {
    setMenuEdit(selectedMenuItem ? { ...selectedMenuItem } : createEmptyMenuDraft());
  }, [selectedMenuId, selectedMenuItem]);

  useEffect(() => {
    setTableEdit(selectedTable ? { ...selectedTable } : createEmptyTableDraft());
  }, [selectedTableId, selectedTable]);

  const filteredReservations = useMemo(
    () =>
      reservations.filter((item) => {
        const statusMatch = reservationStatus === "all" || item.status === reservationStatus;
        return statusMatch && matchesSearch(item, reservationQuery, ["name", "phone", "selectedOffer", "notes", "assignedTo"]);
      }),
    [reservations, reservationQuery, reservationStatus]
  );

  const filteredVouchers = useMemo(
    () =>
      vouchers.filter((item) => {
        const statusMatch = voucherStatus === "all" || item.status === voucherStatus;
        return statusMatch && matchesSearch(item, voucherQuery, ["phone", "notes", "source"]);
      }),
    [vouchers, voucherQuery, voucherStatus]
  );

  const filteredOrders = useMemo(
    () =>
      orders.filter((item) => {
        const statusMatch = orderStatus === "all" || item.status === orderStatus;
        return statusMatch && matchesSearch(item, orderQuery, ["customerName", "customerPhone", "notes"]);
      }),
    [orders, orderQuery, orderStatus]
  );

  const filteredMenuItems = useMemo(
    () => menuItems.filter((item) => matchesSearch(item, menuQuery, ["name", "category", "description"])),
    [menuItems, menuQuery]
  );

  const filteredTables = useMemo(
    () => restaurantTables.filter((item) => matchesSearch(item, tableQuery, ["name", "area", "notes", "status"])),
    [restaurantTables, tableQuery]
  );

  const findTableName = (tableId) => restaurantTables.find((item) => item.id === tableId)?.name || "-";
  const findReservationName = (reservationId) => reservations.find((item) => item.id === reservationId)?.name || "-";

  const addItemToState = (menuItemId, setter) => {
    const found = menuItems.find((item) => item.id === menuItemId);
    if (!found) return;

    setter((prev) => ({
      ...prev,
      items: [
        ...(prev.items || []),
        {
          menuItemId: found.id,
          itemName: found.name,
          unitPrice: found.price,
          quantity: 1,
          notes: ""
        }
      ]
    }));
  };

  const updateLineItem = (setter, index, field, value) => {
    setter((prev) => ({
      ...prev,
      items: (prev.items || []).map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: field === "quantity" || field === "unitPrice" ? Number(value) : value } : item
      )
    }));
  };

  const removeLineItem = (setter, index) => {
    setter((prev) => ({
      ...prev,
      items: (prev.items || []).filter((_, itemIndex) => itemIndex !== index)
    }));
  };

  const patchReservation = async (id, payload) => {
    setReservationSaving(true);
    setMessage("");
    try {
      const data = await requestJson(`/api/admin/reservations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      setReservations((prev) => sortByCreatedDesc(prev.map((item) => (item.id === id ? data.data : item))));
      setMessage("Đã cập nhật đặt bàn.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setReservationSaving(false);
    }
  };

  const patchVoucher = async (id, payload) => {
    setVoucherSaving(true);
    setMessage("");
    try {
      const data = await requestJson(`/api/admin/vouchers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      setVouchers((prev) => sortByCreatedDesc(prev.map((item) => (item.id === id ? data.data : item))));
      setMessage("Đã cập nhật voucher.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setVoucherSaving(false);
    }
  };

  const createManualReservation = async (event) => {
    event.preventDefault();
    setReservationSaving(true);
    setMessage("");
    try {
      const data = await requestJson("/api/admin/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...manualForm, status: "confirmed", source: "admin-manual" })
      });
      setReservations((prev) => sortByCreatedDesc([data.data, ...prev]));
      setSelectedReservationId(data.data.id);
      setManualOpen(false);
      setManualForm({ name: "", phone: "", guests: "2", datetime: "", selectedOffer: "", notes: "", assignedTo: "", tableId: "" });
      setMessage("Đã thêm khách đặt bàn mới.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setReservationSaving(false);
    }
  };

  const deleteReservation = async (id) => {
    if (!window.confirm("Xóa lead đặt bàn này?")) return;
    try {
      await requestJson(`/api/admin/reservations/${id}`, { method: "DELETE" });
      const next = reservations.filter((item) => item.id !== id);
      setReservations(next);
      setSelectedReservationId(next[0]?.id || "");
      setMessage("Đã xóa lead đặt bàn.");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const createManualOrder = async (event) => {
    event.preventDefault();
    setOrderSaving(true);
    setMessage("");
    try {
      const data = await requestJson("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderDraft)
      });
      setOrders((prev) => sortByCreatedDesc([data.data, ...prev]));
      setSelectedOrderId(data.data.id);
      setOrderDraft(createEmptyOrderDraft());
      setOrderCreateOpen(false);
      setMessage("Đã tạo order mới.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setOrderSaving(false);
    }
  };

  const saveOrderEdit = async () => {
    if (!selectedOrder) return;
    setOrderSaving(true);
    setMessage("");
    try {
      const data = await requestJson(`/api/admin/orders/${selectedOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderEdit)
      });
      setOrders((prev) => sortByCreatedDesc(prev.map((item) => (item.id === selectedOrder.id ? data.data : item))));
      setMessage("Đã cập nhật order.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setOrderSaving(false);
    }
  };

  const deleteOrder = async (id) => {
    if (!window.confirm("Xóa order này?")) return;
    try {
      await requestJson(`/api/admin/orders/${id}`, { method: "DELETE" });
      const next = orders.filter((item) => item.id !== id);
      setOrders(next);
      setSelectedOrderId(next[0]?.id || "");
      setMessage("Đã xóa order.");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const createMenuItemEntry = async (event) => {
    event.preventDefault();
    setMenuSaving(true);
    setMessage("");
    try {
      const data = await requestJson("/api/admin/menu-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(menuDraft)
      });
      setMenuItems((prev) => sortByName([data.data, ...prev]));
      setSelectedMenuId(data.data.id);
      setMenuDraft(createEmptyMenuDraft());
      setMenuCreateOpen(false);
      setMessage("Đã tạo món mới.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setMenuSaving(false);
    }
  };

  const saveMenuEdit = async () => {
    if (!selectedMenuItem) return;
    setMenuSaving(true);
    setMessage("");
    try {
      const data = await requestJson(`/api/admin/menu-items/${selectedMenuItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(menuEdit)
      });
      setMenuItems((prev) => sortByName(prev.map((item) => (item.id === selectedMenuItem.id ? data.data : item))));
      setMessage("Đã cập nhật món ăn.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setMenuSaving(false);
    }
  };

  const deleteMenuItemEntry = async (id) => {
    if (!window.confirm("Xóa món này?")) return;
    try {
      await requestJson(`/api/admin/menu-items/${id}`, { method: "DELETE" });
      const next = menuItems.filter((item) => item.id !== id);
      setMenuItems(next);
      setSelectedMenuId(next[0]?.id || "");
      setMessage("Đã xóa món ăn.");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const createTableEntry = async (event) => {
    event.preventDefault();
    setTableSaving(true);
    setMessage("");
    try {
      const data = await requestJson("/api/admin/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tableDraft)
      });
      setRestaurantTables((prev) => sortByName([data.data, ...prev]));
      setSelectedTableId(data.data.id);
      setTableDraft(createEmptyTableDraft());
      setTableCreateOpen(false);
      setMessage("Đã tạo bàn mới.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setTableSaving(false);
    }
  };

  const saveTableEdit = async () => {
    if (!selectedTable) return;
    setTableSaving(true);
    setMessage("");
    try {
      const data = await requestJson(`/api/admin/tables/${selectedTable.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tableEdit)
      });
      setRestaurantTables((prev) => sortByName(prev.map((item) => (item.id === selectedTable.id ? data.data : item))));
      setMessage("Đã cập nhật bàn.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setTableSaving(false);
    }
  };

  const deleteTableEntry = async (id) => {
    if (!window.confirm("Xóa bàn này?")) return;
    try {
      await requestJson(`/api/admin/tables/${id}`, { method: "DELETE" });
      const next = restaurantTables.filter((item) => item.id !== id);
      setRestaurantTables(next);
      setSelectedTableId(next[0]?.id || "");
      setMessage("Đã xóa bàn.");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const patchIntegration = async (id, payload) => {
    setIntegrationSaving(true);
    setMessage("");
    try {
      const data = await requestJson(`/api/admin/integrations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      setIntegrations((prev) => prev.map((item) => (item.id === id ? data.data : item)));
      setMessage("Đã cập nhật cấu hình tích hợp.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIntegrationSaving(false);
    }
  };

  const syncReservation = async (reservationId, integrationId) => {
    setIntegrationSaving(true);
    setMessage("");
    try {
      await requestJson("/api/admin/integrations/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId, integrationId })
      });
      const logData = await requestJson("/api/admin/integrations/logs");
      setSyncLogs(logData.data || []);
      setMessage("Đồng bộ đặt bàn sang POS/PMS thành công.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIntegrationSaving(false);
    }
  };

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  const reservationStats = {
    total: reservations.length,
    pending: reservations.filter((item) => ["new", "contacted"].includes(item.status)).length
  };
  const orderStats = {
    total: orders.length,
    active: orders.filter((item) => ["confirmed", "preparing", "served"].includes(item.status)).length
  };
  const menuStats = {
    total: menuItems.length,
    featured: menuItems.filter((item) => item.isFeatured).length
  };
  const tableStats = {
    total: restaurantTables.length,
    available: restaurantTables.filter((item) => item.status === "available").length
  };

  const orderDraftTotals = computeOrderTotals(orderDraft);
  const orderEditTotals = computeOrderTotals(orderEdit);

  return (
    <main className={styles.dashboardPage}>
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <div>
            <span className={styles.kicker}>Admin Dashboard</span>
            <h1>Vận hành nhà hàng trên dữ liệu Supabase thật</h1>
            <p>Quản lý đặt bàn, order, bàn, món, voucher và tích hợp trong cùng một dashboard.</p>
          </div>
          <div className={styles.topbarActions}>
            <span className={styles.adminBadge}>{adminProfile?.full_name || adminProfile?.email || "Admin"}</span>
            <a className={styles.exportButton} href="/api/admin/export?type=reservations">Export đặt bàn</a>
            <a className={styles.exportButton} href="/api/admin/export?type=vouchers">Export voucher</a>
            <button className={styles.logoutButton} type="button" onClick={logout}>Đăng xuất</button>
          </div>
        </header>

        <section className={styles.statsGrid}>
          <article className={styles.statCard}><span>Đặt bàn</span><strong>{reservationStats.total}</strong><small>{reservationStats.pending} lead đang chờ xử lý</small></article>
          <article className={styles.statCard}><span>Orders</span><strong>{orderStats.total}</strong><small>{orderStats.active} order đang phục vụ</small></article>
          <article className={styles.statCard}><span>Thực đơn</span><strong>{menuStats.total}</strong><small>{menuStats.featured} món featured</small></article>
          <article className={styles.statCard}><span>Bàn</span><strong>{tableStats.total}</strong><small>{tableStats.available} bàn còn trống</small></article>
        </section>

        <section className={styles.tabBar}>
          {["reservations", "orders", "tables", "menu", "vouchers", "integrations"].map((key) => (
            <button key={key} type="button" className={tab === key ? styles.activeTab : ""} onClick={() => setTab(key)}>
              {key === "reservations" ? "Đặt bàn" : key === "orders" ? "Đặt món / Orders" : key === "tables" ? "Bàn" : key === "menu" ? "Món ăn" : key === "vouchers" ? "Voucher" : "Tích hợp POS/PMS"}
            </button>
          ))}
        </section>

        {message ? <p className={styles.feedback}>{message}</p> : null}

        {tab === "reservations" ? (
          <section className={styles.adminGrid}>
            <div className={styles.listPanel}>
              <div className={styles.panelToolbar}>
                <input type="search" placeholder="Tìm khách đặt bàn..." value={reservationQuery} onChange={(event) => setReservationQuery(event.target.value)} />
                <select value={reservationStatus} onChange={(event) => setReservationStatus(event.target.value)}>{reservationStatuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
                <button type="button" onClick={() => setManualOpen((prev) => !prev)}>{manualOpen ? "Đóng form" : "Thêm đặt bàn"}</button>
              </div>

              {manualOpen ? (
                <form className={styles.inlineForm} onSubmit={createManualReservation}>
                  <input type="text" placeholder="Tên khách" value={manualForm.name} onChange={(event) => setManualForm((prev) => ({ ...prev, name: event.target.value }))} required />
                  <input type="tel" placeholder="SĐT" value={manualForm.phone} onChange={(event) => setManualForm((prev) => ({ ...prev, phone: event.target.value }))} required />
                  <div className={styles.inlineRow}>
                    <input type="text" placeholder="Số khách" value={manualForm.guests} onChange={(event) => setManualForm((prev) => ({ ...prev, guests: event.target.value }))} required />
                    <input type="datetime-local" value={manualForm.datetime} onChange={(event) => setManualForm((prev) => ({ ...prev, datetime: event.target.value }))} required />
                  </div>
                  <select value={manualForm.tableId} onChange={(event) => setManualForm((prev) => ({ ...prev, tableId: event.target.value }))}><option value="">Chưa gán bàn</option>{restaurantTables.map((table) => <option key={table.id} value={table.id}>{table.name}</option>)}</select>
                  <textarea placeholder="Ghi chú" value={manualForm.notes} onChange={(event) => setManualForm((prev) => ({ ...prev, notes: event.target.value }))} rows={3} />
                  <button type="submit" disabled={reservationSaving}>{reservationSaving ? "Đang lưu..." : "Lưu đặt bàn"}</button>
                </form>
              ) : null}

              <div className={styles.tableWrap}>
                <table className={styles.dataTable}>
                  <thead><tr><th>Khách</th><th>SĐT</th><th>Thời gian</th><th>Bàn</th><th>Trạng thái</th></tr></thead>
                  <tbody>
                    {filteredReservations.map((item) => (
                      <tr key={item.id} className={item.id === selectedReservation?.id ? styles.activeRow : ""} onClick={() => setSelectedReservationId(item.id)}>
                        <td><strong>{item.name}</strong><span>{item.guests} khách</span></td>
                        <td>{item.phone}</td>
                        <td>{formatDate(item.datetime)}</td>
                        <td>{findTableName(item.tableId)}</td>
                        <td><span className={`${styles.statusBadge} ${styles[`status_${item.status}`] || styles.status_new}`}>{item.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={styles.detailPanel}>
              {selectedReservation ? (
                <div>
                  <div className={styles.detailHeading}>
                    <div><span className={styles.kicker}>Chi tiết đặt bàn</span><h2>{selectedReservation.name}</h2></div>
                    <button className={styles.deleteButton} type="button" onClick={() => deleteReservation(selectedReservation.id)}>Xóa lead</button>
                  </div>
                  <div className={styles.quickStatusRow}>{reservationStatuses.filter((item) => item.value !== "all").map((item) => <button type="button" key={item.value} className={selectedReservation.status === item.value ? styles.quickActive : ""} onClick={() => patchReservation(selectedReservation.id, { ...selectedReservation, status: item.value })}>{item.label}</button>)}</div>
                  <div className={styles.editGrid}>
                    <label><span>SĐT</span><input type="text" defaultValue={selectedReservation.phone} onBlur={(event) => patchReservation(selectedReservation.id, { ...selectedReservation, phone: event.target.value })} /></label>
                    <label><span>Số khách</span><input type="text" defaultValue={selectedReservation.guests} onBlur={(event) => patchReservation(selectedReservation.id, { ...selectedReservation, guests: event.target.value })} /></label>
                    <label><span>Thời gian</span><input type="datetime-local" defaultValue={selectedReservation.datetime} onBlur={(event) => patchReservation(selectedReservation.id, { ...selectedReservation, datetime: event.target.value })} /></label>
                    <label><span>Gán bàn</span><select defaultValue={selectedReservation.tableId || ""} onBlur={(event) => patchReservation(selectedReservation.id, { ...selectedReservation, tableId: event.target.value })}><option value="">Chưa gán bàn</option>{restaurantTables.map((table) => <option key={table.id} value={table.id}>{table.name}</option>)}</select></label>
                    <label className={styles.fullWidth}><span>Ghi chú</span><textarea rows={5} defaultValue={selectedReservation.notes || ""} onBlur={(event) => patchReservation(selectedReservation.id, { ...selectedReservation, notes: event.target.value })} /></label>
                  </div>
                  <div className={styles.syncBox}><div><span className={styles.kicker}>Sync POS/PMS</span><p>Đồng bộ lead này sang hệ POS/PMS.</p></div><div className={styles.syncActions}><select value={selectedIntegrationId} onChange={(event) => setSelectedIntegrationId(event.target.value)}>{integrations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><button type="button" onClick={() => syncReservation(selectedReservation.id, selectedIntegrationId)} disabled={integrationSaving}>{integrationSaving ? "Đang sync..." : "Sync ngay"}</button></div></div>
                </div>
              ) : <div className={styles.emptyState}>Chưa có lead đặt bàn.</div>}
            </div>
          </section>
        ) : null}

        {tab === "orders" ? (
          <section className={styles.adminGrid}>
            <div className={styles.listPanel}>
              <div className={styles.panelToolbar}>
                <input type="search" placeholder="Tìm khách order..." value={orderQuery} onChange={(event) => setOrderQuery(event.target.value)} />
                <select value={orderStatus} onChange={(event) => setOrderStatus(event.target.value)}>{orderStatuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
                <button type="button" onClick={() => setOrderCreateOpen((prev) => !prev)}>{orderCreateOpen ? "Đóng form" : "Tạo order"}</button>
              </div>

              {orderCreateOpen ? (
                <form className={styles.inlineForm} onSubmit={createManualOrder}>
                  <input type="text" placeholder="Tên khách" value={orderDraft.customerName} onChange={(event) => setOrderDraft((prev) => ({ ...prev, customerName: event.target.value }))} required />
                  <input type="tel" placeholder="SĐT" value={orderDraft.customerPhone} onChange={(event) => setOrderDraft((prev) => ({ ...prev, customerPhone: event.target.value }))} required />
                  <div className={styles.inlineRow}>
                    <select value={orderDraft.tableId} onChange={(event) => setOrderDraft((prev) => ({ ...prev, tableId: event.target.value }))}><option value="">Chọn bàn</option>{restaurantTables.map((table) => <option key={table.id} value={table.id}>{table.name}</option>)}</select>
                    <select value={orderDraft.orderChannel} onChange={(event) => setOrderDraft((prev) => ({ ...prev, orderChannel: event.target.value }))}>{orderChannels.map((item) => <option key={item} value={item}>{item}</option>)}</select>
                  </div>
                  <div className={styles.inlineAddRow}><select defaultValue="" onChange={(event) => { if (event.target.value) { addItemToState(event.target.value, setOrderDraft); event.target.value = ""; } }}><option value="">Thêm món vào order</option>{menuItems.filter((item) => item.isAvailable).map((item) => <option key={item.id} value={item.id}>{item.name} - {formatCurrency(item.price)}</option>)}</select></div>
                  <div className={styles.lineItemList}>{orderDraft.items.map((item, index) => <div key={`${item.menuItemId}-${index}`} className={styles.lineItemRow}><strong>{item.itemName}</strong><input type="number" min="1" value={item.quantity} onChange={(event) => updateLineItem(setOrderDraft, index, "quantity", event.target.value)} /><input type="number" min="0" value={item.unitPrice} onChange={(event) => updateLineItem(setOrderDraft, index, "unitPrice", event.target.value)} /><button type="button" onClick={() => removeLineItem(setOrderDraft, index)}>Xóa</button></div>)}</div>
                  <div className={styles.inlineRow}><input type="number" min="0" placeholder="Discount" value={orderDraft.discountAmount} onChange={(event) => setOrderDraft((prev) => ({ ...prev, discountAmount: Number(event.target.value) }))} /><input type="number" min="0" placeholder="Service charge" value={orderDraft.serviceCharge} onChange={(event) => setOrderDraft((prev) => ({ ...prev, serviceCharge: Number(event.target.value) }))} /></div>
                  <textarea placeholder="Ghi chú order" rows={3} value={orderDraft.notes} onChange={(event) => setOrderDraft((prev) => ({ ...prev, notes: event.target.value }))} />
                  <div className={styles.summaryRow}><span>Tạm tính: {formatCurrency(orderDraftTotals.subtotal)}</span><span>Tổng: {formatCurrency(orderDraftTotals.total)}</span></div>
                  <button type="submit" disabled={orderSaving}>{orderSaving ? "Đang tạo..." : "Lưu order"}</button>
                </form>
              ) : null}

              <div className={styles.tableWrap}>
                <table className={styles.dataTable}><thead><tr><th>Khách</th><th>Bàn</th><th>Món</th><th>Tổng</th><th>Trạng thái</th></tr></thead><tbody>{filteredOrders.map((item) => <tr key={item.id} className={item.id === selectedOrder?.id ? styles.activeRow : ""} onClick={() => setSelectedOrderId(item.id)}><td><strong>{item.customerName}</strong><span>{formatDate(item.createdAt)}</span></td><td>{findTableName(item.tableId)}</td><td>{item.items.length}</td><td>{formatCurrency(item.totalAmount)}</td><td><span className={`${styles.statusBadge} ${styles[`status_${item.status}`] || styles.status_contacted}`}>{item.status}</span></td></tr>)}</tbody></table>
              </div>
            </div>

            <div className={styles.detailPanel}>
              {selectedOrder ? (
                <div>
                  <div className={styles.detailHeading}><div><span className={styles.kicker}>Chi tiết order</span><h2>{selectedOrder.customerName}</h2></div><button className={styles.deleteButton} type="button" onClick={() => deleteOrder(selectedOrder.id)}>Xóa order</button></div>
                  <div className={styles.quickStatusRow}>{orderStatuses.filter((item) => item.value !== "all").map((item) => <button type="button" key={item.value} className={orderEdit.status === item.value ? styles.quickActive : ""} onClick={() => setOrderEdit((prev) => ({ ...prev, status: item.value }))}>{item.label}</button>)}</div>
                  <div className={styles.editGrid}>
                    <label><span>Tên khách</span><input type="text" value={orderEdit.customerName} onChange={(event) => setOrderEdit((prev) => ({ ...prev, customerName: event.target.value }))} /></label>
                    <label><span>SĐT</span><input type="text" value={orderEdit.customerPhone} onChange={(event) => setOrderEdit((prev) => ({ ...prev, customerPhone: event.target.value }))} /></label>
                    <label><span>Reservation</span><select value={orderEdit.reservationId} onChange={(event) => setOrderEdit((prev) => ({ ...prev, reservationId: event.target.value }))}><option value="">Không gắn</option>{reservations.map((reservation) => <option key={reservation.id} value={reservation.id}>{reservation.name}</option>)}</select></label>
                    <label><span>Bàn</span><select value={orderEdit.tableId} onChange={(event) => setOrderEdit((prev) => ({ ...prev, tableId: event.target.value }))}><option value="">Không gắn</option>{restaurantTables.map((table) => <option key={table.id} value={table.id}>{table.name}</option>)}</select></label>
                    <label><span>Order channel</span><select value={orderEdit.orderChannel} onChange={(event) => setOrderEdit((prev) => ({ ...prev, orderChannel: event.target.value }))}>{orderChannels.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
                    <label><span>Discount</span><input type="number" min="0" value={orderEdit.discountAmount} onChange={(event) => setOrderEdit((prev) => ({ ...prev, discountAmount: Number(event.target.value) }))} /></label>
                    <label><span>Service charge</span><input type="number" min="0" value={orderEdit.serviceCharge} onChange={(event) => setOrderEdit((prev) => ({ ...prev, serviceCharge: Number(event.target.value) }))} /></label>
                    <label className={styles.fullWidth}><span>Ghi chú</span><textarea rows={4} value={orderEdit.notes} onChange={(event) => setOrderEdit((prev) => ({ ...prev, notes: event.target.value }))} /></label>
                  </div>
                  <div className={styles.inlineAddRow}><select defaultValue="" onChange={(event) => { if (event.target.value) { addItemToState(event.target.value, setOrderEdit); event.target.value = ""; } }}><option value="">Thêm món vào order</option>{menuItems.filter((item) => item.isAvailable).map((item) => <option key={item.id} value={item.id}>{item.name} - {formatCurrency(item.price)}</option>)}</select></div>
                  <div className={styles.lineItemList}>{orderEdit.items.map((item, index) => <div key={`${item.menuItemId || item.id}-${index}`} className={styles.lineItemRow}><strong>{item.itemName}</strong><input type="number" min="1" value={item.quantity} onChange={(event) => updateLineItem(setOrderEdit, index, "quantity", event.target.value)} /><input type="number" min="0" value={item.unitPrice} onChange={(event) => updateLineItem(setOrderEdit, index, "unitPrice", event.target.value)} /><button type="button" onClick={() => removeLineItem(setOrderEdit, index)}>Xóa</button></div>)}</div>
                  <div className={styles.summaryRow}><span>Tạm tính: {formatCurrency(orderEditTotals.subtotal)}</span><span>Tổng: {formatCurrency(orderEditTotals.total)}</span></div>
                  <div className={styles.detailActions}><button type="button" className={styles.saveButton} onClick={saveOrderEdit} disabled={orderSaving}>{orderSaving ? "Đang lưu..." : "Lưu order"}</button></div>
                </div>
              ) : <div className={styles.emptyState}>Chưa có order.</div>}
            </div>
          </section>
        ) : null}

        {tab === "tables" ? (
          <section className={styles.adminGrid}>
            <div className={styles.listPanel}>
              <div className={styles.panelToolbar}><input type="search" placeholder="Tìm bàn..." value={tableQuery} onChange={(event) => setTableQuery(event.target.value)} /><div></div><button type="button" onClick={() => setTableCreateOpen((prev) => !prev)}>{tableCreateOpen ? "Đóng form" : "Tạo bàn"}</button></div>
              {tableCreateOpen ? <form className={styles.inlineForm} onSubmit={createTableEntry}><input type="text" placeholder="Tên bàn" value={tableDraft.name} onChange={(event) => setTableDraft((prev) => ({ ...prev, name: event.target.value }))} required /><input type="text" placeholder="Khu vực" value={tableDraft.area} onChange={(event) => setTableDraft((prev) => ({ ...prev, area: event.target.value }))} /><div className={styles.inlineRow}><input type="number" min="1" placeholder="Sức chứa" value={tableDraft.capacity} onChange={(event) => setTableDraft((prev) => ({ ...prev, capacity: Number(event.target.value) }))} /><select value={tableDraft.status} onChange={(event) => setTableDraft((prev) => ({ ...prev, status: event.target.value }))}>{tableStatuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></div><textarea placeholder="Ghi chú" rows={3} value={tableDraft.notes} onChange={(event) => setTableDraft((prev) => ({ ...prev, notes: event.target.value }))} /><button type="submit" disabled={tableSaving}>{tableSaving ? "Đang tạo..." : "Lưu bàn"}</button></form> : null}
              <div className={styles.tableWrap}><table className={styles.dataTable}><thead><tr><th>Bàn</th><th>Khu vực</th><th>Sức chứa</th><th>Trạng thái</th></tr></thead><tbody>{filteredTables.map((item) => <tr key={item.id} className={item.id === selectedTable?.id ? styles.activeRow : ""} onClick={() => setSelectedTableId(item.id)}><td><strong>{item.name}</strong><span>{formatCurrency(item.minSpend)}</span></td><td>{item.area}</td><td>{item.capacity}</td><td><span className={`${styles.statusBadge} ${styles[`status_${item.status}`] || styles.status_new}`}>{item.status}</span></td></tr>)}</tbody></table></div>
            </div>
            <div className={styles.detailPanel}>{selectedTable ? <div><div className={styles.detailHeading}><div><span className={styles.kicker}>Chi tiết bàn</span><h2>{selectedTable.name}</h2></div><button className={styles.deleteButton} type="button" onClick={() => deleteTableEntry(selectedTable.id)}>Xóa bàn</button></div><div className={styles.editGrid}><label><span>Tên bàn</span><input type="text" value={tableEdit.name} onChange={(event) => setTableEdit((prev) => ({ ...prev, name: event.target.value }))} /></label><label><span>Khu vực</span><input type="text" value={tableEdit.area} onChange={(event) => setTableEdit((prev) => ({ ...prev, area: event.target.value }))} /></label><label><span>Sức chứa</span><input type="number" min="1" value={tableEdit.capacity} onChange={(event) => setTableEdit((prev) => ({ ...prev, capacity: Number(event.target.value) }))} /></label><label><span>Trạng thái</span><select value={tableEdit.status} onChange={(event) => setTableEdit((prev) => ({ ...prev, status: event.target.value }))}>{tableStatuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></label><label className={styles.fullWidth}><span>Ghi chú</span><textarea rows={5} value={tableEdit.notes} onChange={(event) => setTableEdit((prev) => ({ ...prev, notes: event.target.value }))} /></label></div><div className={styles.detailActions}><button type="button" className={styles.saveButton} onClick={saveTableEdit} disabled={tableSaving}>{tableSaving ? "Đang lưu..." : "Lưu bàn"}</button></div></div> : <div className={styles.emptyState}>Chưa có bàn.</div>}</div>
          </section>
        ) : null}

        {tab === "menu" ? (
          <section className={styles.adminGrid}>
            <div className={styles.listPanel}>
              <div className={styles.panelToolbar}><input type="search" placeholder="Tìm món..." value={menuQuery} onChange={(event) => setMenuQuery(event.target.value)} /><div></div><button type="button" onClick={() => setMenuCreateOpen((prev) => !prev)}>{menuCreateOpen ? "Đóng form" : "Tạo món"}</button></div>
              {menuCreateOpen ? <form className={styles.inlineForm} onSubmit={createMenuItemEntry}><input type="text" placeholder="Tên món" value={menuDraft.name} onChange={(event) => setMenuDraft((prev) => ({ ...prev, name: event.target.value }))} required /><input type="text" placeholder="Danh mục" value={menuDraft.category} onChange={(event) => setMenuDraft((prev) => ({ ...prev, category: event.target.value }))} /><div className={styles.inlineRow}><input type="number" min="0" placeholder="Giá" value={menuDraft.price} onChange={(event) => setMenuDraft((prev) => ({ ...prev, price: Number(event.target.value) }))} /><select value={menuDraft.spicyLevel} onChange={(event) => setMenuDraft((prev) => ({ ...prev, spicyLevel: event.target.value }))}>{spicyLevels.map((item) => <option key={item} value={item}>{item}</option>)}</select></div><input type="text" placeholder="Image URL" value={menuDraft.imageUrl} onChange={(event) => setMenuDraft((prev) => ({ ...prev, imageUrl: event.target.value }))} /><textarea placeholder="Mô tả" rows={3} value={menuDraft.description} onChange={(event) => setMenuDraft((prev) => ({ ...prev, description: event.target.value }))} /><button type="submit" disabled={menuSaving}>{menuSaving ? "Đang tạo..." : "Lưu món"}</button></form> : null}
              <div className={styles.tableWrap}><table className={styles.dataTable}><thead><tr><th>Món</th><th>Danh mục</th><th>Giá</th><th>Trạng thái</th></tr></thead><tbody>{filteredMenuItems.map((item) => <tr key={item.id} className={item.id === selectedMenuItem?.id ? styles.activeRow : ""} onClick={() => setSelectedMenuId(item.id)}><td><strong>{item.name}</strong><span>{item.slug}</span></td><td>{item.category}</td><td>{formatCurrency(item.price)}</td><td><span className={`${styles.statusBadge} ${item.isAvailable ? styles.status_confirmed : styles.status_cancelled}`}>{item.isAvailable ? "available" : "hidden"}</span></td></tr>)}</tbody></table></div>
            </div>
            <div className={styles.detailPanel}>{selectedMenuItem ? <div><div className={styles.detailHeading}><div><span className={styles.kicker}>Chi tiết món ăn</span><h2>{selectedMenuItem.name}</h2></div><button className={styles.deleteButton} type="button" onClick={() => deleteMenuItemEntry(selectedMenuItem.id)}>Xóa món</button></div><div className={styles.editGrid}><label><span>Tên món</span><input type="text" value={menuEdit.name} onChange={(event) => setMenuEdit((prev) => ({ ...prev, name: event.target.value }))} /></label><label><span>Slug</span><input type="text" value={menuEdit.slug} onChange={(event) => setMenuEdit((prev) => ({ ...prev, slug: event.target.value }))} /></label><label><span>Danh mục</span><input type="text" value={menuEdit.category} onChange={(event) => setMenuEdit((prev) => ({ ...prev, category: event.target.value }))} /></label><label><span>Giá</span><input type="number" min="0" value={menuEdit.price} onChange={(event) => setMenuEdit((prev) => ({ ...prev, price: Number(event.target.value) }))} /></label><label><span>Image URL</span><input type="text" value={menuEdit.imageUrl} onChange={(event) => setMenuEdit((prev) => ({ ...prev, imageUrl: event.target.value }))} /></label><label><span>Available</span><select value={menuEdit.isAvailable ? "yes" : "no"} onChange={(event) => setMenuEdit((prev) => ({ ...prev, isAvailable: event.target.value === "yes" }))}><option value="yes">yes</option><option value="no">no</option></select></label><label><span>Featured</span><select value={menuEdit.isFeatured ? "yes" : "no"} onChange={(event) => setMenuEdit((prev) => ({ ...prev, isFeatured: event.target.value === "yes" }))}><option value="yes">yes</option><option value="no">no</option></select></label><label><span>Spicy level</span><select value={menuEdit.spicyLevel} onChange={(event) => setMenuEdit((prev) => ({ ...prev, spicyLevel: event.target.value }))}>{spicyLevels.map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label className={styles.fullWidth}><span>Mô tả</span><textarea rows={5} value={menuEdit.description} onChange={(event) => setMenuEdit((prev) => ({ ...prev, description: event.target.value }))} /></label></div><div className={styles.detailActions}><button type="button" className={styles.saveButton} onClick={saveMenuEdit} disabled={menuSaving}>{menuSaving ? "Đang lưu..." : "Lưu món"}</button></div></div> : <div className={styles.emptyState}>Chưa có món ăn.</div>}</div>
          </section>
        ) : null}

        {tab === "vouchers" ? (
          <section className={styles.adminGrid}>
            <div className={styles.listPanel}><div className={styles.panelToolbar}><input type="search" placeholder="Tìm voucher..." value={voucherQuery} onChange={(event) => setVoucherQuery(event.target.value)} /><select value={voucherStatus} onChange={(event) => setVoucherStatus(event.target.value)}>{voucherStatuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div><div className={styles.tableWrap}><table className={styles.dataTable}><thead><tr><th>SĐT</th><th>Nguồn</th><th>Trạng thái</th><th>Tạo lúc</th></tr></thead><tbody>{filteredVouchers.map((item) => <tr key={item.id} className={item.id === selectedVoucher?.id ? styles.activeRow : ""} onClick={() => setSelectedVoucherId(item.id)}><td>{item.phone}</td><td>{item.source}</td><td><span className={`${styles.statusBadge} ${styles[`status_${item.status}`] || styles.status_new}`}>{item.status}</span></td><td>{formatDate(item.createdAt)}</td></tr>)}</tbody></table></div></div>
            <div className={styles.detailPanel}>{selectedVoucher ? <div><div className={styles.detailHeading}><div><span className={styles.kicker}>Chi tiết voucher</span><h2>{selectedVoucher.phone}</h2></div><button className={styles.deleteButton} type="button" onClick={async () => { if (!window.confirm("Xóa lead voucher này?")) return; try { await requestJson(`/api/admin/vouchers/${selectedVoucher.id}`, { method: "DELETE" }); const next = vouchers.filter((item) => item.id !== selectedVoucher.id); setVouchers(next); setSelectedVoucherId(next[0]?.id || ""); setMessage("Đã xóa lead voucher."); } catch (error) { setMessage(error.message); } }}>Xóa lead</button></div><div className={styles.quickStatusRow}>{voucherStatuses.filter((item) => item.value !== "all").map((item) => <button type="button" key={item.value} className={selectedVoucher.status === item.value ? styles.quickActive : ""} onClick={() => patchVoucher(selectedVoucher.id, { ...selectedVoucher, status: item.value })}>{item.label}</button>)}</div><div className={styles.editGrid}><label className={styles.fullWidth}><span>Ghi chú</span><textarea rows={6} defaultValue={selectedVoucher.notes || ""} onBlur={(event) => patchVoucher(selectedVoucher.id, { ...selectedVoucher, notes: event.target.value })} /></label></div></div> : <div className={styles.emptyState}>Chưa có voucher.</div>}</div>
          </section>
        ) : null}

        {tab === "integrations" ? (
          <section className={styles.integrationLayout}><div className={styles.integrationList}>{integrations.map((item) => <button type="button" key={item.id} className={`${styles.integrationCard} ${item.id === selectedIntegration?.id ? styles.integrationCardActive : ""}`} onClick={() => setSelectedIntegrationId(item.id)}><div className={styles.integrationCardTop}><strong>{item.name}</strong><span className={`${styles.statusBadge} ${item.enabled ? styles.status_confirmed : styles.status_cancelled}`}>{item.enabled ? "enabled" : "disabled"}</span></div><small>{item.category.toUpperCase()} • {item.market}</small><p>{item.description}</p><span className={styles.integrationMeta}>{item.syncMode === "auto" ? "Tự động đồng bộ" : "Đồng bộ thủ công"}</span></button>)}</div><div className={styles.integrationDetail}>{selectedIntegration ? <div className={styles.detailPanel}><div className={styles.detailHeading}><div><span className={styles.kicker}>Tích hợp POS/PMS</span><h2>{selectedIntegration.name}</h2></div></div><div className={styles.editGrid}><label><span>Trạng thái</span><select defaultValue={selectedIntegration.enabled ? "enabled" : "disabled"} onBlur={(event) => patchIntegration(selectedIntegration.id, { enabled: event.target.value === "enabled" })}><option value="disabled">disabled</option><option value="enabled">enabled</option></select></label><label><span>Sync mode</span><select defaultValue={selectedIntegration.syncMode} onBlur={(event) => patchIntegration(selectedIntegration.id, { syncMode: event.target.value })}><option value="manual">manual</option><option value="auto">auto</option></select></label><label className={styles.fullWidth}><span>Endpoint</span><input type="url" defaultValue={selectedIntegration.endpoint} onBlur={(event) => patchIntegration(selectedIntegration.id, { endpoint: event.target.value })} /></label><label><span>API key</span><input type="text" defaultValue={selectedIntegration.apiKey} onBlur={(event) => patchIntegration(selectedIntegration.id, { apiKey: event.target.value })} /></label><label><span>API secret</span><input type="text" defaultValue={selectedIntegration.apiSecret} onBlur={(event) => patchIntegration(selectedIntegration.id, { apiSecret: event.target.value })} /></label><label><span>Location code</span><input type="text" defaultValue={selectedIntegration.locationCode} onBlur={(event) => patchIntegration(selectedIntegration.id, { locationCode: event.target.value })} /></label><label><span>Tenant code</span><input type="text" defaultValue={selectedIntegration.tenantCode} onBlur={(event) => patchIntegration(selectedIntegration.id, { tenantCode: event.target.value })} /></label><label className={styles.fullWidth}><span>Ghi chú</span><textarea rows={5} defaultValue={selectedIntegration.notes} onBlur={(event) => patchIntegration(selectedIntegration.id, { notes: event.target.value })} /></label></div></div> : null}<div className={styles.detailPanel}><div className={styles.detailHeading}><div><span className={styles.kicker}>Nhật ký đồng bộ</span><h2>Lịch sử sync gần đây</h2></div></div><div className={styles.logList}>{syncLogs.length ? syncLogs.slice(0, 12).map((log) => <article key={log.id} className={styles.logItem}><div className={styles.logHead}><strong>{log.integrationName}</strong><span className={`${styles.statusBadge} ${log.ok ? styles.status_confirmed : styles.status_cancelled}`}>{log.ok ? `OK ${log.status}` : `ERR ${log.status}`}</span></div><small>Reservation: {log.reservationId || "-"}</small><small>{formatDate(log.createdAt)}</small><p>{log.responsePreview || "Không có nội dung phản hồi."}</p></article>) : <div className={styles.emptyState}>Chưa có log đồng bộ.</div>}</div></div></div></section>
        ) : null}
      </div>
    </main>
  );
}
