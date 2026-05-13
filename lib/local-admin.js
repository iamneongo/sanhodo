import { createHash } from "node:crypto";

export const LOCAL_ADMIN_COOKIE = "shd_local_admin";

function isTruthy(value) {
  return String(value || "").toLowerCase() === "true";
}

export function isLocalAdminEnabled() {
  return process.env.NODE_ENV !== "production" && isTruthy(process.env.ALLOW_LOCAL_ADMIN_FALLBACK);
}

export function getLocalAdminConfig() {
  return {
    email: (process.env.LOCAL_ADMIN_EMAIL || "admin@sanhodo.local").trim().toLowerCase(),
    password: process.env.LOCAL_ADMIN_PASSWORD || "Admin@12345"
  };
}

function buildToken(email, password) {
  return createHash("sha256").update(`${email}::${password}::sanhodo-local-admin`).digest("hex");
}

export function matchesLocalAdminCredentials(email, password) {
  if (!isLocalAdminEnabled()) {
    return false;
  }

  const config = getLocalAdminConfig();
  return email.trim().toLowerCase() === config.email && password === config.password;
}

export function createLocalAdminCookieValue() {
  const config = getLocalAdminConfig();
  return `local-admin:${buildToken(config.email, config.password)}`;
}

export function isValidLocalAdminCookieValue(value) {
  if (!isLocalAdminEnabled()) {
    return false;
  }

  return value === createLocalAdminCookieValue();
}

export function getLocalAdminProfile() {
  const config = getLocalAdminConfig();

  return {
    user: {
      id: "local-admin",
      email: config.email
    },
    profile: {
      id: "local-admin",
      email: config.email,
      full_name: "Local Admin",
      role: "super_admin",
      is_active: true
    }
  };
}

export function getLocalAdminCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 60 * 60 * 8
  };
}
