"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "./admin/admin-header";
import AdminDetailHeader from "./admin/admin-detail-header";
import AppSidebar from "./admin/app-sidebar";
import { AdminDetailShell, AdminListShell } from "./admin/admin-panel-shell";
import AdminStatCard from "./admin/admin-stat-card";
import AdminSurfaceCard from "./admin/admin-surface-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
const partnerTypes = ["agency", "hdv", "hotel", "corporate"];
const partnerStatuses = ["active", "inactive", "paused"];
const partnerBookingStatuses = ["lead", "confirmed", "arrived", "completed", "cancelled"];
const partnerContractStatuses = ["draft", "active", "expired", "terminated"];

const roleLabels = {
  admin: "Admin",
  manager: "Manager",
  staff: "Staff",
  super_admin: "Super Admin",
  branch_manager: "Branch Manager",
  driver: "Driver"
};

function getTabLabel(key) {
  return key === "reservations"
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
              : key === "partners"
                ? "Đối tác / HDV"
                : "Tích hợp POS/PMS";
}

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

function createEmptyPartnerDraft() {
  return {
    code: "",
    name: "",
    partnerType: "agency",
    contactName: "",
    phone: "",
    email: "",
    commissionType: "percent",
    commissionValue: 10,
    status: "active",
    notes: "",
    contractStartAt: "",
    contractEndAt: ""
  };
}

function createEmptyPartnerContractDraft() {
  return {
    partnerId: "",
    title: "",
    discountPercent: 0,
    commissionPercent: 10,
    paymentTerms: "",
    status: "draft",
    startsAt: "",
    endsAt: "",
    notes: ""
  };
}

