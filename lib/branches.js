export const MAIN_BRANCH_ID = "11111111-1111-4111-8111-111111111111";
export const MAIN_BRANCH_CODE = "main";

const BRANCH_PROFILE_PRESETS = {
  hotram: {
    latitude: 10.4786,
    longitude: 107.3754,
    themeKey: "hotram",
    cityLabel: "Hồ Tràm",
    experienceTagline: "Hải sản - Cơm niêu - Biển",
    mapUrl: "https://maps.app.goo.gl/DBABeiaozYrPY2Dv5?g_st=iz"
  },
  dalat: {
    latitude: 11.9404,
    longitude: 108.4583,
    themeKey: "dalat",
    cityLabel: "Đà Lạt",
    experienceTagline: "Coffee - Villa - Vườn hoa"
  },
  default: {
    latitude: 10.4786,
    longitude: 107.3754,
    themeKey: "hotram",
    cityLabel: "Hồ Tràm",
    experienceTagline: "Hải sản - Cơm niêu - Biển"
  }
};

export const DEFAULT_BRANCHES = [
  {
    id: MAIN_BRANCH_ID,
    code: "main",
    name: "San Hô Đỏ Hồ Tràm",
    shortName: "Hồ Tràm",
    address: "Đường ven biển, Ấp Hồ Tràm, Xuyên Mộc, Bà Rịa - Vũng Tàu",
    phone: "0522282229",
    mapUrl: "https://maps.app.goo.gl/DBABeiaozYrPY2Dv5?g_st=iz",
    isActive: true,
    sortOrder: 1
  }
];

const GLOBAL_ROLES = ["super_admin", "admin", "manager"];

function detectBranchProfile(item = {}) {
  const code = String(item.code || "").toLowerCase();
  const name = String(item.name || "").toLowerCase();
  const address = String(item.address || "").toLowerCase();
  const haystack = `${code} ${name} ${address}`;

  if (haystack.includes("da lat") || haystack.includes("đà lạt") || haystack.includes("dalat")) {
    return BRANCH_PROFILE_PRESETS.dalat;
  }

  if (
    haystack.includes("ho tram") ||
    haystack.includes("hồ tràm") ||
    haystack.includes("hotram") ||
    haystack.includes("xuyên mộc") ||
    haystack.includes("xuyen moc")
  ) {
    return BRANCH_PROFILE_PRESETS.hotram;
  }

  return BRANCH_PROFILE_PRESETS.default;
}

export function normalizeBranches(items) {
  return (items || []).map((item) => {
    const profile = detectBranchProfile(item);
    const landingConfig = item.landing_config || item.landingConfig || {};
    const latitude =
      Number(item.latitude ?? item.lat ?? landingConfig.latitude ?? landingConfig.lat) || profile.latitude;
    const longitude =
      Number(item.longitude ?? item.lng ?? item.lon ?? landingConfig.longitude ?? landingConfig.lng) ||
      profile.longitude;

    return {
      id: item.id,
      code: item.code || "main",
      name: item.name || "San Hô Đỏ Hồ Tràm",
      shortName: item.short_name || item.shortName || item.name || profile.cityLabel,
      address: item.address || "",
      phone: item.phone || "",
      landingConfig,
      isActive: item.is_active ?? item.isActive ?? true,
      sortOrder: item.sort_order ?? item.sortOrder ?? 0,
      latitude,
      longitude,
      themeKey: item.theme_key || item.themeKey || landingConfig.themeKey || profile.themeKey,
      cityLabel: item.city_label || item.cityLabel || landingConfig.cityLabel || profile.cityLabel,
      experienceTagline:
        item.experience_tagline ||
        item.experienceTagline ||
        landingConfig.experienceTagline ||
        profile.experienceTagline,
      mapUrl:
        item.map_url ||
        item.mapUrl ||
        item.directions_url ||
        item.directionsUrl ||
        landingConfig.mapUrl ||
        landingConfig.directionsUrl ||
        profile.mapUrl ||
        "",
      messengerUrl: item.messenger_url || item.messengerUrl || landingConfig.messengerUrl || ""
    };
  });
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

function normalizeLandingLocale(locale = "") {
  const normalized = String(locale || "").trim().toLowerCase();
  return normalized === "en" || normalized === "zh" ? normalized : "vi";
}

export function getBranchLandingPath(branch, options = {}) {
  const code = normalizeBranchCode(typeof branch === "string" ? branch : branch?.code);
  const lang = normalizeLandingLocale(options.lang);
  const params = new URLSearchParams();

  if (code && !isMainBranchCode(code)) {
    params.set("branch", code);
  }

  if (lang !== "vi") {
    params.set("lang", lang);
  }

  const query = params.toString();
  return query ? `/?${query}` : "/";
}

export function getAbsoluteBranchLandingUrl(branch, origin = "", options = {}) {
  const path = getBranchLandingPath(branch, options);
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
