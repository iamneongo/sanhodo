export const ADMIN_SECTIONS = [
  { key: "overview", label: "Tổng quan", description: "Theo dõi số liệu và hoạt động mới.", permission: "dashboard.view" },
  { key: "branches", label: "Chi nhánh", description: "Tạo mới, cập nhật và chuẩn hóa thông tin chi nhánh.", permission: "branches.view" },
  { key: "reservations", label: "Đặt bàn", description: "Quản lý lead và lịch đặt bàn.", permission: "reservations.view" },
  { key: "orders", label: "Đơn hàng", description: "Điều phối đơn món và trạng thái phục vụ.", permission: "orders.view" },
  { key: "tables", label: "Bàn", description: "Sơ đồ bàn và trạng thái chỗ ngồi.", permission: "tables.view" },
  { key: "menu", label: "Món ăn", description: "Cập nhật món, giá và tình trạng phục vụ.", permission: "menu.view" },
  { key: "vouchers", label: "Voucher", description: "Campaign, lead và loyalty.", permission: "vouchers.view" },
  { key: "drivers", label: "Tài xế", description: "Referral và hoa hồng tài xế.", permission: "drivers.view" },
  { key: "partners", label: "Đối tác", description: "HDV, agency, hợp đồng và booking đoàn.", permission: "partners.view" },
  { key: "integrations", label: "Tích hợp", description: "POS/PMS và log đồng bộ.", permission: "integrations.view" }
];

export function isAdminSectionKey(section = "") {
  return ADMIN_SECTIONS.some((item) => item.key === section);
}

export function getAdminSectionLabel(section = "overview") {
  return ADMIN_SECTIONS.find((item) => item.key === section)?.label || "Tổng quan";
}

export function getAdminSectionDescription(section = "overview") {
  return ADMIN_SECTIONS.find((item) => item.key === section)?.description || "Theo dõi số liệu và hoạt động mới.";
}

export function sectionSupportsDetailPage(section = "") {
  return section !== "overview" && isAdminSectionKey(section);
}
