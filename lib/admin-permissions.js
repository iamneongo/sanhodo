export const ADMIN_ROLES = ["super_admin", "admin", "manager", "branch_manager"];

export const DASHBOARD_TABS = {
  reservations: "reservations.view",
  orders: "orders.view",
  tables: "tables.view",
  menu: "menu.view",
  vouchers: "vouchers.view",
  drivers: "drivers.view",
  integrations: "integrations.view"
};

const ROLE_PERMISSIONS = {
  super_admin: [
    "dashboard.view",
    "dashboard.export",
    "reservations.view",
    "reservations.manage",
    "orders.view",
    "orders.manage",
    "tables.view",
    "tables.manage",
    "menu.view",
    "menu.manage",
    "vouchers.view",
    "vouchers.manage",
    "drivers.view",
    "drivers.manage",
    "drivers.commission",
    "integrations.view",
    "integrations.manage",
    "integrations.sync"
  ],
  admin: [
    "dashboard.view",
    "dashboard.export",
    "reservations.view",
    "reservations.manage",
    "orders.view",
    "orders.manage",
    "tables.view",
    "tables.manage",
    "menu.view",
    "menu.manage",
    "vouchers.view",
    "vouchers.manage",
    "drivers.view",
    "drivers.manage",
    "drivers.commission",
    "integrations.view",
    "integrations.manage",
    "integrations.sync"
  ],
  manager: [
    "dashboard.view",
    "dashboard.export",
    "reservations.view",
    "reservations.manage",
    "orders.view",
    "orders.manage",
    "tables.view",
    "tables.manage",
    "menu.view",
    "menu.manage",
    "vouchers.view",
    "vouchers.manage",
    "drivers.view",
    "drivers.manage",
    "drivers.commission",
    "integrations.view",
    "integrations.manage",
    "integrations.sync"
  ],
  branch_manager: [
    "dashboard.view",
    "dashboard.export",
    "reservations.view",
    "reservations.manage",
    "orders.view",
    "orders.manage",
    "tables.view",
    "tables.manage",
    "menu.view",
    "menu.manage",
    "vouchers.view",
    "vouchers.manage",
    "drivers.view",
    "drivers.manage",
    "drivers.commission",
    "integrations.view"
  ],
  staff: [],
  driver: []
};

export function getRolePermissions(role = "") {
  return ROLE_PERMISSIONS[role] || [];
}

export function hasAdminPermission(role = "", permission = "dashboard.view") {
  return getRolePermissions(role).includes(permission);
}

export function hasDashboardAccess(role = "") {
  return hasAdminPermission(role, "dashboard.view");
}