function createEmptyPartnerBookingDraft() {
  return {
    partnerId: "",
    reservationId: "",
    code: "",
    customerName: "",
    customerPhone: "",
    groupSize: 10,
    bookingAt: "",
    packageName: "",
    menuBudget: 0,
    discountAmount: 0,
    commissionAmount: 0,
    status: "lead",
    guestManifestUrl: "",
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
  initialTravelPartners,
  initialPartnerContracts,
  initialPartnerBookings,
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
  const [travelPartners, setTravelPartners] = useState(
    sortByName(initialTravelPartners || [], "name")
  );
  const [partnerContracts, setPartnerContracts] = useState(
    sortByCreatedDesc(initialPartnerContracts || [])
  );
  const [partnerBookings, setPartnerBookings] = useState(
    sortByCreatedDesc(initialPartnerBookings || [])
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
  const [partnerQuery, setPartnerQuery] = useState("");

  const [selectedReservationId, setSelectedReservationId] = useState(initialReservations[0]?.id || "");
  const [selectedVoucherId, setSelectedVoucherId] = useState(initialVouchers[0]?.id || "");
  const [selectedVoucherCampaignId, setSelectedVoucherCampaignId] = useState(
    initialVoucherCampaigns?.[0]?.id || ""
  );
  const [selectedDriverId, setSelectedDriverId] = useState(initialDrivers?.[0]?.id || "");
  const [selectedPartnerId, setSelectedPartnerId] = useState(initialTravelPartners?.[0]?.id || "");
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
  const [partnerCreateOpen, setPartnerCreateOpen] = useState(false);
  const [partnerContractCreateOpen, setPartnerContractCreateOpen] = useState(false);
  const [partnerBookingCreateOpen, setPartnerBookingCreateOpen] = useState(false);

  const [reservationSaving, setReservationSaving] = useState(false);
  const [voucherSaving, setVoucherSaving] = useState(false);
  const [orderSaving, setOrderSaving] = useState(false);
  const [menuSaving, setMenuSaving] = useState(false);
  const [tableSaving, setTableSaving] = useState(false);
  const [integrationSaving, setIntegrationSaving] = useState(false);
  const [partnerSaving, setPartnerSaving] = useState(false);

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
  const [partnerDraft, setPartnerDraft] = useState(createEmptyPartnerDraft());
  const [partnerEdit, setPartnerEdit] = useState(createEmptyPartnerDraft());
  const [partnerContractDraft, setPartnerContractDraft] = useState(createEmptyPartnerContractDraft());
  const [partnerBookingDraft, setPartnerBookingDraft] = useState(createEmptyPartnerBookingDraft());

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
  const selectedPartner = travelPartners.find((item) => item.id === selectedPartnerId) || null;
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
      canViewPartners: hasAdminPermission(currentRole, "partners.view"),
      canManagePartners: hasAdminPermission(currentRole, "partners.manage"),
      canManagePartnerBookings: hasAdminPermission(currentRole, "partners.booking"),
      canManagePartnerContracts: hasAdminPermission(currentRole, "partners.contract"),
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
    setPartnerEdit(selectedPartner ? { ...selectedPartner } : createEmptyPartnerDraft());
    setPartnerContractDraft((prev) => ({
      ...prev,
      partnerId: selectedPartner?.id || prev.partnerId || ""
    }));
    setPartnerBookingDraft((prev) => ({
      ...prev,
      partnerId: selectedPartner?.id || prev.partnerId || ""
    }));
  }, [selectedPartnerId, selectedPartner]);

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

  const filteredPartners = useMemo(
    () =>
      travelPartners.filter((item) =>
        matchesSearch(item, partnerQuery, ["name", "code", "contactName", "phone", "email"])
      ),
    [travelPartners, partnerQuery]
  );

  const findTableName = (tableId) => restaurantTables.find((item) => item.id === tableId)?.name || "-";
  const findReservationName = (reservationId) => reservations.find((item) => item.id === reservationId)?.name || "-";
  const findDriverName = (driverId) => drivers.find((item) => item.id === driverId)?.fullName || "-";
  const findPartnerName = (partnerId) => travelPartners.find((item) => item.id === partnerId)?.name || "-";

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

  const createPartnerEntry = async (event) => {
    event.preventDefault();
    setPartnerSaving(true);
    setMessage("");
    try {
      const data = await requestJson(withBranchQuery("/api/admin/travel-partners", branchFilterId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attachBranchToPayload(partnerDraft))
      });
      setTravelPartners((prev) => sortByName([data.data, ...prev], "name"));
      setSelectedPartnerId(data.data.id);
      setPartnerDraft(createEmptyPartnerDraft());
      setPartnerCreateOpen(false);
      setMessage("Đã tạo đối tác / HDV mới.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setPartnerSaving(false);
    }
  };

  const savePartnerEdit = async () => {
    if (!selectedPartner) return;
    setPartnerSaving(true);
    setMessage("");
    try {
      const data = await requestJson(`/api/admin/travel-partners/${selectedPartner.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attachBranchToPayload(partnerEdit))
      });
      setTravelPartners((prev) => sortByName(prev.map((item) => (item.id === selectedPartner.id ? data.data : item)), "name"));
      setMessage("Đã cập nhật đối tác.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setPartnerSaving(false);
    }
  };

  const deletePartnerEntry = async (id) => {
    if (!window.confirm("Xóa đối tác này?")) return;
    try {
      await requestJson(`/api/admin/travel-partners/${id}`, { method: "DELETE" });
      const next = travelPartners.filter((item) => item.id !== id);
      setTravelPartners(next);
      setSelectedPartnerId(next[0]?.id || "");
      setMessage("Đã xóa đối tác.");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const createPartnerContractEntry = async (event) => {
    event.preventDefault();
    setPartnerSaving(true);
    setMessage("");
    try {
      const data = await requestJson(withBranchQuery("/api/admin/partner-contracts", branchFilterId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attachBranchToPayload({
          ...partnerContractDraft,
          partnerId: partnerContractDraft.partnerId || selectedPartner?.id || ""
        }))
      });
      setPartnerContracts((prev) => sortByCreatedDesc([data.data, ...prev]));
      setPartnerContractDraft(createEmptyPartnerContractDraft());
      setPartnerContractCreateOpen(false);
      setMessage("Đã tạo hợp đồng đối tác.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setPartnerSaving(false);
    }
  };

  const createPartnerBookingEntry = async (event) => {
    event.preventDefault();
    setPartnerSaving(true);
    setMessage("");
    try {
      const data = await requestJson(withBranchQuery("/api/admin/partner-bookings", branchFilterId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attachBranchToPayload({
          ...partnerBookingDraft,
          partnerId: partnerBookingDraft.partnerId || selectedPartner?.id || ""
        }))
      });
      setPartnerBookings((prev) => sortByCreatedDesc([data.data, ...prev]));
      setPartnerBookingDraft(createEmptyPartnerBookingDraft());
      setPartnerBookingCreateOpen(false);
      setMessage("Đã tạo booking đoàn.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setPartnerSaving(false);
    }
  };

  const patchPartnerBooking = async (id, payload) => {
    setPartnerSaving(true);
    setMessage("");
    try {
      const data = await requestJson(`/api/admin/partner-bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attachBranchToPayload(payload))
      });
      setPartnerBookings((prev) => sortByCreatedDesc(prev.map((item) => (item.id === id ? data.data : item))));
      setMessage("Đã cập nhật booking đoàn.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setPartnerSaving(false);
    }
  };

  const deletePartnerBookingEntry = async (id) => {
    if (!window.confirm("Xóa booking đoàn này?")) return;
    try {
      await requestJson(`/api/admin/partner-bookings/${id}`, { method: "DELETE" });
      setPartnerBookings((prev) => prev.filter((item) => item.id !== id));
      setMessage("Đã xóa booking đoàn.");
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
  const partnerStats = {
    total: travelPartners.length,
    active: travelPartners.filter((item) => item.status === "active").length,
    openBookings: partnerBookings.filter((item) => ["lead", "confirmed"].includes(item.status)).length,
    monthlyBudget: partnerBookings.reduce((sum, item) => sum + Number(item.menuBudget || 0), 0)
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
      })),
    ...partnerBookings
      .filter((item) => isRecentItem(item.createdAt, 24))
      .map((item) => ({
        id: `partner-booking-${item.id}`,
        type: "partner-booking",
        title: `${findPartnerName(item.partnerId)} vừa gửi booking đoàn`,
        subtitle: `${item.customerName} • ${item.groupSize} khách • ${formatDate(item.bookingAt)}`,
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
  const currentTabLabel = getTabLabel(tab);

  return (
    <main className={styles.dashboardPage}>
      <div className={styles.shell}>
        <AppSidebar
          visibleTabs={visibleTabs}
          tab={tab}
          onTabChange={setTab}
          getTabLabel={getTabLabel}
          reservationStats={reservationStats}
          orderStats={orderStats}
          voucherStats={voucherStats}
          driverStats={driverStats}
          partnerStats={partnerStats}
          adminProfile={adminProfile}
          roleLabels={roleLabels}
          branches={initialBranches || []}
          activeBranchId={activeBranchId || "all"}
          canViewAllBranches={canViewAllBranches}
          selectedBranch={selectedBranch}
          onBranchChange={handleBranchChange}
          canExport={permissions.canExport}
          branchFilterId={branchFilterId}
          onLogout={logout}
        />

        <section className={styles.contentShell}>
        <AdminHeader
          currentTabLabel={currentTabLabel}
          adminProfile={adminProfile}
          selectedBranch={selectedBranch}
          notificationCount={notificationFeed.length}
        />

        {message ? <p className={styles.feedback}>{message}</p> : null}

        <section className={styles.statsGrid}>
          <AdminStatCard label="Đặt bàn" value={reservationStats.total} detail={`${reservationStats.pending} lead đang chờ xử lý`} accent="warm" />
          <AdminStatCard label="Orders" value={orderStats.total} detail={`${orderStats.active} order đang phục vụ`} />
          <AdminStatCard label="Thực đơn" value={menuStats.total} detail={`${menuStats.featured} món featured • ${menuStats.lowStock} món cần chú ý`} />
          <AdminStatCard label="Bàn" value={tableStats.total} detail={`${tableStats.available} bàn còn trống`} />
          <AdminStatCard label="Voucher" value={voucherStats.total} detail={`${voucherStats.activeCodes} mã đã phát • ${voucherStats.recent} lead trong 24h`} accent="soft" />
          <AdminStatCard label="Tài xế" value={driverStats.total} detail={`${driverStats.active} đang hoạt động • ${driverStats.pendingCommissions} pending`} />
          <AdminStatCard label="Đối tác" value={partnerStats.total} detail={`${partnerStats.openBookings} booking đoàn mở • ${partnerStats.active} active`} accent="ocean" />
        </section>

        <section className={styles.insightsGrid}>
          <AdminSurfaceCard
            kicker="Thông báo mới"
            title="Lead trong 24 giờ gần nhất"
            className={styles.insightCard}
          >
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
          </AdminSurfaceCard>

          <AdminSurfaceCard
            kicker="Analytics cơ bản"
            title="Top món và tình trạng thực đơn"
            className={styles.insightCard}
          >
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
          </AdminSurfaceCard>
        </section>

        {tab === "reservations" ? (
          <section className={styles.adminGrid}>
            <AdminListShell>
              <div className={styles.panelToolbar}>
                <Input type="search" placeholder="Tìm khách đặt bàn..." value={reservationQuery} onChange={(event) => setReservationQuery(event.target.value)} />
                <Select value={reservationStatus} onValueChange={setReservationStatus}>
                  <SelectTrigger><SelectValue placeholder="Trạng thái" /></SelectTrigger>
                  <SelectContent>{reservationStatuses.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
                </Select>
                {permissions.canManageReservations ? <Button type="button" variant="secondary" onClick={() => setManualOpen((prev) => !prev)}>{manualOpen ? "Đóng form" : "Thêm đặt bàn"}</Button> : <div></div>}
              </div>

              {manualOpen && permissions.canManageReservations ? (
                <form className={styles.inlineForm} onSubmit={createManualReservation}>
                  <Input type="text" placeholder="Tên khách" value={manualForm.name} onChange={(event) => setManualForm((prev) => ({ ...prev, name: event.target.value }))} required />
                  <Input type="tel" placeholder="SĐT" value={manualForm.phone} onChange={(event) => setManualForm((prev) => ({ ...prev, phone: event.target.value }))} required />
                  <div className={styles.inlineRow}>
                    <Input type="text" placeholder="Số khách" value={manualForm.guests} onChange={(event) => setManualForm((prev) => ({ ...prev, guests: event.target.value }))} required />
                    <Input type="datetime-local" value={manualForm.datetime} onChange={(event) => setManualForm((prev) => ({ ...prev, datetime: event.target.value }))} required />
                  </div>
                  <div className={styles.inlineRow}>
                    <select value={manualForm.driverId} onChange={(event) => setManualForm((prev) => ({ ...prev, driverId: event.target.value }))}>
                      <option value="">Chưa gán tài xế</option>
                      {drivers.map((driver) => <option key={driver.id} value={driver.id}>{driver.fullName}</option>)}
                    </select>
                    <Input type="text" placeholder="Mã giới thiệu" value={manualForm.referralCode} onChange={(event) => setManualForm((prev) => ({ ...prev, referralCode: event.target.value }))} />
                  </div>
                  <select value={manualForm.tableId} onChange={(event) => setManualForm((prev) => ({ ...prev, tableId: event.target.value }))}><option value="">Chưa gán bàn</option>{restaurantTables.map((table) => <option key={table.id} value={table.id}>{table.name}</option>)}</select>
                  <Textarea placeholder="Ghi chú" value={manualForm.notes} onChange={(event) => setManualForm((prev) => ({ ...prev, notes: event.target.value }))} rows={3} />
                  <Button type="submit" disabled={reservationSaving}>{reservationSaving ? "Đang lưu..." : "Lưu đặt bàn"}</Button>
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
            </AdminListShell>

            <AdminDetailShell>
              {selectedReservation ? (
                <div>
                  <AdminDetailHeader
                    kicker="Chi tiết đặt bàn"
                    title={selectedReservation.name}
                    actions={permissions.canManageReservations ? <Button className={styles.deleteButton} variant="destructive" type="button" onClick={() => deleteReservation(selectedReservation.id)}>Xóa lead</Button> : null}
                  />
                  {permissions.canManageReservations ? <div className={styles.quickStatusRow}>{reservationStatuses.filter((item) => item.value !== "all").map((item) => <Button type="button" variant={selectedReservation.status === item.value ? "default" : "outline"} key={item.value} className={selectedReservation.status === item.value ? styles.quickActive : ""} onClick={() => patchReservation(selectedReservation.id, { ...selectedReservation, status: item.value })}>{item.label}</Button>)}</div> : null}
                  <div className={styles.editGrid}>
                    <label><span>SĐT</span><Input type="text" defaultValue={selectedReservation.phone} disabled={!permissions.canManageReservations} onBlur={(event) => patchReservation(selectedReservation.id, { ...selectedReservation, phone: event.target.value })} /></label>
                    <label><span>Số khách</span><Input type="text" defaultValue={selectedReservation.guests} disabled={!permissions.canManageReservations} onBlur={(event) => patchReservation(selectedReservation.id, { ...selectedReservation, guests: event.target.value })} /></label>
                    <label><span>Thời gian</span><Input type="datetime-local" defaultValue={selectedReservation.datetime} disabled={!permissions.canManageReservations} onBlur={(event) => patchReservation(selectedReservation.id, { ...selectedReservation, datetime: event.target.value })} /></label>
                    <label><span>Gán bàn</span><select defaultValue={selectedReservation.tableId || ""} disabled={!permissions.canManageReservations} onBlur={(event) => patchReservation(selectedReservation.id, { ...selectedReservation, tableId: event.target.value })}><option value="">Chưa gán bàn</option>{restaurantTables.map((table) => <option key={table.id} value={table.id}>{table.name}</option>)}</select></label>
                    <label className={styles.fullWidth}><span>Ghi chú</span><Textarea rows={5} defaultValue={selectedReservation.notes || ""} disabled={!permissions.canManageReservations} onBlur={(event) => patchReservation(selectedReservation.id, { ...selectedReservation, notes: event.target.value })} /></label>
                  </div>
                  {permissions.canViewIntegrations ? <div className={styles.syncBox}><div><span className={styles.kicker}>Sync POS/PMS</span><p>Đồng bộ lead này sang hệ POS/PMS.</p></div><div className={styles.syncActions}><Select value={selectedIntegrationId} onValueChange={setSelectedIntegrationId} disabled={!permissions.canManageIntegrations}><SelectTrigger><SelectValue placeholder="Chọn tích hợp" /></SelectTrigger><SelectContent>{integrations.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select>{permissions.canSyncIntegrations ? <Button type="button" onClick={() => syncReservation(selectedReservation.id, selectedIntegrationId)} disabled={integrationSaving}>{integrationSaving ? "Đang sync..." : "Sync ngay"}</Button> : null}</div></div> : null}
                </div>
              ) : <div className={styles.emptyState}>Chưa có lead đặt bàn.</div>}
            </AdminDetailShell>
          </section>
        ) : null}

        {tab === "orders" ? (
          <section className={styles.adminGrid}>
            <AdminListShell>
              <div className={styles.panelToolbar}>
                <Input type="search" placeholder="Tìm khách order..." value={orderQuery} onChange={(event) => setOrderQuery(event.target.value)} />
                <Select value={orderStatus} onValueChange={setOrderStatus}>
                  <SelectTrigger><SelectValue placeholder="Trạng thái order" /></SelectTrigger>
                  <SelectContent>{orderStatuses.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
                </Select>
                {permissions.canManageOrders ? <Button type="button" variant="secondary" onClick={() => setOrderCreateOpen((prev) => !prev)}>{orderCreateOpen ? "Đóng form" : "Tạo order"}</Button> : <div></div>}
              </div>

              {orderCreateOpen && permissions.canManageOrders ? (
                <form className={styles.inlineForm} onSubmit={createManualOrder}>
                  <Input type="text" placeholder="Tên khách" value={orderDraft.customerName} onChange={(event) => setOrderDraft((prev) => ({ ...prev, customerName: event.target.value }))} required />
                  <Input type="tel" placeholder="SĐT" value={orderDraft.customerPhone} onChange={(event) => setOrderDraft((prev) => ({ ...prev, customerPhone: event.target.value }))} required />
                  <div className={styles.inlineRow}>
                    <select value={orderDraft.tableId} onChange={(event) => setOrderDraft((prev) => ({ ...prev, tableId: event.target.value }))}><option value="">Chọn bàn</option>{restaurantTables.map((table) => <option key={table.id} value={table.id}>{table.name}</option>)}</select>
                    <select value={orderDraft.orderChannel} onChange={(event) => setOrderDraft((prev) => ({ ...prev, orderChannel: event.target.value }))}>{orderChannels.map((item) => <option key={item} value={item}>{item}</option>)}</select>
                  </div>
                  <div className={styles.inlineRow}>
                    <select value={orderDraft.driverId} onChange={(event) => setOrderDraft((prev) => ({ ...prev, driverId: event.target.value }))}>
                      <option value="">Chưa gán tài xế</option>
                      {drivers.map((driver) => <option key={driver.id} value={driver.id}>{driver.fullName}</option>)}
                    </select>
                    <Input type="text" placeholder="Mã giới thiệu" value={orderDraft.referralCode} onChange={(event) => setOrderDraft((prev) => ({ ...prev, referralCode: event.target.value }))} />
                  </div>
                  <div className={styles.inlineAddRow}><select defaultValue="" onChange={(event) => { if (event.target.value) { addItemToState(event.target.value, setOrderDraft); event.target.value = ""; } }}><option value="">Thêm món vào order</option>{menuItems.filter((item) => item.isAvailable).map((item) => <option key={item.id} value={item.id}>{item.name} - {formatCurrency(item.price)}</option>)}</select></div>
                  <div className={styles.lineItemList}>{orderDraft.items.map((item, index) => <div key={`${item.menuItemId}-${index}`} className={styles.lineItemRow}><strong>{item.itemName}</strong><Input type="number" min="1" value={item.quantity} onChange={(event) => updateLineItem(setOrderDraft, index, "quantity", event.target.value)} /><Input type="number" min="0" value={item.unitPrice} onChange={(event) => updateLineItem(setOrderDraft, index, "unitPrice", event.target.value)} /><Button type="button" variant="outline" onClick={() => removeLineItem(setOrderDraft, index)}>Xóa</Button></div>)}</div>
                  <div className={styles.inlineRow}><Input type="number" min="0" placeholder="Discount" value={orderDraft.discountAmount} onChange={(event) => setOrderDraft((prev) => ({ ...prev, discountAmount: Number(event.target.value) }))} /><Input type="number" min="0" placeholder="Service charge" value={orderDraft.serviceCharge} onChange={(event) => setOrderDraft((prev) => ({ ...prev, serviceCharge: Number(event.target.value) }))} /></div>
                  <Textarea placeholder="Ghi chú order" rows={3} value={orderDraft.notes} onChange={(event) => setOrderDraft((prev) => ({ ...prev, notes: event.target.value }))} />
                  <div className={styles.summaryRow}><span>Tạm tính: {formatCurrency(orderDraftTotals.subtotal)}</span><span>Tổng: {formatCurrency(orderDraftTotals.total)}</span></div>
                  <Button type="submit" disabled={orderSaving}>{orderSaving ? "Đang tạo..." : "Lưu order"}</Button>
                </form>
              ) : null}

              <div className={styles.tableWrap}>
                <table className={styles.dataTable}><thead><tr><th>Khách</th><th>Bàn</th><th>Món</th><th>Tổng</th><th>Trạng thái</th></tr></thead><tbody>{filteredOrders.map((item) => <tr key={item.id} className={item.id === selectedOrder?.id ? styles.activeRow : ""} onClick={() => setSelectedOrderId(item.id)}><td><strong>{item.customerName}</strong><span>{formatDate(item.createdAt)}</span></td><td>{findTableName(item.tableId)}</td><td>{item.items.length}</td><td>{formatCurrency(item.totalAmount)}</td><td><span className={`${styles.statusBadge} ${styles[`status_${item.status}`] || styles.status_contacted}`}>{item.status}</span></td></tr>)}</tbody></table>
              </div>
            </AdminListShell>

            <AdminDetailShell>
              {selectedOrder ? (
                <div>
                  <AdminDetailHeader kicker="Chi tiết order" title={selectedOrder.customerName} actions={permissions.canManageOrders ? <Button className={styles.deleteButton} variant="destructive" type="button" onClick={() => deleteOrder(selectedOrder.id)}>Xóa order</Button> : null} />
                  {permissions.canManageOrders ? <div className={styles.quickStatusRow}>{orderStatuses.filter((item) => item.value !== "all").map((item) => <Button type="button" variant={orderEdit.status === item.value ? "default" : "outline"} key={item.value} className={orderEdit.status === item.value ? styles.quickActive : ""} onClick={() => setOrderEdit((prev) => ({ ...prev, status: item.value }))}>{item.label}</Button>)}</div> : null}
                  <div className={styles.editGrid}>
                    <label><span>Tên khách</span><Input type="text" value={orderEdit.customerName} onChange={(event) => setOrderEdit((prev) => ({ ...prev, customerName: event.target.value }))} /></label>
                    <label><span>SĐT</span><Input type="text" value={orderEdit.customerPhone} onChange={(event) => setOrderEdit((prev) => ({ ...prev, customerPhone: event.target.value }))} /></label>
                    <label><span>Reservation</span><select value={orderEdit.reservationId} onChange={(event) => setOrderEdit((prev) => ({ ...prev, reservationId: event.target.value }))}><option value="">Không gắn</option>{reservations.map((reservation) => <option key={reservation.id} value={reservation.id}>{reservation.name}</option>)}</select></label>
                    <label><span>Bàn</span><select value={orderEdit.tableId} onChange={(event) => setOrderEdit((prev) => ({ ...prev, tableId: event.target.value }))}><option value="">Không gắn</option>{restaurantTables.map((table) => <option key={table.id} value={table.id}>{table.name}</option>)}</select></label>
                    <label><span>Order channel</span><select value={orderEdit.orderChannel} onChange={(event) => setOrderEdit((prev) => ({ ...prev, orderChannel: event.target.value }))}>{orderChannels.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
                    <label><span>Discount</span><Input type="number" min="0" value={orderEdit.discountAmount} onChange={(event) => setOrderEdit((prev) => ({ ...prev, discountAmount: Number(event.target.value) }))} /></label>
                    <label><span>Service charge</span><Input type="number" min="0" value={orderEdit.serviceCharge} onChange={(event) => setOrderEdit((prev) => ({ ...prev, serviceCharge: Number(event.target.value) }))} /></label>
                    <label className={styles.fullWidth}><span>Ghi chú</span><Textarea rows={4} value={orderEdit.notes} onChange={(event) => setOrderEdit((prev) => ({ ...prev, notes: event.target.value }))} /></label>
                  </div>
                  <div className={styles.inlineAddRow}><select defaultValue="" onChange={(event) => { if (event.target.value) { addItemToState(event.target.value, setOrderEdit); event.target.value = ""; } }}><option value="">Thêm món vào order</option>{menuItems.filter((item) => item.isAvailable).map((item) => <option key={item.id} value={item.id}>{item.name} - {formatCurrency(item.price)}</option>)}</select></div>
                  <div className={styles.lineItemList}>{orderEdit.items.map((item, index) => <div key={`${item.menuItemId || item.id}-${index}`} className={styles.lineItemRow}><strong>{item.itemName}</strong><Input type="number" min="1" value={item.quantity} onChange={(event) => updateLineItem(setOrderEdit, index, "quantity", event.target.value)} /><Input type="number" min="0" value={item.unitPrice} onChange={(event) => updateLineItem(setOrderEdit, index, "unitPrice", event.target.value)} /><Button type="button" variant="outline" onClick={() => removeLineItem(setOrderEdit, index)}>Xóa</Button></div>)}</div>
                  <div className={styles.summaryRow}><span>Tạm tính: {formatCurrency(orderEditTotals.subtotal)}</span><span>Tổng: {formatCurrency(orderEditTotals.total)}</span></div>
                  {permissions.canManageOrders ? <div className={styles.detailActions}><Button type="button" className={styles.saveButton} onClick={saveOrderEdit} disabled={orderSaving}>{orderSaving ? "Đang lưu..." : "Lưu order"}</Button></div> : null}
                </div>
              ) : <div className={styles.emptyState}>Chưa có order.</div>}
            </AdminDetailShell>
          </section>
        ) : null}

        {tab === "tables" ? (
          <section className={styles.adminGrid}>
            <AdminListShell>
              <div className={styles.panelToolbar}><Input type="search" placeholder="Tìm bàn..." value={tableQuery} onChange={(event) => setTableQuery(event.target.value)} /><div></div>{permissions.canManageTables ? <Button type="button" variant="secondary" onClick={() => setTableCreateOpen((prev) => !prev)}>{tableCreateOpen ? "Đóng form" : "Tạo bàn"}</Button> : <div></div>}</div>
              {tableCreateOpen && permissions.canManageTables ? <form className={styles.inlineForm} onSubmit={createTableEntry}><Input type="text" placeholder="Tên bàn" value={tableDraft.name} onChange={(event) => setTableDraft((prev) => ({ ...prev, name: event.target.value }))} required /><Input type="text" placeholder="Khu vực" value={tableDraft.area} onChange={(event) => setTableDraft((prev) => ({ ...prev, area: event.target.value }))} /><div className={styles.inlineRow}><Input type="number" min="1" placeholder="Sức chứa" value={tableDraft.capacity} onChange={(event) => setTableDraft((prev) => ({ ...prev, capacity: Number(event.target.value) }))} /><select value={tableDraft.status} onChange={(event) => setTableDraft((prev) => ({ ...prev, status: event.target.value }))}>{tableStatuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></div><Textarea placeholder="Ghi chú" rows={3} value={tableDraft.notes} onChange={(event) => setTableDraft((prev) => ({ ...prev, notes: event.target.value }))} /><Button type="submit" disabled={tableSaving}>{tableSaving ? "Đang tạo..." : "Lưu bàn"}</Button></form> : null}
              <div className={styles.tableWrap}><table className={styles.dataTable}><thead><tr><th>Bàn</th><th>Khu vực</th><th>Sức chứa</th><th>Trạng thái</th></tr></thead><tbody>{filteredTables.map((item) => <tr key={item.id} className={item.id === selectedTable?.id ? styles.activeRow : ""} onClick={() => setSelectedTableId(item.id)}><td><strong>{item.name}</strong><span>{formatCurrency(item.minSpend)}</span></td><td>{item.area}</td><td>{item.capacity}</td><td><span className={`${styles.statusBadge} ${styles[`status_${item.status}`] || styles.status_new}`}>{item.status}</span></td></tr>)}</tbody></table></div>
            </AdminListShell>
            <AdminDetailShell>{selectedTable ? <AdminSurfaceCard kicker="Chi tiết bàn" title={selectedTable.name} actions={permissions.canManageTables ? <Button className={styles.deleteButton} variant="destructive" type="button" onClick={() => deleteTableEntry(selectedTable.id)}>Xóa bàn</Button> : null} className={styles.subsectionCard}><div className={styles.editGrid}><label><span>Tên bàn</span><Input type="text" value={tableEdit.name} disabled={!permissions.canManageTables} onChange={(event) => setTableEdit((prev) => ({ ...prev, name: event.target.value }))} /></label><label><span>Khu vực</span><Input type="text" value={tableEdit.area} disabled={!permissions.canManageTables} onChange={(event) => setTableEdit((prev) => ({ ...prev, area: event.target.value }))} /></label><label><span>Sức chứa</span><Input type="number" min="1" value={tableEdit.capacity} disabled={!permissions.canManageTables} onChange={(event) => setTableEdit((prev) => ({ ...prev, capacity: Number(event.target.value) }))} /></label><label><span>Trạng thái</span><select value={tableEdit.status} disabled={!permissions.canManageTables} onChange={(event) => setTableEdit((prev) => ({ ...prev, status: event.target.value }))}>{tableStatuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></label><label className={styles.fullWidth}><span>Ghi chú</span><Textarea rows={5} value={tableEdit.notes} disabled={!permissions.canManageTables} onChange={(event) => setTableEdit((prev) => ({ ...prev, notes: event.target.value }))} /></label></div>{permissions.canManageTables ? <div className={styles.detailActions}><Button type="button" className={styles.saveButton} onClick={saveTableEdit} disabled={tableSaving}>{tableSaving ? "Đang lưu..." : "Lưu bàn"}</Button></div> : null}</AdminSurfaceCard> : <div className={styles.emptyState}>Chưa có bàn.</div>}</AdminDetailShell>
          </section>
        ) : null}

        {tab === "menu" ? (
          <section className={styles.adminGrid}>
            <AdminListShell>
              <div className={styles.panelToolbar}><Input type="search" placeholder="Tìm món..." value={menuQuery} onChange={(event) => setMenuQuery(event.target.value)} /><div></div>{permissions.canManageMenu ? <Button type="button" variant="secondary" onClick={() => setMenuCreateOpen((prev) => !prev)}>{menuCreateOpen ? "Đóng form" : "Tạo món"}</Button> : <div></div>}</div>
              {menuCreateOpen && permissions.canManageMenu ? <form className={styles.inlineForm} onSubmit={createMenuItemEntry}><Input type="text" placeholder="Tên món" value={menuDraft.name} onChange={(event) => setMenuDraft((prev) => ({ ...prev, name: event.target.value }))} required /><Input type="text" placeholder="Danh mục" value={menuDraft.category} onChange={(event) => setMenuDraft((prev) => ({ ...prev, category: event.target.value }))} /><div className={styles.inlineRow}><Input type="number" min="0" placeholder="Giá" value={menuDraft.price} onChange={(event) => setMenuDraft((prev) => ({ ...prev, price: Number(event.target.value) }))} /><select value={menuDraft.spicyLevel} onChange={(event) => setMenuDraft((prev) => ({ ...prev, spicyLevel: event.target.value }))}>{spicyLevels.map((item) => <option key={item} value={item}>{item}</option>)}</select></div><div className={styles.inlineRow}><select value={menuDraft.availabilityStatus} onChange={(event) => setMenuDraft((prev) => ({ ...prev, availabilityStatus: event.target.value }))}>{availabilityStatuses.map((item) => <option key={item} value={item}>{item}</option>)}</select><select value={menuDraft.isFeatured ? "yes" : "no"} onChange={(event) => setMenuDraft((prev) => ({ ...prev, isFeatured: event.target.value === "yes" }))}><option value="yes">featured</option><option value="no">normal</option></select></div><Input type="text" placeholder="Image URL" value={menuDraft.imageUrl} onChange={(event) => setMenuDraft((prev) => ({ ...prev, imageUrl: event.target.value }))} /><Textarea placeholder="Ghi chú theo mùa / tồn kho" rows={2} value={menuDraft.seasonNote} onChange={(event) => setMenuDraft((prev) => ({ ...prev, seasonNote: event.target.value }))} /><Textarea placeholder="Mô tả" rows={3} value={menuDraft.description} onChange={(event) => setMenuDraft((prev) => ({ ...prev, description: event.target.value }))} /><Button type="submit" disabled={menuSaving}>{menuSaving ? "Đang tạo..." : "Lưu món"}</Button></form> : null}
              <div className={styles.tableWrap}><table className={styles.dataTable}><thead><tr><th>Món</th><th>Danh mục</th><th>Giá</th><th>Trạng thái</th></tr></thead><tbody>{filteredMenuItems.map((item) => <tr key={item.id} className={item.id === selectedMenuItem?.id ? styles.activeRow : ""} onClick={() => setSelectedMenuId(item.id)}><td><strong>{item.name}</strong><span>{item.slug}</span></td><td>{item.category}</td><td>{formatCurrency(item.price)}</td><td><span className={`${styles.statusBadge} ${styles[`status_${item.availabilityStatus || (item.isAvailable ? "confirmed" : "cancelled")}`] || styles.status_confirmed}`}>{item.availabilityStatus || (item.isAvailable ? "available" : "hidden")}</span></td></tr>)}</tbody></table></div>
            </AdminListShell>
            <AdminDetailShell>{selectedMenuItem ? <AdminSurfaceCard kicker="Chi tiết món ăn" title={selectedMenuItem.name} actions={permissions.canManageMenu ? <Button className={styles.deleteButton} variant="destructive" type="button" onClick={() => deleteMenuItemEntry(selectedMenuItem.id)}>Xóa món</Button> : null} className={styles.subsectionCard}><div className={styles.editGrid}><label><span>Tên món</span><Input type="text" value={menuEdit.name} disabled={!permissions.canManageMenu} onChange={(event) => setMenuEdit((prev) => ({ ...prev, name: event.target.value }))} /></label><label><span>Slug</span><Input type="text" value={menuEdit.slug} disabled={!permissions.canManageMenu} onChange={(event) => setMenuEdit((prev) => ({ ...prev, slug: event.target.value }))} /></label><label><span>Danh mục</span><Input type="text" value={menuEdit.category} disabled={!permissions.canManageMenu} onChange={(event) => setMenuEdit((prev) => ({ ...prev, category: event.target.value }))} /></label><label><span>Giá</span><Input type="number" min="0" value={menuEdit.price} disabled={!permissions.canManageMenu} onChange={(event) => setMenuEdit((prev) => ({ ...prev, price: Number(event.target.value) }))} /></label><label><span>Image URL</span><Input type="text" value={menuEdit.imageUrl} disabled={!permissions.canManageMenu} onChange={(event) => setMenuEdit((prev) => ({ ...prev, imageUrl: event.target.value }))} /></label><label><span>Available</span><select value={menuEdit.isAvailable ? "yes" : "no"} disabled={!permissions.canManageMenu} onChange={(event) => setMenuEdit((prev) => ({ ...prev, isAvailable: event.target.value === "yes" }))}><option value="yes">yes</option><option value="no">no</option></select></label><label><span>Featured</span><select value={menuEdit.isFeatured ? "yes" : "no"} disabled={!permissions.canManageMenu} onChange={(event) => setMenuEdit((prev) => ({ ...prev, isFeatured: event.target.value === "yes" }))}><option value="yes">yes</option><option value="no">no</option></select></label><label><span>Spicy level</span><select value={menuEdit.spicyLevel} disabled={!permissions.canManageMenu} onChange={(event) => setMenuEdit((prev) => ({ ...prev, spicyLevel: event.target.value }))}>{spicyLevels.map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label><span>Trạng thái món</span><select value={menuEdit.availabilityStatus || "available"} disabled={!permissions.canManageMenu} onChange={(event) => setMenuEdit((prev) => ({ ...prev, availabilityStatus: event.target.value }))}>{availabilityStatuses.map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label className={styles.fullWidth}><span>Ghi chú theo mùa / tồn kho</span><Textarea rows={3} value={menuEdit.seasonNote || ""} disabled={!permissions.canManageMenu} onChange={(event) => setMenuEdit((prev) => ({ ...prev, seasonNote: event.target.value }))} /></label><label className={styles.fullWidth}><span>Mô tả</span><Textarea rows={5} value={menuEdit.description} disabled={!permissions.canManageMenu} onChange={(event) => setMenuEdit((prev) => ({ ...prev, description: event.target.value }))} /></label></div>{permissions.canManageMenu ? <div className={styles.detailActions}><Button type="button" className={styles.saveButton} onClick={saveMenuEdit} disabled={menuSaving}>{menuSaving ? "Đang lưu..." : "Lưu món"}</Button></div> : null}</AdminSurfaceCard> : <div className={styles.emptyState}>Chưa có món ăn.</div>}</AdminDetailShell>
          </section>
        ) : null}

        {tab === "vouchers" ? (
          <section className={styles.adminGrid}>
            <AdminListShell>
              <div className={styles.panelToolbar}>
                <Input
                  type="search"
                  placeholder="Tìm voucher..."
                  value={voucherQuery}
                  onChange={(event) => setVoucherQuery(event.target.value)}
                />
                <Select value={voucherStatus} onValueChange={setVoucherStatus}>
                  <SelectTrigger><SelectValue placeholder="Trạng thái voucher" /></SelectTrigger>
                  <SelectContent>
                    {voucherStatuses.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className={styles.statsStrip}>
                <AdminStatCard
                  label="Campaign active"
                  value={voucherStats.campaigns}
                  detail={`${voucherStats.redeemed} voucher da redeem`}
                  accent="warm"
                />
                <AdminStatCard
                  label="Loyalty members"
                  value={loyaltyStats.members}
                  detail={`${loyaltyStats.redemptions} redemption da ghi nhan`}
                  accent="soft"
                />
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
            </AdminListShell>
            <AdminDetailShell>
              <AdminSurfaceCard
                kicker="Voucher campaigns"
                title="Campaign & loyalty"
                actions={permissions.canManageVouchers ? (
                  <Button type="button" variant="secondary" onClick={() => setCampaignCreateOpen((prev) => !prev)}>
                    {campaignCreateOpen ? "Đóng form" : "Tạo campaign"}
                  </Button>
                ) : null}
                className={styles.subsectionCard}
              >
                {campaignCreateOpen && permissions.canManageVouchers ? (
                  <form className={styles.inlineForm} onSubmit={createVoucherCampaignEntry}>
                    <Input
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
                    <Input
                      type="text"
                      placeholder="Mã campaign"
                      value={campaignDraft.code}
                      onChange={(event) =>
                        setCampaignDraft((prev) => ({ ...prev, code: event.target.value }))
                      }
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
                        <SelectTrigger><SelectValue placeholder="Kiểu ưu đãi" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percent">percent</SelectItem>
                          <SelectItem value="amount">amount</SelectItem>
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
                      placeholder="Mô tả campaign"
                      value={campaignDraft.description}
                      onChange={(event) =>
                        setCampaignDraft((prev) => ({ ...prev, description: event.target.value }))
                      }
                    />
                    <Button type="submit" disabled={voucherSaving}>
                      {voucherSaving ? "Đang tạo..." : "Lưu campaign"}
                    </Button>
                  </form>
                ) : null}
                <div className={styles.campaignRail}>
                  {voucherCampaigns.map((campaign) => (
                    <Button
                      key={campaign.id}
                      type="button"
                      variant="ghost"
                      className={`${styles.campaignTile} ${
                        campaign.id === selectedVoucherCampaign?.id ? styles.campaignTileActive : ""
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
                      <span>Mã campaign</span>
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
                      <span>Valid days</span>
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
                          Xóa campaign
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
                  actions={(
                    <div className={styles.detailActions}>
                      {permissions.canManageVouchers ? (
                        <Button
                          type="button"
                          className={styles.saveButton}
                          onClick={() => redeemVoucher(selectedVoucher)}
                          disabled={voucherSaving}
                        >
                          {voucherSaving ? "Đang xử lý..." : "Redeem + tích điểm"}
                        </Button>
                      ) : null}
                      {permissions.canManageVouchers ? (
                        <Button
                          className={styles.deleteButton}
                          variant="destructive"
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
                        </Button>
                      ) : null}
                    </div>
                  )}
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
                <div className={styles.emptyState}>Chưa có voucher.</div>
              )}

              <AdminSurfaceCard
                kicker="Loyalty"
                title="Top khách hàng giữ chân"
                className={styles.subsectionCard}
              >
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
              </AdminSurfaceCard>
            </AdminDetailShell>
          </section>
        ) : null}

        {tab === "drivers" && permissions.canViewDrivers ? (
          <section className={styles.adminGrid}>
            <AdminListShell>
              <div className={styles.panelToolbar}>
                <Input
                  type="search"
                  placeholder="Tìm tài xế / mã giới thiệu..."
                  value={driverQuery}
                  onChange={(event) => setDriverQuery(event.target.value)}
                />
                <div></div>
                {permissions.canManageDrivers ? (
                  <Button type="button" variant="secondary" onClick={() => setDriverCreateOpen((prev) => !prev)}>
                    {driverCreateOpen ? "Đóng form" : "Tạo tài xế"}
                  </Button>
                ) : (
                  <div></div>
                )}
              </div>
              {driverCreateOpen && permissions.canManageDrivers ? (
                <form className={styles.inlineForm} onSubmit={createDriverEntry}>
                  <Input type="text" placeholder="Mã tài xế" value={driverDraft.code} onChange={(event) => setDriverDraft((prev) => ({ ...prev, code: event.target.value }))} required />
                  <Input type="text" placeholder="Tên tài xế" value={driverDraft.fullName} onChange={(event) => setDriverDraft((prev) => ({ ...prev, fullName: event.target.value }))} required />
                  <div className={styles.inlineRow}>
                    <Input type="tel" placeholder="SĐT" value={driverDraft.phone} onChange={(event) => setDriverDraft((prev) => ({ ...prev, phone: event.target.value }))} required />
                    <Input type="text" placeholder="Loại xe" value={driverDraft.vehicleType} onChange={(event) => setDriverDraft((prev) => ({ ...prev, vehicleType: event.target.value }))} />
                  </div>
                  <div className={styles.inlineRow}>
                    <Input type="text" placeholder="Mã giới thiệu" value={driverDraft.referralCode} onChange={(event) => setDriverDraft((prev) => ({ ...prev, referralCode: event.target.value }))} />
                    <Input type="number" min="0" placeholder="% hoa hồng" value={driverDraft.commissionRate} onChange={(event) => setDriverDraft((prev) => ({ ...prev, commissionRate: Number(event.target.value) }))} />
                  </div>
                  <Textarea placeholder="Ghi chú" rows={3} value={driverDraft.notes} onChange={(event) => setDriverDraft((prev) => ({ ...prev, notes: event.target.value }))} />
                  <Button type="submit" disabled={tableSaving}>{tableSaving ? "Đang tạo..." : "Lưu tài xế"}</Button>
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
            </AdminListShell>
            <AdminDetailShell>
              {selectedDriver ? (
                <div>
                  <AdminDetailHeader
                    kicker="Driver / Referral"
                    title={selectedDriver.fullName}
                    actions={permissions.canManageDrivers ? (
                      <Button className={styles.deleteButton} variant="destructive" type="button" onClick={() => deleteDriverEntry(selectedDriver.id)}>
                        Xóa tài xế
                      </Button>
                    ) : null}
                  />
                  <div className={styles.metaGrid}>
                    <div><span>Mã tài xế</span><strong>{selectedDriver.code}</strong></div>
                    <div><span>Mã giới thiệu</span><strong>{selectedDriver.referralCode || "-"}</strong></div>
                    <div><span>Hoa hồng</span><strong>{selectedDriver.commissionRate}%</strong></div>
                    <div><span>Pending payout</span><strong>{formatCurrency(driverCommissions.filter((item) => item.driverId === selectedDriver.id && item.status === "pending").reduce((sum, item) => sum + item.commissionAmount, 0))}</strong></div>
                  </div>
                  <div className={styles.editGrid}>
                    <label><span>Tên tài xế</span><Input type="text" value={driverEdit.fullName} disabled={!permissions.canManageDrivers} onChange={(event) => setDriverEdit((prev) => ({ ...prev, fullName: event.target.value }))} /></label>
                    <label><span>SĐT</span><Input type="text" value={driverEdit.phone} disabled={!permissions.canManageDrivers} onChange={(event) => setDriverEdit((prev) => ({ ...prev, phone: event.target.value }))} /></label>
                    <label><span>Loại xe</span><Input type="text" value={driverEdit.vehicleType} disabled={!permissions.canManageDrivers} onChange={(event) => setDriverEdit((prev) => ({ ...prev, vehicleType: event.target.value }))} /></label>
                    <label><span>% hoa hồng</span><Input type="number" min="0" value={driverEdit.commissionRate} disabled={!permissions.canManageDrivers} onChange={(event) => setDriverEdit((prev) => ({ ...prev, commissionRate: Number(event.target.value) }))} /></label>
                    <label><span>Mã giới thiệu</span><Input type="text" value={driverEdit.referralCode} disabled={!permissions.canManageDrivers} onChange={(event) => setDriverEdit((prev) => ({ ...prev, referralCode: event.target.value }))} /></label>
                    <label><span>Trạng thái</span><select value={driverEdit.status} disabled={!permissions.canManageDrivers} onChange={(event) => setDriverEdit((prev) => ({ ...prev, status: event.target.value }))}>{driverStatuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
                    <label className={styles.fullWidth}><span>Ghi chú</span><Textarea rows={4} value={driverEdit.notes} disabled={!permissions.canManageDrivers} onChange={(event) => setDriverEdit((prev) => ({ ...prev, notes: event.target.value }))} /></label>
                  </div>
                  {permissions.canManageDrivers ? <div className={styles.detailActions}><Button type="button" className={styles.saveButton} onClick={saveDriverEdit} disabled={tableSaving}>{tableSaving ? "Đang lưu..." : "Lưu tài xế"}</Button></div> : null}
                  <AdminSurfaceCard
                    kicker="Referral gần đây"
                    title="Lead do tài xế giới thiệu"
                    className={styles.subsectionCard}
                  >
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
                  </AdminSurfaceCard>
                  <AdminSurfaceCard
                    kicker="Commission"
                    title="Giao dịch hoa hồng"
                    className={styles.subsectionCard}
                  >
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
                  </AdminSurfaceCard>
                </div>
              ) : (
                <div className={styles.emptyState}>Chưa có tài xế.</div>
              )}
            </AdminDetailShell>
          </section>
        ) : null}

        {tab === "partners" && permissions.canViewPartners ? (
          <section className={styles.adminGrid}>
            <AdminListShell>
              <div className={styles.panelToolbar}>
                <Input
                  type="search"
                  placeholder="Tìm đối tác / HDV..."
                  value={partnerQuery}
                  onChange={(event) => setPartnerQuery(event.target.value)}
                />
                <div></div>
                {permissions.canManagePartners ? (
                  <Button type="button" variant="secondary" onClick={() => setPartnerCreateOpen((prev) => !prev)}>
                    {partnerCreateOpen ? "Đóng form" : "Tạo đối tác"}
                  </Button>
                ) : (
                  <div></div>
                )}
              </div>
              {partnerCreateOpen && permissions.canManagePartners ? (
                <form className={styles.inlineForm} onSubmit={createPartnerEntry}>
                  <Input type="text" placeholder="Mã đối tác" value={partnerDraft.code} onChange={(event) => setPartnerDraft((prev) => ({ ...prev, code: event.target.value }))} required />
                  <Input type="text" placeholder="Tên đối tác / HDV" value={partnerDraft.name} onChange={(event) => setPartnerDraft((prev) => ({ ...prev, name: event.target.value }))} required />
                  <div className={styles.inlineRow}>
                    <select value={partnerDraft.partnerType} onChange={(event) => setPartnerDraft((prev) => ({ ...prev, partnerType: event.target.value }))}>{partnerTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select>
                    <select value={partnerDraft.status} onChange={(event) => setPartnerDraft((prev) => ({ ...prev, status: event.target.value }))}>{partnerStatuses.map((status) => <option key={status} value={status}>{status}</option>)}</select>
                  </div>
                  <div className={styles.inlineRow}>
                    <Input type="text" placeholder="Người liên hệ" value={partnerDraft.contactName} onChange={(event) => setPartnerDraft((prev) => ({ ...prev, contactName: event.target.value }))} />
                    <Input type="tel" placeholder="SĐT" value={partnerDraft.phone} onChange={(event) => setPartnerDraft((prev) => ({ ...prev, phone: event.target.value }))} required />
                  </div>
                  <div className={styles.inlineRow}>
                    <Input type="email" placeholder="Email" value={partnerDraft.email} onChange={(event) => setPartnerDraft((prev) => ({ ...prev, email: event.target.value }))} />
                    <Input type="number" min="0" placeholder="Hoa hồng / chiết khấu" value={partnerDraft.commissionValue} onChange={(event) => setPartnerDraft((prev) => ({ ...prev, commissionValue: Number(event.target.value) }))} />
                  </div>
                  <div className={styles.inlineRow}>
                    <select value={partnerDraft.commissionType} onChange={(event) => setPartnerDraft((prev) => ({ ...prev, commissionType: event.target.value }))}>
                      <option value="percent">percent</option>
                      <option value="amount">amount</option>
                    </select>
                    <Input type="datetime-local" placeholder="Bắt đầu hợp tác" value={partnerDraft.contractStartAt} onChange={(event) => setPartnerDraft((prev) => ({ ...prev, contractStartAt: event.target.value }))} />
                  </div>
                  <Input type="datetime-local" placeholder="Kết thúc hợp tác" value={partnerDraft.contractEndAt} onChange={(event) => setPartnerDraft((prev) => ({ ...prev, contractEndAt: event.target.value }))} />
                  <Textarea placeholder="Ghi chú" rows={3} value={partnerDraft.notes} onChange={(event) => setPartnerDraft((prev) => ({ ...prev, notes: event.target.value }))} />
                  <Button type="submit" disabled={partnerSaving}>{partnerSaving ? "Đang tạo..." : "Lưu đối tác"}</Button>
                </form>
              ) : null}
              <div className={styles.tableWrap}>
                <table className={styles.dataTable}>
                  <thead><tr><th>Đối tác</th><th>Loại</th><th>Hoa hồng</th><th>Trạng thái</th></tr></thead>
                  <tbody>
                    {filteredPartners.map((item) => (
                      <tr key={item.id} className={item.id === selectedPartner?.id ? styles.activeRow : ""} onClick={() => setSelectedPartnerId(item.id)}>
                        <td><strong>{item.name}</strong><span>{item.contactName || item.phone}</span></td>
                        <td>{item.partnerType}</td>
                        <td>{item.commissionType === "amount" ? formatCurrency(item.commissionValue) : `${item.commissionValue}%`}</td>
                        <td><span className={`${styles.statusBadge} ${styles[`status_${item.status}`] || styles.status_confirmed}`}>{item.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </AdminListShell>
            <AdminDetailShell>
              {selectedPartner ? (
                <div>
                  <AdminDetailHeader
                    kicker="Travel partner / HDV"
                    title={selectedPartner.name}
                  />
                  {permissions.canManagePartners ? (
                    <div className={styles.detailHeading} style={{ justifyContent: "flex-end", marginTop: "-16px" }}>
                      <Button className={styles.deleteButton} variant="destructive" type="button" onClick={() => deletePartnerEntry(selectedPartner.id)}>Xóa đối tác</Button>
                    </div>
                  ) : null}
                  <div className={styles.metaGrid}>
                    <div><span>Mã đối tác</span><strong>{selectedPartner.code}</strong></div>
                    <div><span>Loại</span><strong>{selectedPartner.partnerType}</strong></div>
                    <div><span>Booking mở</span><strong>{partnerBookings.filter((item) => item.partnerId === selectedPartner.id && ["lead", "confirmed"].includes(item.status)).length}</strong></div>
                    <div><span>Tổng ngân sách</span><strong>{formatCurrency(partnerBookings.filter((item) => item.partnerId === selectedPartner.id).reduce((sum, item) => sum + Number(item.menuBudget || 0), 0))}</strong></div>
                  </div>
                  <div className={styles.editGrid}>
                    <label><span>Tên đối tác</span><Input type="text" value={partnerEdit.name} disabled={!permissions.canManagePartners} onChange={(event) => setPartnerEdit((prev) => ({ ...prev, name: event.target.value }))} /></label>
                    <label><span>Người liên hệ</span><Input type="text" value={partnerEdit.contactName} disabled={!permissions.canManagePartners} onChange={(event) => setPartnerEdit((prev) => ({ ...prev, contactName: event.target.value }))} /></label>
                    <label><span>SĐT</span><Input type="text" value={partnerEdit.phone} disabled={!permissions.canManagePartners} onChange={(event) => setPartnerEdit((prev) => ({ ...prev, phone: event.target.value }))} /></label>
                    <label><span>Email</span><Input type="text" value={partnerEdit.email} disabled={!permissions.canManagePartners} onChange={(event) => setPartnerEdit((prev) => ({ ...prev, email: event.target.value }))} /></label>
                    <label><span>Loại</span><select value={partnerEdit.partnerType} disabled={!permissions.canManagePartners} onChange={(event) => setPartnerEdit((prev) => ({ ...prev, partnerType: event.target.value }))}>{partnerTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
                    <label><span>Trạng thái</span><select value={partnerEdit.status} disabled={!permissions.canManagePartners} onChange={(event) => setPartnerEdit((prev) => ({ ...prev, status: event.target.value }))}>{partnerStatuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
                    <label><span>Kiểu chiết khấu</span><select value={partnerEdit.commissionType} disabled={!permissions.canManagePartners} onChange={(event) => setPartnerEdit((prev) => ({ ...prev, commissionType: event.target.value }))}><option value="percent">percent</option><option value="amount">amount</option></select></label>
                    <label><span>Giá trị</span><Input type="number" min="0" value={partnerEdit.commissionValue} disabled={!permissions.canManagePartners} onChange={(event) => setPartnerEdit((prev) => ({ ...prev, commissionValue: Number(event.target.value) }))} /></label>
                    <label><span>Bắt đầu hợp tác</span><Input type="datetime-local" value={partnerEdit.contractStartAt ? String(partnerEdit.contractStartAt).slice(0, 16) : ""} disabled={!permissions.canManagePartners} onChange={(event) => setPartnerEdit((prev) => ({ ...prev, contractStartAt: event.target.value }))} /></label>
                    <label><span>Kết thúc hợp tác</span><Input type="datetime-local" value={partnerEdit.contractEndAt ? String(partnerEdit.contractEndAt).slice(0, 16) : ""} disabled={!permissions.canManagePartners} onChange={(event) => setPartnerEdit((prev) => ({ ...prev, contractEndAt: event.target.value }))} /></label>
                    <label className={styles.fullWidth}><span>Ghi chú</span><Textarea rows={4} value={partnerEdit.notes} disabled={!permissions.canManagePartners} onChange={(event) => setPartnerEdit((prev) => ({ ...prev, notes: event.target.value }))} /></label>
                  </div>
                  {permissions.canManagePartners ? <div className={styles.detailActions}><Button type="button" className={styles.saveButton} onClick={savePartnerEdit} disabled={partnerSaving}>{partnerSaving ? "Đang lưu..." : "Lưu đối tác"}</Button></div> : null}
                  <AdminSurfaceCard
                    kicker="Hợp đồng"
                    title="Chính sách áp dụng"
                    actions={permissions.canManagePartnerContracts ? <Button type="button" variant="secondary" onClick={() => setPartnerContractCreateOpen((prev) => !prev)}>{partnerContractCreateOpen ? "Đóng form" : "Thêm hợp đồng"}</Button> : null}
                    className={styles.subsectionCard}
                  >
                    {partnerContractCreateOpen && permissions.canManagePartnerContracts ? (
                      <form className={styles.inlineForm} onSubmit={createPartnerContractEntry}>
                        <Input type="text" placeholder="Tên hợp đồng" value={partnerContractDraft.title} onChange={(event) => setPartnerContractDraft((prev) => ({ ...prev, title: event.target.value }))} required />
                        <div className={styles.inlineRow}>
                          <Input type="number" min="0" placeholder="% chiết khấu" value={partnerContractDraft.discountPercent} onChange={(event) => setPartnerContractDraft((prev) => ({ ...prev, discountPercent: Number(event.target.value) }))} />
                          <Input type="number" min="0" placeholder="% hoa hồng" value={partnerContractDraft.commissionPercent} onChange={(event) => setPartnerContractDraft((prev) => ({ ...prev, commissionPercent: Number(event.target.value) }))} />
                        </div>
                        <div className={styles.inlineRow}>
                          <select value={partnerContractDraft.status} onChange={(event) => setPartnerContractDraft((prev) => ({ ...prev, status: event.target.value }))}>{partnerContractStatuses.map((status) => <option key={status} value={status}>{status}</option>)}</select>
                          <Input type="datetime-local" value={partnerContractDraft.startsAt} onChange={(event) => setPartnerContractDraft((prev) => ({ ...prev, startsAt: event.target.value }))} />
                        </div>
                        <Input type="datetime-local" value={partnerContractDraft.endsAt} onChange={(event) => setPartnerContractDraft((prev) => ({ ...prev, endsAt: event.target.value }))} />
                        <Textarea placeholder="Điều khoản thanh toán / ghi chú" rows={3} value={partnerContractDraft.paymentTerms} onChange={(event) => setPartnerContractDraft((prev) => ({ ...prev, paymentTerms: event.target.value }))} />
                        <Button type="submit" disabled={partnerSaving}>{partnerSaving ? "Đang tạo..." : "Lưu hợp đồng"}</Button>
                      </form>
                    ) : null}
                    <div className={styles.logList}>
                      {partnerContracts.filter((item) => item.partnerId === selectedPartner.id).slice(0, 6).map((item) => (
                        <article key={item.id} className={styles.logItem}>
                          <div className={styles.logHead}><strong>{item.title}</strong><span className={`${styles.statusBadge} ${styles[`status_${item.status}`] || styles.status_new}`}>{item.status}</span></div>
                          <small>{formatDate(item.startsAt)} → {formatDate(item.endsAt)}</small>
                          <p>Chiết khấu {item.discountPercent}% • Hoa hồng {item.commissionPercent}%</p>
                        </article>
                      ))}
                      {!partnerContracts.filter((item) => item.partnerId === selectedPartner.id).length ? <div className={styles.emptyState}>Chưa có hợp đồng.</div> : null}
                    </div>
                  </AdminSurfaceCard>
                  <AdminSurfaceCard
                    kicker="Booking đoàn"
                    title="Đơn từ đối tác / HDV"
                    actions={permissions.canManagePartnerBookings ? <Button type="button" variant="secondary" onClick={() => setPartnerBookingCreateOpen((prev) => !prev)}>{partnerBookingCreateOpen ? "Đóng form" : "Tạo booking đoàn"}</Button> : null}
                    className={styles.subsectionCard}
                  >
                    {partnerBookingCreateOpen && permissions.canManagePartnerBookings ? (
                      <form className={styles.inlineForm} onSubmit={createPartnerBookingEntry}>
                        <Input type="text" placeholder="Mã booking" value={partnerBookingDraft.code} onChange={(event) => setPartnerBookingDraft((prev) => ({ ...prev, code: event.target.value }))} />
                        <Input type="text" placeholder="Tên trưởng đoàn / khách" value={partnerBookingDraft.customerName} onChange={(event) => setPartnerBookingDraft((prev) => ({ ...prev, customerName: event.target.value }))} required />
                        <div className={styles.inlineRow}>
                          <Input type="tel" placeholder="SĐT" value={partnerBookingDraft.customerPhone} onChange={(event) => setPartnerBookingDraft((prev) => ({ ...prev, customerPhone: event.target.value }))} required />
                          <Input type="number" min="1" placeholder="Số khách" value={partnerBookingDraft.groupSize} onChange={(event) => setPartnerBookingDraft((prev) => ({ ...prev, groupSize: Number(event.target.value) }))} />
                        </div>
                        <div className={styles.inlineRow}>
                          <Input type="datetime-local" value={partnerBookingDraft.bookingAt} onChange={(event) => setPartnerBookingDraft((prev) => ({ ...prev, bookingAt: event.target.value }))} required />
                          <select value={partnerBookingDraft.status} onChange={(event) => setPartnerBookingDraft((prev) => ({ ...prev, status: event.target.value }))}>{partnerBookingStatuses.map((status) => <option key={status} value={status}>{status}</option>)}</select>
                        </div>
                        <div className={styles.inlineRow}>
                          <Input type="text" placeholder="Set menu / package" value={partnerBookingDraft.packageName} onChange={(event) => setPartnerBookingDraft((prev) => ({ ...prev, packageName: event.target.value }))} />
                          <Input type="number" min="0" placeholder="Ngân sách menu" value={partnerBookingDraft.menuBudget} onChange={(event) => setPartnerBookingDraft((prev) => ({ ...prev, menuBudget: Number(event.target.value) }))} />
                        </div>
                        <div className={styles.inlineRow}>
                          <Input type="number" min="0" placeholder="Chiết khấu" value={partnerBookingDraft.discountAmount} onChange={(event) => setPartnerBookingDraft((prev) => ({ ...prev, discountAmount: Number(event.target.value) }))} />
                          <Input type="number" min="0" placeholder="Hoa hồng" value={partnerBookingDraft.commissionAmount} onChange={(event) => setPartnerBookingDraft((prev) => ({ ...prev, commissionAmount: Number(event.target.value) }))} />
                        </div>
                        <Input type="url" placeholder="Link manifest / danh sách khách" value={partnerBookingDraft.guestManifestUrl} onChange={(event) => setPartnerBookingDraft((prev) => ({ ...prev, guestManifestUrl: event.target.value }))} />
                        <Textarea placeholder="Ghi chú" rows={3} value={partnerBookingDraft.notes} onChange={(event) => setPartnerBookingDraft((prev) => ({ ...prev, notes: event.target.value }))} />
                        <Button type="submit" disabled={partnerSaving}>{partnerSaving ? "Đang tạo..." : "Lưu booking đoàn"}</Button>
                      </form>
                    ) : null}
                    <div className={styles.logList}>
                      {partnerBookings.filter((item) => item.partnerId === selectedPartner.id).slice(0, 8).map((item) => (
                        <article key={item.id} className={styles.logItem}>
                          <div className={styles.logHead}><strong>{item.customerName}</strong><span className={`${styles.statusBadge} ${styles[`status_${item.status}`] || styles.status_new}`}>{item.status}</span></div>
                          <small>{item.code || "Chưa có mã"} • {item.groupSize} khách • {formatDate(item.bookingAt)}</small>
                          <p>{item.packageName || "Chưa chọn set menu"} • Budget {formatCurrency(item.menuBudget)} • Commission {formatCurrency(item.commissionAmount)}</p>
                          <div className={styles.inlineRow}>
                            <select value={item.status} disabled={!permissions.canManagePartnerBookings} onChange={(event) => patchPartnerBooking(item.id, { ...item, status: event.target.value })}>{partnerBookingStatuses.map((status) => <option key={status} value={status}>{status}</option>)}</select>
                            {permissions.canManagePartnerBookings ? <Button type="button" variant="destructive" className={styles.deleteButton} onClick={() => deletePartnerBookingEntry(item.id)}>Xóa</Button> : null}
                          </div>
                        </article>
                      ))}
                      {!partnerBookings.filter((item) => item.partnerId === selectedPartner.id).length ? <div className={styles.emptyState}>Chưa có booking đoàn.</div> : null}
                    </div>
                  </AdminSurfaceCard>
                </div>
              ) : (
                <div className={styles.emptyState}>Chưa có đối tác / HDV.</div>
              )}
            </AdminDetailShell>
          </section>
        ) : null}

        {tab === "integrations" && permissions.canViewIntegrations ? (
          <section className={styles.integrationLayout}>
            <div className={styles.integrationList}>
              {integrations.map((item) => (
                <Button type="button" variant="ghost" key={item.id} className={`${styles.integrationCard} ${item.id === selectedIntegration?.id ? styles.integrationCardActive : ""}`} onClick={() => setSelectedIntegrationId(item.id)}>
                  <div className={styles.integrationCardTop}><strong>{item.name}</strong><span className={`${styles.statusBadge} ${item.enabled ? styles.status_confirmed : styles.status_cancelled}`}>{item.enabled ? "enabled" : "disabled"}</span></div>
                  <small>{item.category.toUpperCase()} • {item.market}</small>
                  <p>{item.description}</p>
                  <span className={styles.integrationMeta}>{item.syncMode === "auto" ? "Tự động đồng bộ" : "Đồng bộ thủ công"}</span>
                </Button>
              ))}
            </div>
            <div className={styles.integrationDetail}>
              {selectedIntegration ? (
                <AdminSurfaceCard
                  kicker="Tích hợp POS/PMS"
                  title={selectedIntegration.name}
                  className={styles.subsectionCard}
                >
                  <div className={styles.editGrid}>
                    <label><span>Trạng thái</span><select defaultValue={selectedIntegration.enabled ? "enabled" : "disabled"} disabled={!permissions.canManageIntegrations} onBlur={(event) => patchIntegration(selectedIntegration.id, { enabled: event.target.value === "enabled" })}><option value="disabled">disabled</option><option value="enabled">enabled</option></select></label>
                    <label><span>Sync mode</span><select defaultValue={selectedIntegration.syncMode} disabled={!permissions.canManageIntegrations} onBlur={(event) => patchIntegration(selectedIntegration.id, { syncMode: event.target.value })}><option value="manual">manual</option><option value="auto">auto</option></select></label>
                    <label className={styles.fullWidth}><span>Endpoint</span><Input type="url" defaultValue={selectedIntegration.endpoint} disabled={!permissions.canManageIntegrations} onBlur={(event) => patchIntegration(selectedIntegration.id, { endpoint: event.target.value })} /></label>
                    <label><span>API key</span><Input type="text" defaultValue={selectedIntegration.apiKey} disabled={!permissions.canManageIntegrations} onBlur={(event) => patchIntegration(selectedIntegration.id, { apiKey: event.target.value })} /></label>
                    <label><span>API secret</span><Input type="text" defaultValue={selectedIntegration.apiSecret} disabled={!permissions.canManageIntegrations} onBlur={(event) => patchIntegration(selectedIntegration.id, { apiSecret: event.target.value })} /></label>
                    <label><span>Location code</span><Input type="text" defaultValue={selectedIntegration.locationCode} disabled={!permissions.canManageIntegrations} onBlur={(event) => patchIntegration(selectedIntegration.id, { locationCode: event.target.value })} /></label>
                    <label><span>Tenant code</span><Input type="text" defaultValue={selectedIntegration.tenantCode} disabled={!permissions.canManageIntegrations} onBlur={(event) => patchIntegration(selectedIntegration.id, { tenantCode: event.target.value })} /></label>
                    <label className={styles.fullWidth}><span>Ghi chú</span><Textarea rows={5} defaultValue={selectedIntegration.notes} disabled={!permissions.canManageIntegrations} onBlur={(event) => patchIntegration(selectedIntegration.id, { notes: event.target.value })} /></label>
                  </div>
                </AdminSurfaceCard>
              ) : null}
              <AdminSurfaceCard
                kicker="Nhật ký đồng bộ"
                title="Lịch sử sync gần đây"
                className={styles.subsectionCard}
              >
                <div className={styles.logList}>{syncLogs.length ? syncLogs.slice(0, 12).map((log) => <article key={log.id} className={styles.logItem}><div className={styles.logHead}><strong>{log.integrationName}</strong><span className={`${styles.statusBadge} ${log.ok ? styles.status_confirmed : styles.status_cancelled}`}>{log.ok ? `OK ${log.status}` : `ERR ${log.status}`}</span></div><small>Reservation: {log.reservationId || "-"}</small><small>{formatDate(log.createdAt)}</small><p>{log.responsePreview || "Không có nội dung phản hồi."}</p></article>) : <div className={styles.emptyState}>Chưa có log đồng bộ.</div>}</div>
              </AdminSurfaceCard>
            </div>
          </section>
        ) : null}
      </section>
      </div>
    </main>
  );
}
