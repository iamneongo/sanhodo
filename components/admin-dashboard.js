"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatVoucherBenefit } from "../lib/business-rules";
import { DASHBOARD_TABS, hasAdminPermission } from "../lib/admin-permissions";
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
const availabilityStatuses = ["available", "low_stock", "seasonal", "sold_out"];
const driverStatuses = ["active", "inactive", "blocked"];
const commissionStatuses = ["pending", "approved", "paid", "cancelled"];

const roleLabels = {
  admin: "Admin",
  manager: "Manager",
  staff: "Staff",
  super_admin: "Super Admin",
  branch_manager: "Branch Manager",
  driver: "Driver"
};

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

function formatPercent(value, total) {
  if (!total) return "0%";
  return `${Math.round((Number(value || 0) / Number(total || 1)) * 100)}%`;
}

function formatVoucherValue(voucher) {
  if (!voucher) return "-";
  if (voucher.voucherDiscountType === "amount") {
    return formatCurrency(voucher.voucherDiscountValue);
  }
  return `${voucher.voucherDiscountValue || 0}%`;
}

function isRecentItem(value, hours = 24) {
  if (!value) return false;
  const createdAt = new Date(value).getTime();
  if (Number.isNaN(createdAt)) return false;
  return Date.now() - createdAt <= hours * 60 * 60 * 1000;
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
    driverId: "",
    referralCode: "",
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
    driverId: order.driverId || "",
    referralCode: order.referralCode || "",
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
    availabilityStatus: "available",
    seasonNote: "",
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

function createEmptyCampaignDraft() {
  return {
    code: "",
    name: "",
    title: "",
    description: "",
    discountType: "percent",
    discountValue: 10,
    minOrderValue: 0,
    validDays: 14,
    usageLimitTotal: 0,
    usageLimitPerPhone: 1,
    autoIssue: true,
    isActive: true,
    startsAt: "",
    endsAt: "",
    sortOrder: 0
  };
}

function createEmptyDriverDraft() {
  return {
    code: "",
    fullName: "",
    phone: "",
    vehicleType: "Xe 4 chỗ",
    status: "active",
    referralCode: "",
    commissionRate: 5,
    notes: ""
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

function withBranchQuery(url, branchId) {
  if (!branchId) {
    return url;
  }

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}branchId=${encodeURIComponent(branchId)}`;
}

export default function AdminDashboard({
  initialBranches,
  initialReservations,
  initialVouchers,
  initialVoucherCampaigns,
  initialCustomerProfiles,
  initialVoucherRedemptions,
  initialDrivers,
  initialDriverReferrals,
  initialDriverCommissions,
  initialIntegrations,
  initialSyncLogs,
  initialMenuItems,
  initialTables,
  initialOrders,
  activeBranchId,
  canViewAllBranches,
  adminProfile
}) {
  const router = useRouter();
  const currentRole = adminProfile?.role || "admin";
  const branchFilterId = activeBranchId && activeBranchId !== "all" ? activeBranchId : "";
  const [tab, setTab] = useState("reservations");
  const [message, setMessage] = useState("");

  const [reservations, setReservations] = useState(sortByCreatedDesc(initialReservations));
  const [vouchers, setVouchers] = useState(sortByCreatedDesc(initialVouchers));
  const [voucherCampaigns, setVoucherCampaigns] = useState(
    sortByName(initialVoucherCampaigns || [], "title")
  );
  const [customerProfiles, setCustomerProfiles] = useState(
    sortByCreatedDesc(initialCustomerProfiles || [])
  );
  const [voucherRedemptions, setVoucherRedemptions] = useState(
    sortByCreatedDesc(initialVoucherRedemptions || [])
  );
  const [drivers, setDrivers] = useState(sortByName(initialDrivers || [], "fullName"));
  const [driverReferrals, setDriverReferrals] = useState(sortByCreatedDesc(initialDriverReferrals || []));
  const [driverCommissions, setDriverCommissions] = useState(
    sortByCreatedDesc(initialDriverCommissions || [])
  );
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
  const [driverQuery, setDriverQuery] = useState("");

  const [selectedReservationId, setSelectedReservationId] = useState(initialReservations[0]?.id || "");
  const [selectedVoucherId, setSelectedVoucherId] = useState(initialVouchers[0]?.id || "");
  const [selectedVoucherCampaignId, setSelectedVoucherCampaignId] = useState(
    initialVoucherCampaigns?.[0]?.id || ""
  );
  const [selectedDriverId, setSelectedDriverId] = useState(initialDrivers?.[0]?.id || "");
  const [selectedOrderId, setSelectedOrderId] = useState(initialOrders[0]?.id || "");
  const [selectedMenuId, setSelectedMenuId] = useState(initialMenuItems[0]?.id || "");
  const [selectedTableId, setSelectedTableId] = useState(initialTables[0]?.id || "");
  const [selectedIntegrationId, setSelectedIntegrationId] = useState(initialIntegrations[0]?.id || "");
  const selectedBranch =
    (initialBranches || []).find((item) => item.id === branchFilterId) ||
    (initialBranches || []).find((item) => item.code === adminProfile?.branch_code) ||
    (initialBranches || [])[0] ||
    null;

  const [manualOpen, setManualOpen] = useState(false);
  const [orderCreateOpen, setOrderCreateOpen] = useState(false);
  const [menuCreateOpen, setMenuCreateOpen] = useState(false);
  const [tableCreateOpen, setTableCreateOpen] = useState(false);
  const [campaignCreateOpen, setCampaignCreateOpen] = useState(false);
  const [driverCreateOpen, setDriverCreateOpen] = useState(false);

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
    driverId: "",
    referralCode: "",
    tableId: ""
  });
  const [orderDraft, setOrderDraft] = useState(createEmptyOrderDraft());
  const [orderEdit, setOrderEdit] = useState(createEmptyOrderDraft());
  const [menuDraft, setMenuDraft] = useState(createEmptyMenuDraft());
  const [menuEdit, setMenuEdit] = useState(createEmptyMenuDraft());
  const [tableDraft, setTableDraft] = useState(createEmptyTableDraft());
  const [tableEdit, setTableEdit] = useState(createEmptyTableDraft());
  const [campaignDraft, setCampaignDraft] = useState(createEmptyCampaignDraft());
  const [driverDraft, setDriverDraft] = useState(createEmptyDriverDraft());
  const [driverEdit, setDriverEdit] = useState(createEmptyDriverDraft());

  const selectedReservation = reservations.find((item) => item.id === selectedReservationId) || null;
  const selectedVoucher = vouchers.find((item) => item.id === selectedVoucherId) || null;
  const selectedVoucherCampaign =
    voucherCampaigns.find((item) => item.id === selectedVoucherCampaignId) || null;
  const selectedVoucherCustomer =
    customerProfiles.find(
      (item) =>
        item.id === selectedVoucher?.customerProfileId ||
        (selectedVoucher?.phone && item.phone === selectedVoucher.phone)
    ) || null;
  const selectedOrder = orders.find((item) => item.id === selectedOrderId) || null;
  const selectedDriver = drivers.find((item) => item.id === selectedDriverId) || null;
  const selectedMenuItem = menuItems.find((item) => item.id === selectedMenuId) || null;
  const selectedTable = restaurantTables.find((item) => item.id === selectedTableId) || null;
  const selectedIntegration = integrations.find((item) => item.id === selectedIntegrationId) || null;
  const permissions = useMemo(
    () => ({
      canExport: hasAdminPermission(currentRole, "dashboard.export"),
      canManageReservations: hasAdminPermission(currentRole, "reservations.manage"),
      canManageOrders: hasAdminPermission(currentRole, "orders.manage"),
      canManageTables: hasAdminPermission(currentRole, "tables.manage"),
      canManageMenu: hasAdminPermission(currentRole, "menu.manage"),
      canManageVouchers: hasAdminPermission(currentRole, "vouchers.manage"),
      canViewDrivers: hasAdminPermission(currentRole, "drivers.view"),
      canManageDrivers: hasAdminPermission(currentRole, "drivers.manage"),
      canManageDriverCommissions: hasAdminPermission(currentRole, "drivers.commission"),
      canViewIntegrations: hasAdminPermission(currentRole, "integrations.view"),
      canManageIntegrations: hasAdminPermission(currentRole, "integrations.manage"),
      canSyncIntegrations: hasAdminPermission(currentRole, "integrations.sync")
    }),
    [currentRole]
  );
  const visibleTabs = useMemo(
    () =>
      Object.entries(DASHBOARD_TABS)
        .filter(([, permission]) => hasAdminPermission(currentRole, permission))
        .map(([key]) => key),
    [currentRole]
  );
  const attachBranchToPayload = (payload) => ({
    ...payload,
    branchId: payload?.branchId || branchFilterId || ""
  });

  useEffect(() => {
    setOrderEdit(cloneOrder(selectedOrder));
  }, [selectedOrderId, selectedOrder]);

  useEffect(() => {
    setMenuEdit(selectedMenuItem ? { ...selectedMenuItem } : createEmptyMenuDraft());
  }, [selectedMenuId, selectedMenuItem]);

  useEffect(() => {
    setTableEdit(selectedTable ? { ...selectedTable } : createEmptyTableDraft());
  }, [selectedTableId, selectedTable]);

  useEffect(() => {
    setDriverEdit(selectedDriver ? { ...selectedDriver } : createEmptyDriverDraft());
  }, [selectedDriverId, selectedDriver]);

  useEffect(() => {
    if (!selectedVoucherCampaignId && voucherCampaigns.length) {
      setSelectedVoucherCampaignId(voucherCampaigns[0].id);
    }
  }, [selectedVoucherCampaignId, voucherCampaigns]);

  useEffect(() => {
    if (!visibleTabs.includes(tab) && visibleTabs.length) {
      setTab(visibleTabs[0]);
    }
  }, [tab, visibleTabs]);

  const handleBranchChange = (event) => {
    const nextBranchId = event.target.value;
    const params = new URLSearchParams(window.location.search);
    if (!nextBranchId || nextBranchId === "all") {
      params.delete("branch");
    } else {
      params.set("branch", nextBranchId);
    }
    const query = params.toString();
    router.replace(query ? `/admin?${query}` : "/admin");
    router.refresh();
  };

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
        return statusMatch && matchesSearch(item, voucherQuery, ["phone", "notes", "source", "voucherCode", "voucherTitle"]);
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

  const filteredDrivers = useMemo(
    () =>
      drivers.filter((item) =>
        matchesSearch(item, driverQuery, ["fullName", "phone", "referralCode", "code", "vehicleType"])
      ),
    [drivers, driverQuery]
  );

  const findTableName = (tableId) => restaurantTables.find((item) => item.id === tableId)?.name || "-";
  const findReservationName = (reservationId) => reservations.find((item) => item.id === reservationId)?.name || "-";
  const findDriverName = (driverId) => drivers.find((item) => item.id === driverId)?.fullName || "-";

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
        body: JSON.stringify(attachBranchToPayload(payload))
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
        body: JSON.stringify(attachBranchToPayload(payload))
      });
      setVouchers((prev) => sortByCreatedDesc(prev.map((item) => (item.id === id ? data.data : item))));
      setMessage("Đã cập nhật voucher.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setVoucherSaving(false);
    }
  };

  const createVoucherCampaignEntry = async (event) => {
    event.preventDefault();
    setVoucherSaving(true);
    setMessage("");
    try {
      const data = await requestJson(withBranchQuery("/api/admin/voucher-campaigns", branchFilterId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attachBranchToPayload(campaignDraft))
      });
      setVoucherCampaigns((prev) => sortByName([data.data, ...prev], "title"));
      setSelectedVoucherCampaignId(data.data.id);
      setCampaignDraft(createEmptyCampaignDraft());
      setCampaignCreateOpen(false);
      setMessage("Đã tạo campaign voucher.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setVoucherSaving(false);
    }
  };

  const patchVoucherCampaign = async (id, payload) => {
    setVoucherSaving(true);
    setMessage("");
    try {
      const data = await requestJson(`/api/admin/voucher-campaigns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attachBranchToPayload(payload))
      });
      setVoucherCampaigns((prev) =>
        sortByName(prev.map((item) => (item.id === id ? data.data : item)), "title")
      );
      setMessage("Đã cập nhật campaign voucher.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setVoucherSaving(false);
    }
  };

  const deleteVoucherCampaignEntry = async (id) => {
    if (!window.confirm("Xóa campaign voucher này?")) return;
    try {
      await requestJson(`/api/admin/voucher-campaigns/${id}`, { method: "DELETE" });
      const next = voucherCampaigns.filter((item) => item.id !== id);
      setVoucherCampaigns(next);
      setSelectedVoucherCampaignId(next[0]?.id || "");
      setMessage("Đã xóa campaign voucher.");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const redeemVoucher = async (voucher) => {
    const spendInput = window.prompt("Nhập tổng hóa đơn để redeem voucher và cộng loyalty points", "1500000");
    if (spendInput === null) return;

    setVoucherSaving(true);
    setMessage("");
    try {
      const data = await requestJson(`/api/admin/vouchers/${voucher.id}/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId: voucher.branchId || branchFilterId || "",
          spendAmount: Number(String(spendInput).replace(/[^\d]/g, "")) || 0,
          notes: voucher.notes || ""
        })
      });
      if (data.data?.voucher) {
        setVouchers((prev) =>
          sortByCreatedDesc(prev.map((item) => (item.id === voucher.id ? data.data.voucher : item)))
        );
      }
      if (data.data?.customer) {
        setCustomerProfiles((prev) => {
          const exists = prev.some((item) => item.id === data.data.customer.id);
          const next = exists
            ? prev.map((item) => (item.id === data.data.customer.id ? data.data.customer : item))
            : [data.data.customer, ...prev];
          return sortByCreatedDesc(next);
        });
      }
      if (data.data?.redemption) {
        setVoucherRedemptions((prev) => sortByCreatedDesc([data.data.redemption, ...prev]));
      }
      setMessage("Đã redeem voucher và cập nhật loyalty.");
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
      const data = await requestJson(withBranchQuery("/api/admin/reservations", branchFilterId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attachBranchToPayload({ ...manualForm, status: "confirmed", source: "admin-manual" }))
      });
      setReservations((prev) => sortByCreatedDesc([data.data, ...prev]));
      setSelectedReservationId(data.data.id);
      setManualOpen(false);
      setManualForm({
        name: "",
        phone: "",
        guests: "2",
        datetime: "",
        selectedOffer: "",
        notes: "",
        assignedTo: "",
        driverId: "",
        referralCode: "",
        tableId: ""
      });
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
      const data = await requestJson(withBranchQuery("/api/admin/orders", branchFilterId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attachBranchToPayload(orderDraft))
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
        body: JSON.stringify(attachBranchToPayload(orderEdit))
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
      const data = await requestJson(withBranchQuery("/api/admin/menu-items", branchFilterId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attachBranchToPayload(menuDraft))
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
        body: JSON.stringify(attachBranchToPayload(menuEdit))
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
      const data = await requestJson(withBranchQuery("/api/admin/tables", branchFilterId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attachBranchToPayload(tableDraft))
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
        body: JSON.stringify(attachBranchToPayload(tableEdit))
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

  const createDriverEntry = async (event) => {
    event.preventDefault();
    setTableSaving(true);
    setMessage("");
    try {
      const data = await requestJson(withBranchQuery("/api/admin/drivers", branchFilterId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attachBranchToPayload(driverDraft))
      });
      setDrivers((prev) => sortByName([data.data, ...prev], "fullName"));
      setSelectedDriverId(data.data.id);
      setDriverDraft(createEmptyDriverDraft());
      setDriverCreateOpen(false);
      setMessage("Đã tạo tài xế mới.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setTableSaving(false);
    }
  };

  const saveDriverEdit = async () => {
    if (!selectedDriver) return;
    setTableSaving(true);
    setMessage("");
    try {
      const data = await requestJson(`/api/admin/drivers/${selectedDriver.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attachBranchToPayload(driverEdit))
      });
      setDrivers((prev) => sortByName(prev.map((item) => (item.id === selectedDriver.id ? data.data : item)), "fullName"));
      setMessage("Đã cập nhật tài xế.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setTableSaving(false);
    }
  };

  const deleteDriverEntry = async (id) => {
    if (!window.confirm("Xóa tài xế này?")) return;
    try {
      await requestJson(`/api/admin/drivers/${id}`, { method: "DELETE" });
      const next = drivers.filter((item) => item.id !== id);
      setDrivers(next);
      setSelectedDriverId(next[0]?.id || "");
      setMessage("Đã xóa tài xế.");
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
        body: JSON.stringify(attachBranchToPayload(payload))
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
      const logData = await requestJson(withBranchQuery("/api/admin/integrations/logs", branchFilterId));
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
    featured: menuItems.filter((item) => item.isFeatured).length,
    seasonal: menuItems.filter((item) => item.availabilityStatus === "seasonal").length,
    lowStock: menuItems.filter((item) => item.availabilityStatus === "low_stock").length
  };
  const tableStats = {
    total: restaurantTables.length,
    available: restaurantTables.filter((item) => item.status === "available").length
  };
  const voucherStats = {
    total: vouchers.length,
    activeCodes: vouchers.filter((item) => item.voucherCode).length,
    recent: vouchers.filter((item) => isRecentItem(item.createdAt, 24)).length,
    campaigns: voucherCampaigns.filter((item) => item.isActive).length,
    redeemed: vouchers.filter((item) => item.status === "used").length
  };
  const loyaltyStats = {
    members: customerProfiles.length,
    totalPoints: customerProfiles.reduce((sum, item) => sum + Number(item.loyaltyPoints || 0), 0),
    totalSpent: customerProfiles.reduce((sum, item) => sum + Number(item.totalSpent || 0), 0),
    redemptions: voucherRedemptions.length
  };
  const driverStats = {
    total: drivers.length,
    active: drivers.filter((item) => item.status === "active").length,
    pendingCommissions: driverCommissions.filter((item) => item.status === "pending").length,
    commissionValue: driverCommissions.reduce((sum, item) => sum + Number(item.commissionAmount || 0), 0)
  };
  const notificationFeed = sortByCreatedDesc([
    ...reservations
      .filter((item) => isRecentItem(item.createdAt, 24))
      .map((item) => ({
        id: `reservation-${item.id}`,
        type: "reservation",
        title: `${item.name} vừa tạo lead đặt bàn`,
        subtitle: `${item.guests} khách • ${formatDate(item.datetime)}`,
        createdAt: item.createdAt,
        status: item.status
      })),
    ...orders
      .filter((item) => isRecentItem(item.createdAt, 24))
      .map((item) => ({
        id: `order-${item.id}`,
        type: "order",
        title: `${item.customerName} vừa gửi order`,
        subtitle: `${item.items.length} món • ${formatCurrency(item.totalAmount)}`,
        createdAt: item.createdAt,
        status: item.status
      })),
    ...vouchers
      .filter((item) => isRecentItem(item.createdAt, 24))
      .map((item) => ({
        id: `voucher-${item.id}`,
        type: "voucher",
        title: `${item.phone} vừa nhận voucher`,
        subtitle: item.voucherCode || "Lead voucher mới",
        createdAt: item.createdAt,
        status: item.status
      }))
  ]).slice(0, 8);
  const topSellingItems = useMemo(() => {
    const totals = new Map();

    orders.forEach((order) => {
      (order.items || []).forEach((item) => {
        const current = totals.get(item.itemName) || { quantity: 0, revenue: 0 };
        totals.set(item.itemName, {
          quantity: current.quantity + Number(item.quantity || 0),
          revenue: current.revenue + Number(item.lineTotal || 0)
        });
      });
    });

    return [...totals.entries()]
      .map(([name, metrics]) => ({ name, ...metrics }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [orders]);
  const reservationConversion = {
    confirmed: reservations.filter((item) => item.status === "confirmed").length,
    arrived: reservations.filter((item) => item.status === "arrived").length
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
            <p>
              Quản lý đặt bàn, order, bàn, món, voucher và tích hợp trong cùng một dashboard.
              {selectedBranch ? ` Đang xem dữ liệu cho ${selectedBranch.name}.` : ""}
            </p>
          </div>
          <div className={styles.topbarActions}>
            <span className={styles.adminBadge}>
              {adminProfile?.full_name || adminProfile?.email || "Admin"} •{" "}
              {roleLabels[adminProfile?.role] || adminProfile?.role || "Admin"}
            </span>
            {(initialBranches || []).length ? (
              <label className={styles.branchControl}>
                <span>Chi nhánh</span>
                <select
                  value={activeBranchId || "all"}
                  onChange={handleBranchChange}
                  disabled={!canViewAllBranches && Boolean(selectedBranch)}
                >
                  {canViewAllBranches ? <option value="all">Tất cả chi nhánh</option> : null}
                  {(initialBranches || []).map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.shortName || branch.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            {permissions.canExport ? <a className={styles.exportButton} href={withBranchQuery("/api/admin/export?type=reservations", branchFilterId)}>Export đặt bàn</a> : null}
            {permissions.canExport ? <a className={styles.exportButton} href={withBranchQuery("/api/admin/export?type=vouchers", branchFilterId)}>Export voucher</a> : null}
            {permissions.canExport ? <a className={styles.exportButton} href={withBranchQuery("/api/admin/export?type=driver-commissions", branchFilterId)}>Export hoa hồng</a> : null}
            <button className={styles.logoutButton} type="button" onClick={logout}>Đăng xuất</button>
          </div>
        </header>

        <section className={styles.statsGrid}>
          <article className={styles.statCard}><span>Đặt bàn</span><strong>{reservationStats.total}</strong><small>{reservationStats.pending} lead đang chờ xử lý</small></article>
          <article className={styles.statCard}><span>Orders</span><strong>{orderStats.total}</strong><small>{orderStats.active} order đang phục vụ</small></article>
          <article className={styles.statCard}><span>Thực đơn</span><strong>{menuStats.total}</strong><small>{menuStats.featured} món featured • {menuStats.lowStock} món cần chú ý</small></article>
          <article className={styles.statCard}><span>Bàn</span><strong>{tableStats.total}</strong><small>{tableStats.available} bàn còn trống</small></article>
          <article className={styles.statCard}><span>Voucher</span><strong>{voucherStats.total}</strong><small>{voucherStats.activeCodes} mã đã phát • {voucherStats.recent} lead trong 24h</small></article>
          <article className={styles.statCard}><span>Tài xế</span><strong>{driverStats.total}</strong><small>{driverStats.active} đang hoạt động • {driverStats.pendingCommissions} pending</small></article>
        </section>

        <section className={styles.insightsGrid}>
          <article className={styles.insightCard}>
            <div className={styles.insightHead}>
              <div>
                <span className={styles.kicker}>Thông báo mới</span>
                <h2>Lead trong 24 giờ gần nhất</h2>
              </div>
            </div>
            <div className={styles.notificationList}>
              {notificationFeed.length ? (
                notificationFeed.map((item) => (
                  <article key={item.id} className={styles.notificationItem}>
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.subtitle}</p>
                    </div>
                    <div className={styles.notificationMeta}>
                      <span className={`${styles.statusBadge} ${styles[`status_${item.status}`] || styles.status_new}`}>{item.status}</span>
                      <small>{formatDate(item.createdAt)}</small>
                    </div>
                  </article>
                ))
              ) : (
                <div className={styles.emptyState}>Chưa có lead mới trong 24 giờ gần nhất.</div>
              )}
            </div>
          </article>

          <article className={styles.insightCard}>
            <div className={styles.insightHead}>
              <div>
                <span className={styles.kicker}>Analytics cơ bản</span>
                <h2>Top món và tình trạng thực đơn</h2>
              </div>
            </div>
            <div className={styles.metricStack}>
              {topSellingItems.length ? (
                topSellingItems.map((item) => (
                  <div key={item.name} className={styles.metricRow}>
                    <div>
                      <strong>{item.name}</strong>
                      <p>{item.quantity} phần đã bán</p>
                    </div>
                    <span>{formatCurrency(item.revenue)}</span>
                  </div>
                ))
              ) : (
                <div className={styles.emptyState}>Chưa có dữ liệu order đủ để tính top món.</div>
              )}
            </div>
            <div className={styles.metricSummary}>
              <span>{menuStats.seasonal} món đang theo mùa</span>
              <span>{menuStats.lowStock} món số lượng giới hạn</span>
            </div>
          </article>
        </section>

        <section className={styles.tabBar}>
          {visibleTabs.map((key) => (
            <button key={key} type="button" className={tab === key ? styles.activeTab : ""} onClick={() => setTab(key)}>
              <span>
                {key === "reservations"
                  ? "Đặt bàn"
                  : key === "orders"
                    ? "Đặt món / Orders"
                    : key === "tables"
                      ? "Bàn"
                      : key === "menu"
                        ? "Món ăn"
                        : key === "vouchers"
                          ? "Voucher"
                          : key === "drivers"
                            ? "Tài xế / Referral"
                            : "Tích hợp POS/PMS"}
              </span>
              {key === "reservations" && reservationStats.pending ? <small>{reservationStats.pending}</small> : null}
              {key === "orders" && orderStats.active ? <small>{orderStats.active}</small> : null}
              {key === "vouchers" && voucherStats.recent ? <small>{voucherStats.recent}</small> : null}
              {key === "drivers" && driverStats.pendingCommissions ? <small>{driverStats.pendingCommissions}</small> : null}
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
                {permissions.canManageReservations ? <button type="button" onClick={() => setManualOpen((prev) => !prev)}>{manualOpen ? "Đóng form" : "Thêm đặt bàn"}</button> : <div></div>}
              </div>

              {manualOpen && permissions.canManageReservations ? (
                <form className={styles.inlineForm} onSubmit={createManualReservation}>
                  <input type="text" placeholder="Tên khách" value={manualForm.name} onChange={(event) => setManualForm((prev) => ({ ...prev, name: event.target.value }))} required />
                  <input type="tel" placeholder="SĐT" value={manualForm.phone} onChange={(event) => setManualForm((prev) => ({ ...prev, phone: event.target.value }))} required />
                  <div className={styles.inlineRow}>
                    <input type="text" placeholder="Số khách" value={manualForm.guests} onChange={(event) => setManualForm((prev) => ({ ...prev, guests: event.target.value }))} required />
                    <input type="datetime-local" value={manualForm.datetime} onChange={(event) => setManualForm((prev) => ({ ...prev, datetime: event.target.value }))} required />
                  </div>
                  <div className={styles.inlineRow}>
                    <select value={manualForm.driverId} onChange={(event) => setManualForm((prev) => ({ ...prev, driverId: event.target.value }))}>
                      <option value="">Chưa gán tài xế</option>
                      {drivers.map((driver) => <option key={driver.id} value={driver.id}>{driver.fullName}</option>)}
                    </select>
                    <input type="text" placeholder="Mã giới thiệu" value={manualForm.referralCode} onChange={(event) => setManualForm((prev) => ({ ...prev, referralCode: event.target.value }))} />
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
                    {permissions.canManageReservations ? <button className={styles.deleteButton} type="button" onClick={() => deleteReservation(selectedReservation.id)}>Xóa lead</button> : null}
                  </div>
                  {permissions.canManageReservations ? <div className={styles.quickStatusRow}>{reservationStatuses.filter((item) => item.value !== "all").map((item) => <button type="button" key={item.value} className={selectedReservation.status === item.value ? styles.quickActive : ""} onClick={() => patchReservation(selectedReservation.id, { ...selectedReservation, status: item.value })}>{item.label}</button>)}</div> : null}
                  <div className={styles.editGrid}>
                    <label><span>SĐT</span><input type="text" defaultValue={selectedReservation.phone} disabled={!permissions.canManageReservations} onBlur={(event) => patchReservation(selectedReservation.id, { ...selectedReservation, phone: event.target.value })} /></label>
                    <label><span>Số khách</span><input type="text" defaultValue={selectedReservation.guests} disabled={!permissions.canManageReservations} onBlur={(event) => patchReservation(selectedReservation.id, { ...selectedReservation, guests: event.target.value })} /></label>
                    <label><span>Thời gian</span><input type="datetime-local" defaultValue={selectedReservation.datetime} disabled={!permissions.canManageReservations} onBlur={(event) => patchReservation(selectedReservation.id, { ...selectedReservation, datetime: event.target.value })} /></label>
                    <label><span>Gán bàn</span><select defaultValue={selectedReservation.tableId || ""} disabled={!permissions.canManageReservations} onBlur={(event) => patchReservation(selectedReservation.id, { ...selectedReservation, tableId: event.target.value })}><option value="">Chưa gán bàn</option>{restaurantTables.map((table) => <option key={table.id} value={table.id}>{table.name}</option>)}</select></label>
                    <label className={styles.fullWidth}><span>Ghi chú</span><textarea rows={5} defaultValue={selectedReservation.notes || ""} disabled={!permissions.canManageReservations} onBlur={(event) => patchReservation(selectedReservation.id, { ...selectedReservation, notes: event.target.value })} /></label>
                  </div>
                  {permissions.canViewIntegrations ? <div className={styles.syncBox}><div><span className={styles.kicker}>Sync POS/PMS</span><p>Đồng bộ lead này sang hệ POS/PMS.</p></div><div className={styles.syncActions}><select value={selectedIntegrationId} disabled={!permissions.canManageIntegrations} onChange={(event) => setSelectedIntegrationId(event.target.value)}>{integrations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>{permissions.canSyncIntegrations ? <button type="button" onClick={() => syncReservation(selectedReservation.id, selectedIntegrationId)} disabled={integrationSaving}>{integrationSaving ? "Đang sync..." : "Sync ngay"}</button> : null}</div></div> : null}
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
                {permissions.canManageOrders ? <button type="button" onClick={() => setOrderCreateOpen((prev) => !prev)}>{orderCreateOpen ? "Đóng form" : "Tạo order"}</button> : <div></div>}
              </div>

              {orderCreateOpen && permissions.canManageOrders ? (
                <form className={styles.inlineForm} onSubmit={createManualOrder}>
                  <input type="text" placeholder="Tên khách" value={orderDraft.customerName} onChange={(event) => setOrderDraft((prev) => ({ ...prev, customerName: event.target.value }))} required />
                  <input type="tel" placeholder="SĐT" value={orderDraft.customerPhone} onChange={(event) => setOrderDraft((prev) => ({ ...prev, customerPhone: event.target.value }))} required />
                  <div className={styles.inlineRow}>
                    <select value={orderDraft.tableId} onChange={(event) => setOrderDraft((prev) => ({ ...prev, tableId: event.target.value }))}><option value="">Chọn bàn</option>{restaurantTables.map((table) => <option key={table.id} value={table.id}>{table.name}</option>)}</select>
                    <select value={orderDraft.orderChannel} onChange={(event) => setOrderDraft((prev) => ({ ...prev, orderChannel: event.target.value }))}>{orderChannels.map((item) => <option key={item} value={item}>{item}</option>)}</select>
                  </div>
                  <div className={styles.inlineRow}>
                    <select value={orderDraft.driverId} onChange={(event) => setOrderDraft((prev) => ({ ...prev, driverId: event.target.value }))}>
                      <option value="">Chưa gán tài xế</option>
                      {drivers.map((driver) => <option key={driver.id} value={driver.id}>{driver.fullName}</option>)}
                    </select>
                    <input type="text" placeholder="Mã giới thiệu" value={orderDraft.referralCode} onChange={(event) => setOrderDraft((prev) => ({ ...prev, referralCode: event.target.value }))} />
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
                  <div className={styles.detailHeading}><div><span className={styles.kicker}>Chi tiết order</span><h2>{selectedOrder.customerName}</h2></div>{permissions.canManageOrders ? <button className={styles.deleteButton} type="button" onClick={() => deleteOrder(selectedOrder.id)}>Xóa order</button> : null}</div>
                  {permissions.canManageOrders ? <div className={styles.quickStatusRow}>{orderStatuses.filter((item) => item.value !== "all").map((item) => <button type="button" key={item.value} className={orderEdit.status === item.value ? styles.quickActive : ""} onClick={() => setOrderEdit((prev) => ({ ...prev, status: item.value }))}>{item.label}</button>)}</div> : null}
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
                  {permissions.canManageOrders ? <div className={styles.detailActions}><button type="button" className={styles.saveButton} onClick={saveOrderEdit} disabled={orderSaving}>{orderSaving ? "Đang lưu..." : "Lưu order"}</button></div> : null}
                </div>
              ) : <div className={styles.emptyState}>Chưa có order.</div>}
            </div>
          </section>
        ) : null}

        {tab === "tables" ? (
          <section className={styles.adminGrid}>
            <div className={styles.listPanel}>
              <div className={styles.panelToolbar}><input type="search" placeholder="Tìm bàn..." value={tableQuery} onChange={(event) => setTableQuery(event.target.value)} /><div></div>{permissions.canManageTables ? <button type="button" onClick={() => setTableCreateOpen((prev) => !prev)}>{tableCreateOpen ? "Đóng form" : "Tạo bàn"}</button> : <div></div>}</div>
              {tableCreateOpen && permissions.canManageTables ? <form className={styles.inlineForm} onSubmit={createTableEntry}><input type="text" placeholder="Tên bàn" value={tableDraft.name} onChange={(event) => setTableDraft((prev) => ({ ...prev, name: event.target.value }))} required /><input type="text" placeholder="Khu vực" value={tableDraft.area} onChange={(event) => setTableDraft((prev) => ({ ...prev, area: event.target.value }))} /><div className={styles.inlineRow}><input type="number" min="1" placeholder="Sức chứa" value={tableDraft.capacity} onChange={(event) => setTableDraft((prev) => ({ ...prev, capacity: Number(event.target.value) }))} /><select value={tableDraft.status} onChange={(event) => setTableDraft((prev) => ({ ...prev, status: event.target.value }))}>{tableStatuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></div><textarea placeholder="Ghi chú" rows={3} value={tableDraft.notes} onChange={(event) => setTableDraft((prev) => ({ ...prev, notes: event.target.value }))} /><button type="submit" disabled={tableSaving}>{tableSaving ? "Đang tạo..." : "Lưu bàn"}</button></form> : null}
              <div className={styles.tableWrap}><table className={styles.dataTable}><thead><tr><th>Bàn</th><th>Khu vực</th><th>Sức chứa</th><th>Trạng thái</th></tr></thead><tbody>{filteredTables.map((item) => <tr key={item.id} className={item.id === selectedTable?.id ? styles.activeRow : ""} onClick={() => setSelectedTableId(item.id)}><td><strong>{item.name}</strong><span>{formatCurrency(item.minSpend)}</span></td><td>{item.area}</td><td>{item.capacity}</td><td><span className={`${styles.statusBadge} ${styles[`status_${item.status}`] || styles.status_new}`}>{item.status}</span></td></tr>)}</tbody></table></div>
            </div>
            <div className={styles.detailPanel}>{selectedTable ? <div><div className={styles.detailHeading}><div><span className={styles.kicker}>Chi tiết bàn</span><h2>{selectedTable.name}</h2></div>{permissions.canManageTables ? <button className={styles.deleteButton} type="button" onClick={() => deleteTableEntry(selectedTable.id)}>Xóa bàn</button> : null}</div><div className={styles.editGrid}><label><span>Tên bàn</span><input type="text" value={tableEdit.name} disabled={!permissions.canManageTables} onChange={(event) => setTableEdit((prev) => ({ ...prev, name: event.target.value }))} /></label><label><span>Khu vực</span><input type="text" value={tableEdit.area} disabled={!permissions.canManageTables} onChange={(event) => setTableEdit((prev) => ({ ...prev, area: event.target.value }))} /></label><label><span>Sức chứa</span><input type="number" min="1" value={tableEdit.capacity} disabled={!permissions.canManageTables} onChange={(event) => setTableEdit((prev) => ({ ...prev, capacity: Number(event.target.value) }))} /></label><label><span>Trạng thái</span><select value={tableEdit.status} disabled={!permissions.canManageTables} onChange={(event) => setTableEdit((prev) => ({ ...prev, status: event.target.value }))}>{tableStatuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></label><label className={styles.fullWidth}><span>Ghi chú</span><textarea rows={5} value={tableEdit.notes} disabled={!permissions.canManageTables} onChange={(event) => setTableEdit((prev) => ({ ...prev, notes: event.target.value }))} /></label></div>{permissions.canManageTables ? <div className={styles.detailActions}><button type="button" className={styles.saveButton} onClick={saveTableEdit} disabled={tableSaving}>{tableSaving ? "Đang lưu..." : "Lưu bàn"}</button></div> : null}</div> : <div className={styles.emptyState}>Chưa có bàn.</div>}</div>
          </section>
        ) : null}

        {tab === "menu" ? (
          <section className={styles.adminGrid}>
            <div className={styles.listPanel}>
              <div className={styles.panelToolbar}><input type="search" placeholder="Tìm món..." value={menuQuery} onChange={(event) => setMenuQuery(event.target.value)} /><div></div>{permissions.canManageMenu ? <button type="button" onClick={() => setMenuCreateOpen((prev) => !prev)}>{menuCreateOpen ? "Đóng form" : "Tạo món"}</button> : <div></div>}</div>
              {menuCreateOpen && permissions.canManageMenu ? <form className={styles.inlineForm} onSubmit={createMenuItemEntry}><input type="text" placeholder="Tên món" value={menuDraft.name} onChange={(event) => setMenuDraft((prev) => ({ ...prev, name: event.target.value }))} required /><input type="text" placeholder="Danh mục" value={menuDraft.category} onChange={(event) => setMenuDraft((prev) => ({ ...prev, category: event.target.value }))} /><div className={styles.inlineRow}><input type="number" min="0" placeholder="Giá" value={menuDraft.price} onChange={(event) => setMenuDraft((prev) => ({ ...prev, price: Number(event.target.value) }))} /><select value={menuDraft.spicyLevel} onChange={(event) => setMenuDraft((prev) => ({ ...prev, spicyLevel: event.target.value }))}>{spicyLevels.map((item) => <option key={item} value={item}>{item}</option>)}</select></div><div className={styles.inlineRow}><select value={menuDraft.availabilityStatus} onChange={(event) => setMenuDraft((prev) => ({ ...prev, availabilityStatus: event.target.value }))}>{availabilityStatuses.map((item) => <option key={item} value={item}>{item}</option>)}</select><select value={menuDraft.isFeatured ? "yes" : "no"} onChange={(event) => setMenuDraft((prev) => ({ ...prev, isFeatured: event.target.value === "yes" }))}><option value="yes">featured</option><option value="no">normal</option></select></div><input type="text" placeholder="Image URL" value={menuDraft.imageUrl} onChange={(event) => setMenuDraft((prev) => ({ ...prev, imageUrl: event.target.value }))} /><textarea placeholder="Ghi chú theo mùa / tồn kho" rows={2} value={menuDraft.seasonNote} onChange={(event) => setMenuDraft((prev) => ({ ...prev, seasonNote: event.target.value }))} /><textarea placeholder="Mô tả" rows={3} value={menuDraft.description} onChange={(event) => setMenuDraft((prev) => ({ ...prev, description: event.target.value }))} /><button type="submit" disabled={menuSaving}>{menuSaving ? "Đang tạo..." : "Lưu món"}</button></form> : null}
              <div className={styles.tableWrap}><table className={styles.dataTable}><thead><tr><th>Món</th><th>Danh mục</th><th>Giá</th><th>Trạng thái</th></tr></thead><tbody>{filteredMenuItems.map((item) => <tr key={item.id} className={item.id === selectedMenuItem?.id ? styles.activeRow : ""} onClick={() => setSelectedMenuId(item.id)}><td><strong>{item.name}</strong><span>{item.slug}</span></td><td>{item.category}</td><td>{formatCurrency(item.price)}</td><td><span className={`${styles.statusBadge} ${styles[`status_${item.availabilityStatus || (item.isAvailable ? "confirmed" : "cancelled")}`] || styles.status_confirmed}`}>{item.availabilityStatus || (item.isAvailable ? "available" : "hidden")}</span></td></tr>)}</tbody></table></div>
            </div>
            <div className={styles.detailPanel}>{selectedMenuItem ? <div><div className={styles.detailHeading}><div><span className={styles.kicker}>Chi tiết món ăn</span><h2>{selectedMenuItem.name}</h2></div>{permissions.canManageMenu ? <button className={styles.deleteButton} type="button" onClick={() => deleteMenuItemEntry(selectedMenuItem.id)}>Xóa món</button> : null}</div><div className={styles.editGrid}><label><span>Tên món</span><input type="text" value={menuEdit.name} disabled={!permissions.canManageMenu} onChange={(event) => setMenuEdit((prev) => ({ ...prev, name: event.target.value }))} /></label><label><span>Slug</span><input type="text" value={menuEdit.slug} disabled={!permissions.canManageMenu} onChange={(event) => setMenuEdit((prev) => ({ ...prev, slug: event.target.value }))} /></label><label><span>Danh mục</span><input type="text" value={menuEdit.category} disabled={!permissions.canManageMenu} onChange={(event) => setMenuEdit((prev) => ({ ...prev, category: event.target.value }))} /></label><label><span>Giá</span><input type="number" min="0" value={menuEdit.price} disabled={!permissions.canManageMenu} onChange={(event) => setMenuEdit((prev) => ({ ...prev, price: Number(event.target.value) }))} /></label><label><span>Image URL</span><input type="text" value={menuEdit.imageUrl} disabled={!permissions.canManageMenu} onChange={(event) => setMenuEdit((prev) => ({ ...prev, imageUrl: event.target.value }))} /></label><label><span>Available</span><select value={menuEdit.isAvailable ? "yes" : "no"} disabled={!permissions.canManageMenu} onChange={(event) => setMenuEdit((prev) => ({ ...prev, isAvailable: event.target.value === "yes" }))}><option value="yes">yes</option><option value="no">no</option></select></label><label><span>Featured</span><select value={menuEdit.isFeatured ? "yes" : "no"} disabled={!permissions.canManageMenu} onChange={(event) => setMenuEdit((prev) => ({ ...prev, isFeatured: event.target.value === "yes" }))}><option value="yes">yes</option><option value="no">no</option></select></label><label><span>Spicy level</span><select value={menuEdit.spicyLevel} disabled={!permissions.canManageMenu} onChange={(event) => setMenuEdit((prev) => ({ ...prev, spicyLevel: event.target.value }))}>{spicyLevels.map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label><span>Trạng thái món</span><select value={menuEdit.availabilityStatus || "available"} disabled={!permissions.canManageMenu} onChange={(event) => setMenuEdit((prev) => ({ ...prev, availabilityStatus: event.target.value }))}>{availabilityStatuses.map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label className={styles.fullWidth}><span>Ghi chú theo mùa / tồn kho</span><textarea rows={3} value={menuEdit.seasonNote || ""} disabled={!permissions.canManageMenu} onChange={(event) => setMenuEdit((prev) => ({ ...prev, seasonNote: event.target.value }))} /></label><label className={styles.fullWidth}><span>Mô tả</span><textarea rows={5} value={menuEdit.description} disabled={!permissions.canManageMenu} onChange={(event) => setMenuEdit((prev) => ({ ...prev, description: event.target.value }))} /></label></div>{permissions.canManageMenu ? <div className={styles.detailActions}><button type="button" className={styles.saveButton} onClick={saveMenuEdit} disabled={menuSaving}>{menuSaving ? "Đang lưu..." : "Lưu món"}</button></div> : null}</div> : <div className={styles.emptyState}>Chưa có món ăn.</div>}</div>
          </section>
        ) : null}

        {tab === "vouchers" ? (
          <section className={styles.adminGrid}>
            <div className={styles.listPanel}>
              <div className={styles.panelToolbar}>
                <input
                  type="search"
                  placeholder="Tìm voucher..."
                  value={voucherQuery}
                  onChange={(event) => setVoucherQuery(event.target.value)}
                />
                <select value={voucherStatus} onChange={(event) => setVoucherStatus(event.target.value)}>
                  {voucherStatuses.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.statsStrip}>
                <article className={styles.statCard}>
                  <span>Campaign active</span>
                  <strong>{voucherStats.campaigns}</strong>
                  <small>{voucherStats.redeemed} voucher da redeem</small>
                </article>
                <article className={styles.statCard}>
                  <span>Loyalty members</span>
                  <strong>{loyaltyStats.members}</strong>
                  <small>{loyaltyStats.redemptions} redemption da ghi nhan</small>
                </article>
              </div>
              <div className={styles.tableWrap}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>SĐT</th>
                      <th>Mã</th>
                      <th>Campaign</th>
                      <th>Trạng thái</th>
                      <th>Tạo lúc</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVouchers.map((item) => (
                      <tr
                        key={item.id}
                        className={item.id === selectedVoucher?.id ? styles.activeRow : ""}
                        onClick={() => setSelectedVoucherId(item.id)}
                      >
                        <td>{item.phone}</td>
                        <td>{item.voucherCode || "-"}</td>
                        <td>{item.voucherTitle || "-"}</td>
                        <td>
                          <span
                            className={`${styles.statusBadge} ${
                              styles[`status_${item.status}`] || styles.status_new
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td>{formatDate(item.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className={styles.detailPanel}>
              <div className={styles.subsection}>
                <div className={styles.detailHeading}>
                  <div>
                    <span className={styles.kicker}>Voucher campaigns</span>
                    <h2>Campaign & loyalty</h2>
                  </div>
                  {permissions.canManageVouchers ? (
                    <button type="button" onClick={() => setCampaignCreateOpen((prev) => !prev)}>
                      {campaignCreateOpen ? "Đóng form" : "Tạo campaign"}
                    </button>
                  ) : null}
                </div>
                {campaignCreateOpen && permissions.canManageVouchers ? (
                  <form className={styles.inlineForm} onSubmit={createVoucherCampaignEntry}>
                    <input
                      type="text"
                      placeholder="Tiêu đề campaign"
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
                    <input
                      type="text"
                      placeholder="Mã campaign"
                      value={campaignDraft.code}
                      onChange={(event) =>
                        setCampaignDraft((prev) => ({ ...prev, code: event.target.value }))
                      }
                    />
                    <div className={styles.inlineRow}>
                      <select
                        value={campaignDraft.discountType}
                        onChange={(event) =>
                          setCampaignDraft((prev) => ({
                            ...prev,
                            discountType: event.target.value
                          }))
                        }
                      >
                        <option value="percent">percent</option>
                        <option value="amount">amount</option>
                      </select>
                      <input
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
                    <textarea
                      rows={3}
                      placeholder="Mô tả campaign"
                      value={campaignDraft.description}
                      onChange={(event) =>
                        setCampaignDraft((prev) => ({ ...prev, description: event.target.value }))
                      }
                    />
                    <button type="submit" disabled={voucherSaving}>
                      {voucherSaving ? "Đang tạo..." : "Lưu campaign"}
                    </button>
                  </form>
                ) : null}
                <div className={styles.campaignRail}>
                  {voucherCampaigns.map((campaign) => (
                    <button
                      key={campaign.id}
                      type="button"
                      className={`${styles.campaignTile} ${
                        campaign.id === selectedVoucherCampaign?.id ? styles.campaignTileActive : ""
                      }`}
                      onClick={() => setSelectedVoucherCampaignId(campaign.id)}
                    >
                      <strong>{campaign.title}</strong>
                      <span>{formatVoucherBenefit(campaign)}</span>
                      <small>{campaign.isActive ? "Đang chạy" : "Đã tắt"} • {campaign.validDays} ngày</small>
                    </button>
                  ))}
                </div>
                {selectedVoucherCampaign ? (
                  <div className={styles.editGrid}>
                    <label>
                      <span>Tiêu đề</span>
                      <input
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
                      <span>Mã campaign</span>
                      <input
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
                      <input
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
                      <span>Valid days</span>
                      <input
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
                      <textarea
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
                        <button
                          type="button"
                          className={styles.deleteButton}
                          onClick={() => deleteVoucherCampaignEntry(selectedVoucherCampaign.id)}
                        >
                          Xóa campaign
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {selectedVoucher ? (
                <div className={styles.subsection}>
                  <div className={styles.detailHeading}>
                    <div>
                      <span className={styles.kicker}>Chi tiết voucher</span>
                      <h2>{selectedVoucher.phone}</h2>
                    </div>
                    <div className={styles.detailActions}>
                      {permissions.canManageVouchers ? (
                        <button
                          type="button"
                          className={styles.saveButton}
                          onClick={() => redeemVoucher(selectedVoucher)}
                          disabled={voucherSaving}
                        >
                          {voucherSaving ? "Đang xử lý..." : "Redeem + tích điểm"}
                        </button>
                      ) : null}
                      {permissions.canManageVouchers ? (
                        <button
                          className={styles.deleteButton}
                          type="button"
                          onClick={async () => {
                            if (!window.confirm("Xóa lead voucher này?")) return;
                            try {
                              await requestJson(`/api/admin/vouchers/${selectedVoucher.id}`, {
                                method: "DELETE"
                              });
                              const next = vouchers.filter((item) => item.id !== selectedVoucher.id);
                              setVouchers(next);
                              setSelectedVoucherId(next[0]?.id || "");
                              setMessage("Đã xóa lead voucher.");
                            } catch (error) {
                              setMessage(error.message);
                            }
                          }}
                        >
                          Xóa lead
                        </button>
                      ) : null}
                    </div>
                  </div>
                  {permissions.canManageVouchers ? (
                    <div className={styles.quickStatusRow}>
                      {voucherStatuses
                        .filter((item) => item.value !== "all")
                        .map((item) => (
                          <button
                            type="button"
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
                          </button>
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
                      <input
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
                      <input
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
                      <textarea
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
                </div>
              ) : (
                <div className={styles.emptyState}>Chưa có voucher.</div>
              )}

              <div className={styles.subsection}>
                <div className={styles.detailHeading}>
                  <div>
                    <span className={styles.kicker}>Loyalty</span>
                    <h2>Top khách hàng giữ chân</h2>
                  </div>
                </div>
                <div className={styles.metaGrid}>
                  <div>
                    <span>Tổng members</span>
                    <strong>{loyaltyStats.members}</strong>
                  </div>
                  <div>
                    <span>Tổng points</span>
                    <strong>{loyaltyStats.totalPoints}</strong>
                  </div>
                  <div>
                    <span>Tổng chi tiêu</span>
                    <strong>{formatCurrency(loyaltyStats.totalSpent)}</strong>
                  </div>
                  <div>
                    <span>Redemptions</span>
                    <strong>{loyaltyStats.redemptions}</strong>
                  </div>
                </div>
                <div className={styles.loyaltyList}>
                  {customerProfiles.slice(0, 6).map((customer) => (
                    <article key={customer.id} className={styles.loyaltyCard}>
                      <strong>{customer.fullName || customer.phone}</strong>
                      <span>{customer.phone}</span>
                      <small>
                        {customer.loyaltyPoints} points • {formatCurrency(customer.totalSpent)}
                      </small>
                    </article>
                  ))}
                  {!customerProfiles.length ? (
                    <div className={styles.emptyState}>Chưa có hồ sơ loyalty.</div>
                  ) : null}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {tab === "drivers" && permissions.canViewDrivers ? (
          <section className={styles.adminGrid}>
            <div className={styles.listPanel}>
              <div className={styles.panelToolbar}>
                <input
                  type="search"
                  placeholder="Tìm tài xế / mã giới thiệu..."
                  value={driverQuery}
                  onChange={(event) => setDriverQuery(event.target.value)}
                />
                <div></div>
                {permissions.canManageDrivers ? (
                  <button type="button" onClick={() => setDriverCreateOpen((prev) => !prev)}>
                    {driverCreateOpen ? "Đóng form" : "Tạo tài xế"}
                  </button>
                ) : (
                  <div></div>
                )}
              </div>
              {driverCreateOpen && permissions.canManageDrivers ? (
                <form className={styles.inlineForm} onSubmit={createDriverEntry}>
                  <input type="text" placeholder="Mã tài xế" value={driverDraft.code} onChange={(event) => setDriverDraft((prev) => ({ ...prev, code: event.target.value }))} required />
                  <input type="text" placeholder="Tên tài xế" value={driverDraft.fullName} onChange={(event) => setDriverDraft((prev) => ({ ...prev, fullName: event.target.value }))} required />
                  <div className={styles.inlineRow}>
                    <input type="tel" placeholder="SĐT" value={driverDraft.phone} onChange={(event) => setDriverDraft((prev) => ({ ...prev, phone: event.target.value }))} required />
                    <input type="text" placeholder="Loại xe" value={driverDraft.vehicleType} onChange={(event) => setDriverDraft((prev) => ({ ...prev, vehicleType: event.target.value }))} />
                  </div>
                  <div className={styles.inlineRow}>
                    <input type="text" placeholder="Mã giới thiệu" value={driverDraft.referralCode} onChange={(event) => setDriverDraft((prev) => ({ ...prev, referralCode: event.target.value }))} />
                    <input type="number" min="0" placeholder="% hoa hồng" value={driverDraft.commissionRate} onChange={(event) => setDriverDraft((prev) => ({ ...prev, commissionRate: Number(event.target.value) }))} />
                  </div>
                  <textarea placeholder="Ghi chú" rows={3} value={driverDraft.notes} onChange={(event) => setDriverDraft((prev) => ({ ...prev, notes: event.target.value }))} />
                  <button type="submit" disabled={tableSaving}>{tableSaving ? "Đang tạo..." : "Lưu tài xế"}</button>
                </form>
              ) : null}
              <div className={styles.tableWrap}>
                <table className={styles.dataTable}>
                  <thead><tr><th>Tài xế</th><th>Mã giới thiệu</th><th>Hoa hồng</th><th>Trạng thái</th></tr></thead>
                  <tbody>
                    {filteredDrivers.map((item) => (
                      <tr key={item.id} className={item.id === selectedDriver?.id ? styles.activeRow : ""} onClick={() => setSelectedDriverId(item.id)}>
                        <td><strong>{item.fullName}</strong><span>{item.phone}</span></td>
                        <td>{item.referralCode || "-"}</td>
                        <td>{item.commissionRate}%</td>
                        <td><span className={`${styles.statusBadge} ${styles[`status_${item.status}`] || styles.status_confirmed}`}>{item.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className={styles.detailPanel}>
              {selectedDriver ? (
                <div>
                  <div className={styles.detailHeading}>
                    <div>
                      <span className={styles.kicker}>Driver / Referral</span>
                      <h2>{selectedDriver.fullName}</h2>
                    </div>
                    {permissions.canManageDrivers ? (
                      <button className={styles.deleteButton} type="button" onClick={() => deleteDriverEntry(selectedDriver.id)}>
                        Xóa tài xế
                      </button>
                    ) : null}
                  </div>
                  <div className={styles.metaGrid}>
                    <div><span>Mã tài xế</span><strong>{selectedDriver.code}</strong></div>
                    <div><span>Mã giới thiệu</span><strong>{selectedDriver.referralCode || "-"}</strong></div>
                    <div><span>Hoa hồng</span><strong>{selectedDriver.commissionRate}%</strong></div>
                    <div><span>Pending payout</span><strong>{formatCurrency(driverCommissions.filter((item) => item.driverId === selectedDriver.id && item.status === "pending").reduce((sum, item) => sum + item.commissionAmount, 0))}</strong></div>
                  </div>
                  <div className={styles.editGrid}>
                    <label><span>Tên tài xế</span><input type="text" value={driverEdit.fullName} disabled={!permissions.canManageDrivers} onChange={(event) => setDriverEdit((prev) => ({ ...prev, fullName: event.target.value }))} /></label>
                    <label><span>SĐT</span><input type="text" value={driverEdit.phone} disabled={!permissions.canManageDrivers} onChange={(event) => setDriverEdit((prev) => ({ ...prev, phone: event.target.value }))} /></label>
                    <label><span>Loại xe</span><input type="text" value={driverEdit.vehicleType} disabled={!permissions.canManageDrivers} onChange={(event) => setDriverEdit((prev) => ({ ...prev, vehicleType: event.target.value }))} /></label>
                    <label><span>% hoa hồng</span><input type="number" min="0" value={driverEdit.commissionRate} disabled={!permissions.canManageDrivers} onChange={(event) => setDriverEdit((prev) => ({ ...prev, commissionRate: Number(event.target.value) }))} /></label>
                    <label><span>Mã giới thiệu</span><input type="text" value={driverEdit.referralCode} disabled={!permissions.canManageDrivers} onChange={(event) => setDriverEdit((prev) => ({ ...prev, referralCode: event.target.value }))} /></label>
                    <label><span>Trạng thái</span><select value={driverEdit.status} disabled={!permissions.canManageDrivers} onChange={(event) => setDriverEdit((prev) => ({ ...prev, status: event.target.value }))}>{driverStatuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
                    <label className={styles.fullWidth}><span>Ghi chú</span><textarea rows={4} value={driverEdit.notes} disabled={!permissions.canManageDrivers} onChange={(event) => setDriverEdit((prev) => ({ ...prev, notes: event.target.value }))} /></label>
                  </div>
                  {permissions.canManageDrivers ? <div className={styles.detailActions}><button type="button" className={styles.saveButton} onClick={saveDriverEdit} disabled={tableSaving}>{tableSaving ? "Đang lưu..." : "Lưu tài xế"}</button></div> : null}
                  <div className={styles.subsection}>
                    <div className={styles.detailHeading}><div><span className={styles.kicker}>Referral gần đây</span><h2>Lead do tài xế giới thiệu</h2></div></div>
                    <div className={styles.logList}>
                      {driverReferrals.filter((item) => item.driverId === selectedDriver.id).slice(0, 6).map((item) => (
                        <article key={item.id} className={styles.logItem}>
                          <div className={styles.logHead}><strong>{item.referredName || item.referredPhone}</strong><span className={`${styles.statusBadge} ${styles[`status_${item.status}`] || styles.status_new}`}>{item.status}</span></div>
                          <small>{item.referralCode || "-"}</small>
                          <p>Base {formatCurrency(item.commissionBaseAmount)} • Hoa hồng {formatCurrency(item.commissionAmount)}</p>
                        </article>
                      ))}
                      {!driverReferrals.filter((item) => item.driverId === selectedDriver.id).length ? <div className={styles.emptyState}>Chưa có referral.</div> : null}
                    </div>
                  </div>
                  <div className={styles.subsection}>
                    <div className={styles.detailHeading}><div><span className={styles.kicker}>Commission</span><h2>Giao dịch hoa hồng</h2></div></div>
                    <div className={styles.logList}>
                      {driverCommissions.filter((item) => item.driverId === selectedDriver.id).slice(0, 6).map((item) => (
                        <article key={item.id} className={styles.logItem}>
                          <div className={styles.logHead}><strong>{formatCurrency(item.commissionAmount)}</strong><span className={`${styles.statusBadge} ${styles[`status_${item.status}`] || styles.status_new}`}>{item.status}</span></div>
                          <small>Order: {item.orderId || "-"} • Reservation: {item.reservationId || "-"}</small>
                          <p>{item.notes || "Chưa có ghi chú payout."}</p>
                        </article>
                      ))}
                      {!driverCommissions.filter((item) => item.driverId === selectedDriver.id).length ? <div className={styles.emptyState}>Chưa có commission transaction.</div> : null}
                    </div>
                  </div>
                </div>
              ) : (
                <div className={styles.emptyState}>Chưa có tài xế.</div>
              )}
            </div>
          </section>
        ) : null}

        {tab === "integrations" && permissions.canViewIntegrations ? (
          <section className={styles.integrationLayout}><div className={styles.integrationList}>{integrations.map((item) => <button type="button" key={item.id} className={`${styles.integrationCard} ${item.id === selectedIntegration?.id ? styles.integrationCardActive : ""}`} onClick={() => setSelectedIntegrationId(item.id)}><div className={styles.integrationCardTop}><strong>{item.name}</strong><span className={`${styles.statusBadge} ${item.enabled ? styles.status_confirmed : styles.status_cancelled}`}>{item.enabled ? "enabled" : "disabled"}</span></div><small>{item.category.toUpperCase()} • {item.market}</small><p>{item.description}</p><span className={styles.integrationMeta}>{item.syncMode === "auto" ? "Tự động đồng bộ" : "Đồng bộ thủ công"}</span></button>)}</div><div className={styles.integrationDetail}>{selectedIntegration ? <div className={styles.detailPanel}><div className={styles.detailHeading}><div><span className={styles.kicker}>Tích hợp POS/PMS</span><h2>{selectedIntegration.name}</h2></div></div><div className={styles.editGrid}><label><span>Trạng thái</span><select defaultValue={selectedIntegration.enabled ? "enabled" : "disabled"} disabled={!permissions.canManageIntegrations} onBlur={(event) => patchIntegration(selectedIntegration.id, { enabled: event.target.value === "enabled" })}><option value="disabled">disabled</option><option value="enabled">enabled</option></select></label><label><span>Sync mode</span><select defaultValue={selectedIntegration.syncMode} disabled={!permissions.canManageIntegrations} onBlur={(event) => patchIntegration(selectedIntegration.id, { syncMode: event.target.value })}><option value="manual">manual</option><option value="auto">auto</option></select></label><label className={styles.fullWidth}><span>Endpoint</span><input type="url" defaultValue={selectedIntegration.endpoint} disabled={!permissions.canManageIntegrations} onBlur={(event) => patchIntegration(selectedIntegration.id, { endpoint: event.target.value })} /></label><label><span>API key</span><input type="text" defaultValue={selectedIntegration.apiKey} disabled={!permissions.canManageIntegrations} onBlur={(event) => patchIntegration(selectedIntegration.id, { apiKey: event.target.value })} /></label><label><span>API secret</span><input type="text" defaultValue={selectedIntegration.apiSecret} disabled={!permissions.canManageIntegrations} onBlur={(event) => patchIntegration(selectedIntegration.id, { apiSecret: event.target.value })} /></label><label><span>Location code</span><input type="text" defaultValue={selectedIntegration.locationCode} disabled={!permissions.canManageIntegrations} onBlur={(event) => patchIntegration(selectedIntegration.id, { locationCode: event.target.value })} /></label><label><span>Tenant code</span><input type="text" defaultValue={selectedIntegration.tenantCode} disabled={!permissions.canManageIntegrations} onBlur={(event) => patchIntegration(selectedIntegration.id, { tenantCode: event.target.value })} /></label><label className={styles.fullWidth}><span>Ghi chú</span><textarea rows={5} defaultValue={selectedIntegration.notes} disabled={!permissions.canManageIntegrations} onBlur={(event) => patchIntegration(selectedIntegration.id, { notes: event.target.value })} /></label></div></div> : null}<div className={styles.detailPanel}><div className={styles.detailHeading}><div><span className={styles.kicker}>Nhật ký đồng bộ</span><h2>Lịch sử sync gần đây</h2></div></div><div className={styles.logList}>{syncLogs.length ? syncLogs.slice(0, 12).map((log) => <article key={log.id} className={styles.logItem}><div className={styles.logHead}><strong>{log.integrationName}</strong><span className={`${styles.statusBadge} ${log.ok ? styles.status_confirmed : styles.status_cancelled}`}>{log.ok ? `OK ${log.status}` : `ERR ${log.status}`}</span></div><small>Reservation: {log.reservationId || "-"}</small><small>{formatDate(log.createdAt)}</small><p>{log.responsePreview || "Không có nội dung phản hồi."}</p></article>) : <div className={styles.emptyState}>Chưa có log đồng bộ.</div>}</div></div></div></section>
        ) : null}
      </div>
    </main>
  );
}
