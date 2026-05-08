import crypto from "node:crypto";

export const ADMIN_COOKIE_NAME = "sanhodo_admin_session";

function getEnvValue(key, fallback) {
  return process.env[key] || fallback;
}

export function getAdminCredentials() {
  return {
    username: getEnvValue("ADMIN_USERNAME", "admin"),
    password: getEnvValue("ADMIN_PASSWORD", "admin12345"),
    secret: getEnvValue("ADMIN_SESSION_SECRET", "sanhodo-secret")
  };
}

export function createAdminSessionToken() {
  const { username, password, secret } = getAdminCredentials();
  return crypto.createHash("sha256").update(`${username}:${password}:${secret}`).digest("hex");
}

export function validateAdminCredentials(username, password) {
  const creds = getAdminCredentials();
  return username === creds.username && password === creds.password;
}

export function isAdminAuthenticated(cookieValue) {
  return cookieValue === createAdminSessionToken();
}
