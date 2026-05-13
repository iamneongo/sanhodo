"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminBranchesSection from "./admin/sections/admin-branches-section";
import AdminHeader from "./admin/admin-header";
import AdminIntegrationsSection from "./admin/sections/admin-integrations-section";
import AdminMenuSection from "./admin/sections/admin-menu-section";
import AdminOverviewSection from "./admin/sections/admin-overview-section";
import AdminOrdersSection from "./admin/sections/admin-orders-section";
import AdminPartnersSection from "./admin/sections/admin-partners-section";
import AdminReservationsSection from "./admin/sections/admin-reservations-section";
import AdminDriversSection from "./admin/sections/admin-drivers-section";
import AdminStaffSection from "./admin/sections/admin-staff-section";
import AdminTablesSection from "./admin/sections/admin-tables-section";
import AdminVouchersSection from "./admin/sections/admin-vouchers-section";
import AppSidebar from "./admin/app-sidebar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ADMIN_SECTIONS, getAdminSectionLabel } from "../lib/admin-sections";
import { formatVoucherBenefit } from "../lib/business-rules";
import { hasAdminPermission } from "../lib/admin-permissions";
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
  { value: "draft", label: "Nháp" },
  { value: "confirmed", label: "Đã xác nhận" },
  { value: "preparing", label: "Đang chuẩn bị" },
  { value: "served", label: "Đã phục vụ" },
  { value: "paid", label: "Đã thanh toán" },
  { value: "cancelled", label: "Đã hủy" }
];

const valueLabels = {
  draft: "Nháp",
  confirmed: "Đã xác nhận",
  contacted: "Đã liên hệ",
  preparing: "Đang chuẩn bị",
  served: "Đã phục vụ",
  paid: "Đã thanh toán",
  cancelled: "Đã hủy",
  new: "Mới",
  qualified: "Đủ điều kiện",
  used: "Đã dùng",
  closed: "Đã chốt",
  available: "Sẵn phục vụ",
  reserved: "Đã giữ",
  occupied: "Đang phục vụ",
  cleaning: "Đang dọn",
  inactive: "Ngưng dùng",
  none: "Không cay",
  mild: "Cay nhẹ",
  medium: "Cay vừa",
  hot: "Cay nhiều",
  low_stock: "Số lượng giới hạn",
  seasonal: "Theo mùa",
  sold_out: "Hết món",
  active: "Đang hoạt động",
  blocked: "Đã khóa",
  paused: "Tạm dừng",
  pending: "Đang chờ",
  approved: "Đã duyệt",
  agency: "Đại lý",
  hdv: "Hướng dẫn viên",
  hotel: "Khách sạn",
  corporate: "Doanh nghiệp",
  lead: "Tiềm năng",
  arrived: "Đã tới",
  completed: "Hoàn tất",
  expired: "Hết hạn",
  terminated: "Đã chấm dứt",
  admin: "Nội bộ",
  website: "Website",
  reservation: "Từ đặt bàn",
  "walk-in": "Khách vãng lai",
  phone: "Điện thoại",
  zalo: "Zalo",
  percent: "Phần trăm",
  amount: "Số tiền",
  manual: "Thủ công",
  auto: "Tự động",
  enabled: "Đang bật",
  disabled: "Đang tắt",
  hidden: "Ẩn"
};

const reservationSortOptions = [
  { value: "newest", label: "Mới nhất" },
  { value: "oldest", label: "Cũ nhất" },
  { value: "guests_desc", label: "Nhiều khách nhất" },
  { value: "name_asc", label: "Tên A-Z" }
];

const orderSortOptions = [
  { value: "newest", label: "Mới nhất" },
  { value: "oldest", label: "Cũ nhất" },
  { value: "total_desc", label: "Tổng tiền cao nhất" },
  { value: "customer_asc", label: "Khách hàng A-Z" }
];

const voucherSortOptions = [
  { value: "newest", label: "Mới nhất" },
  { value: "oldest", label: "Cũ nhất" },
  { value: "code_asc", label: "Mã A-Z" },
  { value: "value_desc", label: "Ưu đãi cao nhất" }
];

const tableSortOptions = [
  { value: "name_asc", label: "Tên bàn A-Z" },
  { value: "capacity_desc", label: "Sức chứa cao nhất" },
  { value: "area_asc", label: "Khu vực A-Z" }
];

const menuSortOptions = [
  { value: "name_asc", label: "Tên món A-Z" },
  { value: "price_desc", label: "Giá cao nhất" },
  { value: "price_asc", label: "Giá thấp nhất" },
  { value: "featured_first", label: "Ưu tiên món nổi bật" }
];

const driverSortOptions = [
  { value: "name_asc", label: "Tên A-Z" },
  { value: "commission_desc", label: "Hoa hồng cao nhất" },
  { value: "status_asc", label: "Theo trạng thái" }
];

const partnerSortOptions = [
  { value: "name_asc", label: "Tên A-Z" },
  { value: "type_asc", label: "Loại đối tác" },
  { value: "commission_desc", label: "Hoa hồng cao nhất" }
];

const staffSortOptions = [
  { value: "name_asc", label: "Tên A-Z" },
  { value: "role_asc", label: "Vai trò" },
  { value: "updated_desc", label: "Cập nhật gần nhất" }
];

