export const MAIN_BRANCH_ID = "11111111-1111-4111-8111-111111111111";
export const MAIN_BRANCH_CODE = "main";

export const DEFAULT_BRANCHES = [
  {
    id: MAIN_BRANCH_ID,
    code: "main",
    name: "San Hô Đỏ Hồ Tràm",
    shortName: "Hồ Tràm",
    address: "Đường ven biển, Ấp Hồ Tràm, Xuyên Mộc, Bà Rịa - Vũng Tàu",
    phone: "0814645999",
    isActive: true,
    sortOrder: 1
  }
];

const GLOBAL_ROLES = ["super_admin", "admin", "manager"];

export function normalizeBranches(items) {
  return (items || []).map((item) => ({
    id: item.id,
    code: item.code || "main",
    name: item.name || "San Hô Đỏ Hồ Tràm",
    shortName: item.short_name || item.shortName || item.name || "Hồ Tràm",
    address: item.address || "",
    phone: item.phone || "",
    landingConfig: item.landing_config || item.landingConfig || {},
    isActive: item.is_active ?? item.isActive ?? true,
    sortOrder: item.sort_order ?? item.sortOrder ?? 0
  }));
}

export function getBranchById(branches, branchId) {
  return (branches || []).find((item) => item.id === branchId) || null;
}

export function getBranchByCode(branches, branchCode) {
  const normalizedTarget = normalizeBranchCode(branchCode);
  return (branches || []).find((item) => normalizeBranchCode(item.code) === normalizedTarget) || null;
}

export function normalizeBranchCode(branchCode = "") {
  return String(branchCode || "").trim().toLowerCase();
}

export function isMainBranchCode(branchCode = "") {
  return normalizeBranchCode(branchCode) === MAIN_BRANCH_CODE;
}

export function getBranchLandingPath(branch) {
  const code = normalizeBranchCode(typeof branch === "string" ? branch : branch?.code);
  if (!code || isMainBranchCode(code)) {
    return "/";
  }

  return `/${encodeURIComponent(code)}`;
}

export function getAbsoluteBranchLandingUrl(branch, origin = "") {
  const path = getBranchLandingPath(branch);
  if (!origin) {
    return path;
  }

  try {
    return new URL(path, origin).toString();
  } catch {
    return path;
  }
}

export function canViewAllBranches(role) {
  return GLOBAL_ROLES.includes(role);
}

export function resolveBranchScope({ profile, branches, requestedBranchId }) {
  const normalizedBranches = normalizeBranches(branches?.length ? branches : DEFAULT_BRANCHES);
  const globalView = canViewAllBranches(profile?.role);
  const requested = requestedBranchId && requestedBranchId !== "all" ? requestedBranchId : "";
  const assignedBranch =
    getBranchById(normalizedBranches, profile?.branch_id) ||
    getBranchByCode(normalizedBranches, profile?.branch_code) ||
    normalizedBranches[0] ||
    null;

  const activeBranchId = globalView ? requested || "all" : assignedBranch?.id || requested || "all";
  const branchFilterId = activeBranchId === "all" ? "" : activeBranchId;

  return {
    branches: normalizedBranches,
    canViewAll: globalView,
    activeBranchId,
    branchFilterId,
    assignedBranch
  };
}
