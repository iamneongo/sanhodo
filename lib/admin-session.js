import crypto from "node:crypto";

export const ADMIN_SESSION_COOKIE = "sanhodo-admin-session";

function getSessionSecret() {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.LOCAL_ADMIN_PASSWORD ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "sanhodo-dev-secret"
  );
}

function signPayload(payload) {
  return crypto.createHmac("sha256", getSessionSecret()).update(payload).digest("hex");
}

export function createAdminSessionValue(session) {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  const signature = signPayload(payload);
  return `${payload}.${signature}`;
}

export function parseAdminSessionValue(value) {
  if (!value || !value.includes(".")) {
    return null;
  }

  const [payload, signature] = value.split(".");
  if (!payload || !signature) {
    return null;
  }

  const expected = signPayload(payload);
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

export function getAdminSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12
  };
}