const branchSortOptions = [
  { value: "sort_asc", label: "Thứ tự hiển thị" },
  { value: "name_asc", label: "Tên A-Z" },
  { value: "newest", label: "Mới tạo gần đây" }
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
  admin: "Quản trị viên",
  manager: "Quản lý",
  staff: "Nhân viên",
  super_admin: "Quản trị tổng",
  branch_manager: "Quản lý chi nhánh",
  driver: "Tài xế"
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

function formatLabel(value) {
  return valueLabels[value] || value;
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

function getDetailTitle({
  currentSection,
  detailOnlyLayout,
  selectedManagedBranch,
  selectedReservation,
  selectedOrder,
  selectedTable,
  selectedMenuItem,
  selectedVoucher,
  selectedDriver,
  selectedPartner,
  selectedIntegration
}) {
  if (!detailOnlyLayout) return "";

  if (currentSection === "branches") return selectedManagedBranch?.name || "Chi tiết";
  if (currentSection === "staff") return selectedStaff?.fullName || selectedStaff?.email || "Chi tiết";
  if (currentSection === "reservations") return selectedReservation?.name || "Chi tiết";
  if (currentSection === "orders") return selectedOrder?.customerName || "Chi tiết";
  if (currentSection === "tables") return selectedTable?.name || "Chi tiết";
  if (currentSection === "menu") return selectedMenuItem?.name || "Chi tiết";
  if (currentSection === "vouchers") return selectedVoucher?.voucherCode || selectedVoucher?.phone || "Chi tiết";
  if (currentSection === "drivers") return selectedDriver?.fullName || "Chi tiết";
  if (currentSection === "partners") return selectedPartner?.name || "Chi tiết";
  if (currentSection === "integrations") return selectedIntegration?.name || "Chi tiết";

  return "Chi tiết";
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

function sortBranches(items = []) {
  return [...items].sort((a, b) => {
    const sortDiff = Number(a.sortOrder || 0) - Number(b.sortOrder || 0);
    if (sortDiff !== 0) return sortDiff;
    return String(a.name || "").localeCompare(String(b.name || ""), "vi");
  });
}

function sortItems(items, mode, comparators) {
  const comparator = comparators[mode] || comparators.default;
  return [...items].sort(comparator);
}

function FormSelect({
  value,
  onValueChange,
  options,
  placeholder = "Chọn giá trị",
  disabled = false,
  className = ""
}) {
  return (
    <Select value={value ?? ""} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => {
          const normalized =
            typeof option === "string"
              ? { value: option, label: formatLabel(option) }
              : { ...option, label: option.label || formatLabel(option.value) };
          return (
            <SelectItem key={normalized.value} value={String(normalized.value)}>
              {normalized.label}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
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

function createEmptyBranchDraft() {
  return {
    code: "",
    name: "",
    shortName: "",
    address: "",
    phone: "",
    isActive: true,
    sortOrder: 0
  };
}

function createEmptyBranchStaffDraft(branchId = "") {
  return {
    branchId,
    profileId: "",
    role: "staff",
    isPrimary: false
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
  activeSection = "overview",
  detailMode = false,
  detailId = "",
  initialBranches,
  initialProfiles,
  initialBranchStaffAssignments,
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
  const [message, setMessage] = useState("");
  const [branches, setBranches] = useState(sortBranches(initialBranches || []));
  const [profiles, setProfiles] = useState(sortByName(initialProfiles || [], "fullName"));
  const [branchStaffAssignments, setBranchStaffAssignments] = useState(
    sortByCreatedDesc(initialBranchStaffAssignments || [])
  );

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
  const [reservationSort, setReservationSort] = useState("newest");
  const [voucherQuery, setVoucherQuery] = useState("");
  const [voucherStatus, setVoucherStatus] = useState("all");
  const [voucherSort, setVoucherSort] = useState("newest");
  const [orderQuery, setOrderQuery] = useState("");
  const [orderStatus, setOrderStatus] = useState("all");
  const [orderSort, setOrderSort] = useState("newest");
  const [menuQuery, setMenuQuery] = useState("");
  const [menuStatusFilter, setMenuStatusFilter] = useState("all");
  const [menuSort, setMenuSort] = useState("name_asc");
  const [tableQuery, setTableQuery] = useState("");
  const [tableStatusFilter, setTableStatusFilter] = useState("all");
  const [tableSort, setTableSort] = useState("name_asc");
  const [driverQuery, setDriverQuery] = useState("");
  const [driverStatusFilter, setDriverStatusFilter] = useState("all");
  const [driverSort, setDriverSort] = useState("name_asc");
  const [partnerQuery, setPartnerQuery] = useState("");
  const [partnerStatusFilter, setPartnerStatusFilter] = useState("all");
  const [partnerSort, setPartnerSort] = useState("name_asc");
  const [staffQuery, setStaffQuery] = useState("");
  const [staffRoleFilter, setStaffRoleFilter] = useState("all");
  const [staffSort, setStaffSort] = useState("name_asc");
  const [branchQuery, setBranchQuery] = useState("");
  const [branchStatusFilter, setBranchStatusFilter] = useState("all");
  const [branchSort, setBranchSort] = useState("sort_asc");

  const [selectedManagedBranchId, setSelectedManagedBranchId] = useState(
    activeSection === "branches" && detailId ? detailId : initialBranches?.[0]?.id || ""
  );
  const [selectedStaffId, setSelectedStaffId] = useState(
    activeSection === "staff" && detailId ? detailId : initialProfiles?.[0]?.id || ""
  );
  const [selectedReservationId, setSelectedReservationId] = useState(
    activeSection === "reservations" && detailId ? detailId : initialReservations[0]?.id || ""
  );
  const [selectedVoucherId, setSelectedVoucherId] = useState(
    activeSection === "vouchers" && detailId ? detailId : initialVouchers[0]?.id || ""
  );
  const [selectedVoucherCampaignId, setSelectedVoucherCampaignId] = useState(
    initialVoucherCampaigns?.[0]?.id || ""
  );
  const [selectedDriverId, setSelectedDriverId] = useState(
    activeSection === "drivers" && detailId ? detailId : initialDrivers?.[0]?.id || ""
  );
  const [selectedPartnerId, setSelectedPartnerId] = useState(
    activeSection === "partners" && detailId ? detailId : initialTravelPartners?.[0]?.id || ""
  );
  const [selectedOrderId, setSelectedOrderId] = useState(
    activeSection === "orders" && detailId ? detailId : initialOrders[0]?.id || ""
  );
  const [selectedMenuId, setSelectedMenuId] = useState(
    activeSection === "menu" && detailId ? detailId : initialMenuItems[0]?.id || ""
  );
  const [selectedTableId, setSelectedTableId] = useState(
    activeSection === "tables" && detailId ? detailId : initialTables[0]?.id || ""
  );
  const [selectedIntegrationId, setSelectedIntegrationId] = useState(
    activeSection === "integrations" && detailId ? detailId : initialIntegrations[0]?.id || ""
  );
  const selectedBranch =
    branches.find((item) => item.id === branchFilterId) ||
    branches.find((item) => item.code === adminProfile?.branch_code) ||
    branches[0] ||
    null;

  const [branchCreateOpen, setBranchCreateOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [orderCreateOpen, setOrderCreateOpen] = useState(false);
  const [menuCreateOpen, setMenuCreateOpen] = useState(false);
  const [tableCreateOpen, setTableCreateOpen] = useState(false);
  const [campaignCreateOpen, setCampaignCreateOpen] = useState(false);
  const [driverCreateOpen, setDriverCreateOpen] = useState(false);
  const [partnerCreateOpen, setPartnerCreateOpen] = useState(false);
  const [partnerContractCreateOpen, setPartnerContractCreateOpen] = useState(false);
  const [partnerBookingCreateOpen, setPartnerBookingCreateOpen] = useState(false);
  const [branchStaffCreateOpen, setBranchStaffCreateOpen] = useState(false);

  const [branchSaving, setBranchSaving] = useState(false);
  const [branchStaffSaving, setBranchStaffSaving] = useState(false);
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
  const [branchDraft, setBranchDraft] = useState(createEmptyBranchDraft());
  const [branchEdit, setBranchEdit] = useState(createEmptyBranchDraft());
  const [branchStaffDraft, setBranchStaffDraft] = useState(createEmptyBranchStaffDraft(activeBranchId || ""));
  const [staffEdit, setStaffEdit] = useState({
    fullName: "",
    email: "",
    role: "staff",
    branchId: ""
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
  const [orderDraftMenuItemId, setOrderDraftMenuItemId] = useState("placeholder");
  const [orderEditMenuItemId, setOrderEditMenuItemId] = useState("placeholder");

  const selectedReservation = reservations.find((item) => item.id === selectedReservationId) || null;
  const selectedVoucher = vouchers.find((item) => item.id === selectedVoucherId) || null;
  const selectedVoucherCampaign =
    voucherCampaigns.find((item) => item.id === selectedVoucherCampaignId) || null;
  const selectedManagedBranch = branches.find((item) => item.id === selectedManagedBranchId) || null;
  const selectedStaff = profiles.find((item) => item.id === selectedStaffId) || null;
  const selectedBranchAssignments = branchStaffAssignments.filter(
    (item) => item.branchId === selectedManagedBranchId
  );
  const selectedStaffAssignments = branchStaffAssignments.filter((item) => item.profileId === selectedStaffId);
  const availableProfilesForBranch = profiles.filter(
    (item) => !selectedBranchAssignments.some((assignment) => assignment.profileId === item.id)
  );
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
      canViewBranches: hasAdminPermission(currentRole, "branches.view"),
      canManageBranches: hasAdminPermission(currentRole, "branches.manage"),
      canViewStaff: hasAdminPermission(currentRole, "staff.view"),
      canManageStaff: hasAdminPermission(currentRole, "staff.manage"),
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
  const visibleSections = useMemo(
    () =>
      ADMIN_SECTIONS.filter((item) => hasAdminPermission(currentRole, item.permission)).map((item) => item.key),
    [currentRole]
  );
  const currentSection = visibleSections.includes(activeSection) ? activeSection : visibleSections[0] || "overview";
  const branchQueryString = branchFilterId ? `?branch=${encodeURIComponent(branchFilterId)}` : "";
  const buildAdminHref = (section, itemId = "") =>
    `/admin/${section}${itemId ? `/${itemId}` : ""}${branchQueryString}`;
  const openSectionDetail = (section, itemId) => router.push(buildAdminHref(section, itemId));
  const backToSection = (section = currentSection) => router.push(buildAdminHref(section));
  const detailOnlyLayout = detailMode && currentSection !== "overview";
  const detailHeaderActions = (section, extra = null) => (
    <div className={styles.detailHeaderActions}>
      <Button type="button" variant="outline" onClick={() => backToSection(section)}>Quay lại danh sách</Button>
      {extra}
    </div>
  );
  const attachBranchToPayload = (payload) => ({
    ...payload,
    branchId: payload?.branchId || branchFilterId || ""
  });

  useEffect(() => {
    if (!detailMode || !detailId) return;

    if (currentSection === "branches") setSelectedManagedBranchId(detailId);
    if (currentSection === "staff") setSelectedStaffId(detailId);
    if (currentSection === "reservations") setSelectedReservationId(detailId);
    if (currentSection === "orders") setSelectedOrderId(detailId);
    if (currentSection === "tables") setSelectedTableId(detailId);
    if (currentSection === "menu") setSelectedMenuId(detailId);
    if (currentSection === "vouchers") setSelectedVoucherId(detailId);
    if (currentSection === "drivers") setSelectedDriverId(detailId);
    if (currentSection === "partners") setSelectedPartnerId(detailId);
    if (currentSection === "integrations") setSelectedIntegrationId(detailId);
  }, [currentSection, detailId, detailMode]);

  useEffect(() => {
    setBranchEdit(selectedManagedBranch ? { ...selectedManagedBranch } : createEmptyBranchDraft());
  }, [selectedManagedBranchId, selectedManagedBranch]);

  useEffect(() => {
    setStaffEdit(
      selectedStaff
        ? {
            fullName: selectedStaff.fullName || "",
            email: selectedStaff.email || "",
            role: selectedStaff.role || "staff",
            branchId: selectedStaff.branchId || ""
          }
        : {
            fullName: "",
            email: "",
            role: "staff",
            branchId: ""
          }
    );
  }, [selectedStaffId, selectedStaff]);

  useEffect(() => {
    setBranchStaffDraft((prev) => ({
      ...prev,
      branchId: selectedManagedBranchId || prev.branchId || ""
    }));
  }, [selectedManagedBranchId]);

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
    if (!selectedManagedBranchId && branches.length) {
      setSelectedManagedBranchId(branches[0].id);
    }
  }, [selectedManagedBranchId, branches]);

  useEffect(() => {
    if (!selectedStaffId && profiles.length) {
      setSelectedStaffId(profiles[0].id);
    }
  }, [selectedStaffId, profiles]);

  useEffect(() => {
    if (!selectedVoucherCampaignId && voucherCampaigns.length) {
      setSelectedVoucherCampaignId(voucherCampaigns[0].id);
    }
  }, [selectedVoucherCampaignId, voucherCampaigns]);

  const handleBranchChange = (event) => {
    const nextBranchId = event.target.value;
    const params = new URLSearchParams(window.location.search);
    if (!nextBranchId || nextBranchId === "all") {
      params.delete("branch");
    } else {
      params.set("branch", nextBranchId);
    }
    const query = params.toString();
    const basePath = detailOnlyLayout && detailId ? `/admin/${currentSection}/${detailId}` : `/admin/${currentSection}`;
    router.replace(query ? `${basePath}?${query}` : basePath);
    router.refresh();
  };

  const filteredBranches = useMemo(
    () =>
      sortItems(
        branches.filter((item) => {
          const statusMatch =
            branchStatusFilter === "all" ||
            (branchStatusFilter === "active" ? item.isActive : !item.isActive);
          return (
            statusMatch &&
            matchesSearch(item, branchQuery, ["name", "shortName", "code", "address", "phone"])
          );
        }),
        branchSort,
        {
          default: (a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0),
          sort_asc: (a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0),
          name_asc: (a, b) => String(a.name || "").localeCompare(String(b.name || ""), "vi"),
          newest: (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        }
      ),
    [branches, branchQuery, branchStatusFilter, branchSort]
  );

  const filteredProfiles = useMemo(
    () =>
      sortItems(
        profiles.filter((item) => {
          const roleMatch = staffRoleFilter === "all" || item.role === staffRoleFilter;
          const branchMatch =
            !branchFilterId ||
            item.branchId === branchFilterId ||
            branchStaffAssignments.some(
              (assignment) => assignment.profileId === item.id && assignment.branchId === branchFilterId
            );
          return roleMatch && branchMatch && matchesSearch(item, staffQuery, ["fullName", "email", "role"]);
        }),
        staffSort,
        {
          default: (a, b) => String(a.fullName || a.email || "").localeCompare(String(b.fullName || b.email || ""), "vi"),
          name_asc: (a, b) => String(a.fullName || a.email || "").localeCompare(String(b.fullName || b.email || ""), "vi"),
          role_asc: (a, b) => formatLabel(a.role).localeCompare(formatLabel(b.role), "vi"),
          updated_desc: (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
        }
      ),
    [profiles, staffQuery, staffRoleFilter, staffSort, branchFilterId, branchStaffAssignments]
  );

  const filteredReservations = useMemo(
    () =>
      sortItems(
        reservations.filter((item) => {
        const statusMatch = reservationStatus === "all" || item.status === reservationStatus;
        return statusMatch && matchesSearch(item, reservationQuery, ["name", "phone", "selectedOffer", "notes", "assignedTo"]);
      }),
      reservationSort,
      {
        default: (a, b) => new Date(b.createdAt || b.datetime || 0) - new Date(a.createdAt || a.datetime || 0),
        newest: (a, b) => new Date(b.createdAt || b.datetime || 0) - new Date(a.createdAt || a.datetime || 0),
        oldest: (a, b) => new Date(a.createdAt || a.datetime || 0) - new Date(b.createdAt || b.datetime || 0),
        guests_desc: (a, b) => Number(b.guests || 0) - Number(a.guests || 0),
        name_asc: (a, b) => String(a.name || "").localeCompare(String(b.name || ""), "vi")
      }
    ),
    [reservations, reservationQuery, reservationStatus, reservationSort]
  );

  const filteredVouchers = useMemo(
    () =>
      sortItems(
        vouchers.filter((item) => {
        const statusMatch = voucherStatus === "all" || item.status === voucherStatus;
        return statusMatch && matchesSearch(item, voucherQuery, ["phone", "notes", "source", "voucherCode", "voucherTitle"]);
      }),
      voucherSort,
      {
        default: (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
        newest: (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
        oldest: (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0),
        code_asc: (a, b) => String(a.voucherCode || "").localeCompare(String(b.voucherCode || ""), "vi"),
        value_desc: (a, b) => Number(b.voucherDiscountValue || 0) - Number(a.voucherDiscountValue || 0)
      }
    ),
    [vouchers, voucherQuery, voucherStatus, voucherSort]
  );

  const filteredOrders = useMemo(
    () =>
      sortItems(
        orders.filter((item) => {
        const statusMatch = orderStatus === "all" || item.status === orderStatus;
        return statusMatch && matchesSearch(item, orderQuery, ["customerName", "customerPhone", "notes"]);
      }),
      orderSort,
      {
        default: (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
        newest: (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
        oldest: (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0),
        total_desc: (a, b) => Number(b.totalAmount || 0) - Number(a.totalAmount || 0),
        customer_asc: (a, b) => String(a.customerName || "").localeCompare(String(b.customerName || ""), "vi")
      }
    ),
    [orders, orderQuery, orderStatus, orderSort]
  );

  const filteredMenuItems = useMemo(
    () =>
      sortItems(
        menuItems.filter((item) => {
          const statusMatch = menuStatusFilter === "all" || (item.availabilityStatus || "available") === menuStatusFilter;
          return statusMatch && matchesSearch(item, menuQuery, ["name", "category", "description"]);
        }),
        menuSort,
        {
          default: (a, b) => String(a.name || "").localeCompare(String(b.name || ""), "vi"),
          name_asc: (a, b) => String(a.name || "").localeCompare(String(b.name || ""), "vi"),
          price_desc: (a, b) => Number(b.price || 0) - Number(a.price || 0),
          price_asc: (a, b) => Number(a.price || 0) - Number(b.price || 0),
          featured_first: (a, b) => Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured))
        }
      ),
    [menuItems, menuQuery, menuStatusFilter, menuSort]
  );

  const filteredTables = useMemo(
    () =>
      sortItems(
        restaurantTables.filter((item) => {
          const statusMatch = tableStatusFilter === "all" || item.status === tableStatusFilter;
          return statusMatch && matchesSearch(item, tableQuery, ["name", "area", "notes", "status"]);
        }),
        tableSort,
        {
          default: (a, b) => String(a.name || "").localeCompare(String(b.name || ""), "vi"),
          name_asc: (a, b) => String(a.name || "").localeCompare(String(b.name || ""), "vi"),
          capacity_desc: (a, b) => Number(b.capacity || 0) - Number(a.capacity || 0),
          area_asc: (a, b) => String(a.area || "").localeCompare(String(b.area || ""), "vi")
        }
      ),
    [restaurantTables, tableQuery, tableStatusFilter, tableSort]
  );

  const filteredDrivers = useMemo(
    () =>
      sortItems(
        drivers.filter((item) => {
          const statusMatch = driverStatusFilter === "all" || item.status === driverStatusFilter;
          return statusMatch && matchesSearch(item, driverQuery, ["fullName", "phone", "referralCode", "code", "vehicleType"]);
        }),
        driverSort,
        {
          default: (a, b) => String(a.fullName || "").localeCompare(String(b.fullName || ""), "vi"),
          name_asc: (a, b) => String(a.fullName || "").localeCompare(String(b.fullName || ""), "vi"),
          commission_desc: (a, b) => Number(b.commissionRate || 0) - Number(a.commissionRate || 0),
          status_asc: (a, b) => formatLabel(a.status).localeCompare(formatLabel(b.status), "vi")
        }
      ),
    [drivers, driverQuery, driverStatusFilter, driverSort]
  );

  const filteredPartners = useMemo(
    () =>
      sortItems(
        travelPartners.filter((item) => {
          const statusMatch = partnerStatusFilter === "all" || item.status === partnerStatusFilter;
          return statusMatch && matchesSearch(item, partnerQuery, ["name", "code", "contactName", "phone", "email"]);
        }),
        partnerSort,
        {
          default: (a, b) => String(a.name || "").localeCompare(String(b.name || ""), "vi"),
          name_asc: (a, b) => String(a.name || "").localeCompare(String(b.name || ""), "vi"),
          type_asc: (a, b) => formatLabel(a.partnerType).localeCompare(formatLabel(b.partnerType), "vi"),
          commission_desc: (a, b) => Number(b.commissionValue || 0) - Number(a.commissionValue || 0)
        }
      ),
    [travelPartners, partnerQuery, partnerStatusFilter, partnerSort]
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

  const createBranchEntry = async (event) => {
    event.preventDefault();
    setBranchSaving(true);
    setMessage("");
    try {
      const data = await requestJson("/api/admin/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(branchDraft)
      });
      setBranches((prev) => sortBranches([data.data, ...prev]));
      setSelectedManagedBranchId(data.data.id);
      setBranchDraft(createEmptyBranchDraft());
      setBranchCreateOpen(false);
      setMessage("Đã tạo chi nhánh mới.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBranchSaving(false);
    }
  };

  const saveBranchEdit = async () => {
    if (!selectedManagedBranch) return;
    setBranchSaving(true);
    setMessage("");
    try {
      const data = await requestJson(`/api/admin/branches/${selectedManagedBranch.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(branchEdit)
      });
      setBranches((prev) =>
        sortBranches(prev.map((item) => (item.id === selectedManagedBranch.id ? data.data : item)))
      );
      setMessage("Đã cập nhật chi nhánh.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBranchSaving(false);
    }
  };

  const deleteBranchEntry = async (id) => {
    if (!window.confirm("Xóa chi nhánh này? Thao tác chỉ thành công khi chi nhánh không còn dữ liệu liên quan.")) {
      return;
    }

    setBranchSaving(true);
    setMessage("");
    try {
      await requestJson(`/api/admin/branches/${id}`, {
        method: "DELETE"
      });
      const next = branches.filter((item) => item.id !== id);
      setBranches(sortBranches(next));
      setSelectedManagedBranchId(next[0]?.id || "");
      setMessage("Đã xóa chi nhánh.");
      backToSection("branches");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBranchSaving(false);
    }
  };

  const createBranchStaffAssignment = async (event) => {
    event.preventDefault();
    setBranchStaffSaving(true);
    setMessage("");
    try {
      const payload = {
        ...branchStaffDraft,
        branchId: selectedManagedBranchId || branchStaffDraft.branchId || ""
      };
      const data = await requestJson("/api/admin/branch-staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      setBranchStaffAssignments((prev) => {
        const next = prev.filter(
          (item) =>
            !(item.branchId === data.data.assignment.branchId && item.profileId === data.data.assignment.profileId)
        );
        return sortByCreatedDesc([data.data.assignment, ...next]);
      });
      if (data.data.profile) {
        setProfiles((prev) =>
          sortByName(
            prev.some((item) => item.id === data.data.profile.id)
              ? prev.map((item) => (item.id === data.data.profile.id ? data.data.profile : item))
              : [data.data.profile, ...prev],
            "fullName"
          )
        );
      }
      setBranchStaffDraft(createEmptyBranchStaffDraft(selectedManagedBranchId || ""));
      setBranchStaffCreateOpen(false);
      setMessage("Đã gán nhân sự vào chi nhánh.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBranchStaffSaving(false);
    }
  };

  const updateBranchStaffAssignment = async (assignmentId, payload) => {
    setBranchStaffSaving(true);
    setMessage("");
    try {
      const data = await requestJson(`/api/admin/branch-staff/${assignmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      setBranchStaffAssignments((prev) =>
        sortByCreatedDesc(prev.map((item) => (item.id === assignmentId ? data.data.assignment : item)))
      );
      if (data.data.profile) {
        setProfiles((prev) =>
          sortByName(prev.map((item) => (item.id === data.data.profile.id ? data.data.profile : item)), "fullName")
        );
      }
      setMessage("Đã cập nhật nhân sự chi nhánh.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBranchStaffSaving(false);
    }
  };

  const deleteBranchStaffAssignment = async (assignmentId) => {
    if (!window.confirm("Gỡ nhân sự này khỏi chi nhánh?")) {
      return;
    }

    setBranchStaffSaving(true);
    setMessage("");
    try {
      const data = await requestJson(`/api/admin/branch-staff/${assignmentId}`, {
        method: "DELETE"
      });
      setBranchStaffAssignments((prev) => prev.filter((item) => item.id !== data.data.assignmentId));
      if (data.data.profile) {
        setProfiles((prev) =>
          sortByName(prev.map((item) => (item.id === data.data.profile.id ? data.data.profile : item)), "fullName")
        );
      }
      setMessage("Đã gỡ nhân sự khỏi chi nhánh.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBranchStaffSaving(false);
    }
  };

  const saveStaffEdit = async () => {
    if (!selectedStaff) return;
    setBranchStaffSaving(true);
    setMessage("");
    try {
      const data = await requestJson(`/api/admin/profiles/${selectedStaff.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(staffEdit)
      });
      setProfiles((prev) =>
        sortByName(prev.map((item) => (item.id === selectedStaff.id ? data.data : item)), "fullName")
      );
      setMessage("Đã cập nhật tài khoản nhân sự.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBranchStaffSaving(false);
    }
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
      setMessage("Đã tạo chiến dịch voucher.");
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
      setMessage("Đã cập nhật chiến dịch voucher.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setVoucherSaving(false);
    }
  };

  const deleteVoucherCampaignEntry = async (id) => {
    if (!window.confirm("Xóa chiến dịch voucher này?")) return;
    try {
      await requestJson(`/api/admin/voucher-campaigns/${id}`, { method: "DELETE" });
      const next = voucherCampaigns.filter((item) => item.id !== id);
      setVoucherCampaigns(next);
      setSelectedVoucherCampaignId(next[0]?.id || "");
      setMessage("Đã xóa chiến dịch voucher.");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const deleteVoucherEntry = async (id) => {
    if (!window.confirm("Xóa lead voucher này?")) return;
    try {
      await requestJson(`/api/admin/vouchers/${id}`, {
        method: "DELETE"
      });
      const next = vouchers.filter((item) => item.id !== id);
      setVouchers(next);
      setSelectedVoucherId(next[0]?.id || "");
      setMessage("Đã xóa lead voucher.");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const redeemVoucher = async (voucher) => {
    const spendInput = window.prompt("Nhập tổng hóa đơn để đổi voucher và cộng điểm loyalty", "1500000");
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
      setMessage("Đã đổi voucher và cập nhật loyalty.");
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
  const selectedBranchMetrics = selectedManagedBranch
    ? {
        staff: selectedBranchAssignments.length,
        tables: restaurantTables.filter((item) => item.branchId === selectedManagedBranch.id).length,
        menuItems: menuItems.filter((item) => item.branchId === selectedManagedBranch.id).length,
        reservations: reservations.filter((item) => item.branchId === selectedManagedBranch.id).length,
        orders: orders.filter((item) => item.branchId === selectedManagedBranch.id).length,
        vouchers: vouchers.filter((item) => item.branchId === selectedManagedBranch.id).length
      }
    : {
        staff: 0,
        tables: 0,
        menuItems: 0,
        reservations: 0,
        orders: 0,
        vouchers: 0
      };
  const branchStats = {
    total: branches.length,
    active: branches.filter((item) => item.isActive).length,
    inactive: branches.filter((item) => !item.isActive).length
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
        title: `${item.customerName} vừa gửi đơn hàng`,
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
        subtitle: item.voucherCode || "Yêu cầu voucher mới",
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
  const currentSectionLabel = getAdminSectionLabel(currentSection);
  const currentDetailTitle = getDetailTitle({
    currentSection,
    detailOnlyLayout,
    selectedManagedBranch,
    selectedStaff,
    selectedReservation,
    selectedOrder,
    selectedTable,
    selectedMenuItem,
    selectedVoucher,
    selectedDriver,
    selectedPartner,
    selectedIntegration
  });

  return (
    <SidebarProvider
      defaultOpen
      style={{
        "--sidebar-width": "17rem",
        "--sidebar-width-collapsed": "4.5rem"
      }}
    >
      <div className="flex min-h-svh w-full bg-zinc-50">
        <AppSidebar
          visibleSections={visibleSections}
          activeSection={currentSection}
          reservationStats={reservationStats}
          orderStats={orderStats}
          voucherStats={voucherStats}
          driverStats={driverStats}
          partnerStats={partnerStats}
          adminProfile={adminProfile}
          roleLabels={roleLabels}
          branches={branches}
          activeBranchId={activeBranchId || "all"}
          canViewAllBranches={canViewAllBranches}
          selectedBranch={selectedBranch}
          onBranchChange={handleBranchChange}
          canExport={permissions.canExport}
          branchFilterId={branchFilterId}
          onLogout={logout}
        />

        <SidebarInset className="w-full min-w-0 bg-zinc-50">
        <section className="flex min-h-svh w-full min-w-0 flex-col gap-4 md:gap-6">
        <AdminHeader
          title={currentSectionLabel}
          adminProfile={adminProfile}
          selectedBranch={selectedBranch}
          notificationCount={notificationFeed.length}
          currentSection={currentSection}
          detailMode={detailOnlyLayout}
          detailTitle={currentDetailTitle}
          branchFilterId={branchFilterId}
        />

        <div className="flex-1 w-full min-w-0 p-4 md:p-6">
        <div className="flex w-full min-w-0 flex-col gap-4 md:gap-6">
        {message ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        ) : null}

        {currentSection === "overview" ? (
          <AdminOverviewSection
            reservationStats={reservationStats}
            orderStats={orderStats}
            voucherStats={voucherStats}
            driverStats={driverStats}
            partnerStats={partnerStats}
            menuStats={menuStats}
            tableStats={tableStats}
            notificationFeed={notificationFeed}
            topSellingItems={topSellingItems}
            formatDate={formatDate}
            formatCurrency={formatCurrency}
            formatLabel={formatLabel}
          />
        ) : null}

        {currentSection === "branches" && permissions.canViewBranches ? (
          <AdminBranchesSection
            detailOnlyLayout={detailOnlyLayout}
            permissions={permissions}
            branchStats={branchStats}
            branchDetailStats={selectedBranchMetrics}
            branchCreateOpen={branchCreateOpen}
            setBranchCreateOpen={setBranchCreateOpen}
            branchStaffCreateOpen={branchStaffCreateOpen}
            setBranchStaffCreateOpen={setBranchStaffCreateOpen}
            branchQuery={branchQuery}
            setBranchQuery={setBranchQuery}
            branchStatusFilter={branchStatusFilter}
            setBranchStatusFilter={setBranchStatusFilter}
            branchSort={branchSort}
            setBranchSort={setBranchSort}
            branchSortOptions={branchSortOptions}
            createBranchEntry={createBranchEntry}
            branchDraft={branchDraft}
            setBranchDraft={setBranchDraft}
            branchSaving={branchSaving}
            filteredBranches={filteredBranches}
            selectedManagedBranch={selectedManagedBranch}
            openSectionDetail={openSectionDetail}
            detailHeaderActions={detailHeaderActions}
            branchEdit={branchEdit}
            setBranchEdit={setBranchEdit}
            saveBranchEdit={saveBranchEdit}
            deleteBranchEntry={deleteBranchEntry}
            branchAssignments={selectedBranchAssignments}
            profiles={profiles}
            availableProfilesForBranch={availableProfilesForBranch}
            branchStaffDraft={branchStaffDraft}
            setBranchStaffDraft={setBranchStaffDraft}
            branchStaffSaving={branchStaffSaving}
            createBranchStaffAssignment={createBranchStaffAssignment}
            updateBranchStaffAssignment={updateBranchStaffAssignment}
            deleteBranchStaffAssignment={deleteBranchStaffAssignment}
            roleLabels={roleLabels}
            formatDate={formatDate}
            FormSelect={FormSelect}
          />
        ) : null}

        {currentSection === "staff" && permissions.canViewStaff ? (
          <AdminStaffSection
            detailOnlyLayout={detailOnlyLayout}
            permissions={permissions}
            staffQuery={staffQuery}
            setStaffQuery={setStaffQuery}
            staffRoleFilter={staffRoleFilter}
            setStaffRoleFilter={setStaffRoleFilter}
            staffSort={staffSort}
            setStaffSort={setStaffSort}
            staffSortOptions={staffSortOptions}
            staffRoleOptions={[
              { value: "super_admin", label: roleLabels.super_admin },
              { value: "admin", label: roleLabels.admin },
              { value: "manager", label: roleLabels.manager },
              { value: "branch_manager", label: roleLabels.branch_manager },
              { value: "staff", label: roleLabels.staff },
              { value: "driver", label: roleLabels.driver }
            ]}
            filteredProfiles={filteredProfiles}
            selectedStaff={selectedStaff}
            selectedStaffAssignments={selectedStaffAssignments}
            branches={branches}
            openSectionDetail={openSectionDetail}
            detailHeaderActions={detailHeaderActions}
            staffEdit={staffEdit}
            setStaffEdit={setStaffEdit}
            saveStaffEdit={saveStaffEdit}
            profileSaving={branchStaffSaving}
            roleLabels={roleLabels}
            formatDate={formatDate}
            FormSelect={FormSelect}
          />
        ) : null}

        {currentSection === "reservations" ? (
          <AdminReservationsSection
            detailOnlyLayout={detailOnlyLayout}
            permissions={permissions}
            manualOpen={manualOpen}
            setManualOpen={setManualOpen}
            reservationQuery={reservationQuery}
            setReservationQuery={setReservationQuery}
            reservationStatus={reservationStatus}
            setReservationStatus={setReservationStatus}
            reservationSort={reservationSort}
            setReservationSort={setReservationSort}
            reservationStatuses={reservationStatuses}
            reservationSortOptions={reservationSortOptions}
            createManualReservation={createManualReservation}
            manualForm={manualForm}
            setManualForm={setManualForm}
            drivers={drivers}
            restaurantTables={restaurantTables}
            reservationSaving={reservationSaving}
            filteredReservations={filteredReservations}
            selectedReservation={selectedReservation}
            openSectionDetail={openSectionDetail}
            formatDate={formatDate}
            formatLabel={formatLabel}
            findTableName={findTableName}
            detailHeaderActions={detailHeaderActions}
            deleteReservation={deleteReservation}
            patchReservation={patchReservation}
            integrations={integrations}
            selectedIntegrationId={selectedIntegrationId}
            setSelectedIntegrationId={setSelectedIntegrationId}
            syncReservation={syncReservation}
            integrationSaving={integrationSaving}
            FormSelect={FormSelect}
          />
        ) : null}

        {currentSection === "orders" ? (
          <AdminOrdersSection
            detailOnlyLayout={detailOnlyLayout}
            permissions={permissions}
            orderCreateOpen={orderCreateOpen}
            setOrderCreateOpen={setOrderCreateOpen}
            orderQuery={orderQuery}
            setOrderQuery={setOrderQuery}
            orderStatus={orderStatus}
            setOrderStatus={setOrderStatus}
            orderSort={orderSort}
            setOrderSort={setOrderSort}
            orderStatuses={orderStatuses}
            orderSortOptions={orderSortOptions}
            createManualOrder={createManualOrder}
            orderDraft={orderDraft}
            setOrderDraft={setOrderDraft}
            orderDraftMenuItemId={orderDraftMenuItemId}
            setOrderDraftMenuItemId={setOrderDraftMenuItemId}
            restaurantTables={restaurantTables}
            drivers={drivers}
            menuItems={menuItems}
            addItemToState={addItemToState}
            updateLineItem={updateLineItem}
            removeLineItem={removeLineItem}
            orderDraftTotals={orderDraftTotals}
            orderSaving={orderSaving}
            filteredOrders={filteredOrders}
            selectedOrder={selectedOrder}
            openSectionDetail={openSectionDetail}
            formatDate={formatDate}
            formatCurrency={formatCurrency}
            formatLabel={formatLabel}
            findTableName={findTableName}
            detailHeaderActions={detailHeaderActions}
            deleteOrder={deleteOrder}
            orderEdit={orderEdit}
            setOrderEdit={setOrderEdit}
            reservations={reservations}
            orderChannels={orderChannels}
            orderEditMenuItemId={orderEditMenuItemId}
            setOrderEditMenuItemId={setOrderEditMenuItemId}
            orderEditTotals={orderEditTotals}
            saveOrderEdit={saveOrderEdit}
            FormSelect={FormSelect}
          />
        ) : null}

        {currentSection === "tables" ? (
          <AdminTablesSection
            detailOnlyLayout={detailOnlyLayout}
            permissions={permissions}
            tableCreateOpen={tableCreateOpen}
            setTableCreateOpen={setTableCreateOpen}
            tableQuery={tableQuery}
            setTableQuery={setTableQuery}
            tableStatusFilter={tableStatusFilter}
            setTableStatusFilter={setTableStatusFilter}
            tableSort={tableSort}
            setTableSort={setTableSort}
            tableSortOptions={tableSortOptions}
            tableStatuses={tableStatuses}
            createTableEntry={createTableEntry}
            tableDraft={tableDraft}
            setTableDraft={setTableDraft}
            tableSaving={tableSaving}
            filteredTables={filteredTables}
            selectedTable={selectedTable}
            openSectionDetail={openSectionDetail}
            formatCurrency={formatCurrency}
            formatLabel={formatLabel}
            detailHeaderActions={detailHeaderActions}
            deleteTableEntry={deleteTableEntry}
            tableEdit={tableEdit}
            setTableEdit={setTableEdit}
            saveTableEdit={saveTableEdit}
            FormSelect={FormSelect}
          />
        ) : null}

        {currentSection === "menu" ? (
          <AdminMenuSection
            detailOnlyLayout={detailOnlyLayout}
            permissions={permissions}
            menuCreateOpen={menuCreateOpen}
            setMenuCreateOpen={setMenuCreateOpen}
            menuQuery={menuQuery}
            setMenuQuery={setMenuQuery}
            menuStatusFilter={menuStatusFilter}
            setMenuStatusFilter={setMenuStatusFilter}
            menuSort={menuSort}
            setMenuSort={setMenuSort}
            menuSortOptions={menuSortOptions}
            availabilityStatuses={availabilityStatuses}
            spicyLevels={spicyLevels}
            createMenuItemEntry={createMenuItemEntry}
            menuDraft={menuDraft}
            setMenuDraft={setMenuDraft}
            menuSaving={menuSaving}
            filteredMenuItems={filteredMenuItems}
            selectedMenuItem={selectedMenuItem}
            openSectionDetail={openSectionDetail}
            formatCurrency={formatCurrency}
            formatLabel={formatLabel}
            detailHeaderActions={detailHeaderActions}
            deleteMenuItemEntry={deleteMenuItemEntry}
            menuEdit={menuEdit}
            setMenuEdit={setMenuEdit}
            saveMenuEdit={saveMenuEdit}
            FormSelect={FormSelect}
          />
        ) : null}

        {currentSection === "vouchers" ? (
          <AdminVouchersSection
            detailOnlyLayout={detailOnlyLayout}
            permissions={permissions}
            voucherQuery={voucherQuery}
            setVoucherQuery={setVoucherQuery}
            voucherStatus={voucherStatus}
            setVoucherStatus={setVoucherStatus}
            voucherSort={voucherSort}
            setVoucherSort={setVoucherSort}
            voucherStatuses={voucherStatuses}
            voucherSortOptions={voucherSortOptions}
            voucherStats={voucherStats}
            loyaltyStats={loyaltyStats}
            filteredVouchers={filteredVouchers}
            selectedVoucher={selectedVoucher}
            openSectionDetail={openSectionDetail}
            formatDate={formatDate}
            formatLabel={formatLabel}
            campaignCreateOpen={campaignCreateOpen}
            setCampaignCreateOpen={setCampaignCreateOpen}
            createVoucherCampaignEntry={createVoucherCampaignEntry}
            campaignDraft={campaignDraft}
            setCampaignDraft={setCampaignDraft}
            voucherSaving={voucherSaving}
            voucherCampaigns={voucherCampaigns}
            selectedVoucherCampaign={selectedVoucherCampaign}
            selectedVoucherCampaignId={selectedVoucherCampaignId}
            setSelectedVoucherCampaignId={setSelectedVoucherCampaignId}
            formatVoucherBenefit={formatVoucherBenefit}
            patchVoucherCampaign={patchVoucherCampaign}
            deleteVoucherCampaignEntry={deleteVoucherCampaignEntry}
            selectedVoucherCustomer={selectedVoucherCustomer}
            formatVoucherValue={formatVoucherValue}
            backToSection={backToSection}
            redeemVoucher={redeemVoucher}
            deleteVoucherEntry={deleteVoucherEntry}
            patchVoucher={patchVoucher}
            customerProfiles={customerProfiles}
            formatCurrency={formatCurrency}
          />
        ) : null}

        {currentSection === "drivers" && permissions.canViewDrivers ? (
          <AdminDriversSection
            detailOnlyLayout={detailOnlyLayout}
            permissions={permissions}
            driverCreateOpen={driverCreateOpen}
            setDriverCreateOpen={setDriverCreateOpen}
            driverQuery={driverQuery}
            setDriverQuery={setDriverQuery}
            driverStatusFilter={driverStatusFilter}
            setDriverStatusFilter={setDriverStatusFilter}
            driverSort={driverSort}
            setDriverSort={setDriverSort}
            driverStatuses={driverStatuses}
            driverSortOptions={driverSortOptions}
            createDriverEntry={createDriverEntry}
            driverDraft={driverDraft}
            setDriverDraft={setDriverDraft}
            tableSaving={tableSaving}
            filteredDrivers={filteredDrivers}
            selectedDriver={selectedDriver}
            openSectionDetail={openSectionDetail}
            formatLabel={formatLabel}
            formatCurrency={formatCurrency}
            detailHeaderActions={detailHeaderActions}
            deleteDriverEntry={deleteDriverEntry}
            driverCommissions={driverCommissions}
            driverEdit={driverEdit}
            setDriverEdit={setDriverEdit}
            saveDriverEdit={saveDriverEdit}
            driverReferrals={driverReferrals}
            FormSelect={FormSelect}
          />
        ) : null}

        {currentSection === "partners" && permissions.canViewPartners ? (
          <AdminPartnersSection
            detailOnlyLayout={detailOnlyLayout}
            permissions={permissions}
            partnerCreateOpen={partnerCreateOpen}
            setPartnerCreateOpen={setPartnerCreateOpen}
            partnerQuery={partnerQuery}
            setPartnerQuery={setPartnerQuery}
            partnerStatusFilter={partnerStatusFilter}
            setPartnerStatusFilter={setPartnerStatusFilter}
            partnerSort={partnerSort}
            setPartnerSort={setPartnerSort}
            partnerStatuses={partnerStatuses}
            partnerSortOptions={partnerSortOptions}
            createPartnerEntry={createPartnerEntry}
            partnerDraft={partnerDraft}
            setPartnerDraft={setPartnerDraft}
            partnerTypes={partnerTypes}
            partnerSaving={partnerSaving}
            filteredPartners={filteredPartners}
            selectedPartner={selectedPartner}
            openSectionDetail={openSectionDetail}
            formatLabel={formatLabel}
            formatCurrency={formatCurrency}
            detailHeaderActions={detailHeaderActions}
            deletePartnerEntry={deletePartnerEntry}
            partnerBookings={partnerBookings}
            partnerEdit={partnerEdit}
            setPartnerEdit={setPartnerEdit}
            savePartnerEdit={savePartnerEdit}
            FormSelect={FormSelect}
            partnerContractCreateOpen={partnerContractCreateOpen}
            setPartnerContractCreateOpen={setPartnerContractCreateOpen}
            createPartnerContractEntry={createPartnerContractEntry}
            partnerContractDraft={partnerContractDraft}
            setPartnerContractDraft={setPartnerContractDraft}
            partnerContractStatuses={partnerContractStatuses}
            partnerContracts={partnerContracts}
            formatDate={formatDate}
            partnerBookingCreateOpen={partnerBookingCreateOpen}
            setPartnerBookingCreateOpen={setPartnerBookingCreateOpen}
            createPartnerBookingEntry={createPartnerBookingEntry}
            partnerBookingDraft={partnerBookingDraft}
            setPartnerBookingDraft={setPartnerBookingDraft}
            partnerBookingStatuses={partnerBookingStatuses}
            patchPartnerBooking={patchPartnerBooking}
            deletePartnerBookingEntry={deletePartnerBookingEntry}
          />
        ) : null}

        {currentSection === "integrations" && permissions.canViewIntegrations ? (
          <AdminIntegrationsSection
            detailOnlyLayout={detailOnlyLayout}
            permissions={permissions}
            integrations={integrations}
            selectedIntegration={selectedIntegration}
            openSectionDetail={openSectionDetail}
            formatLabel={formatLabel}
            detailHeaderActions={detailHeaderActions}
            FormSelect={FormSelect}
            patchIntegration={patchIntegration}
            syncLogs={syncLogs}
            formatDate={formatDate}
          />
        ) : null}
        </div>
        </div>
        </section>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

