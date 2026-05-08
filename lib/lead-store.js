import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const dataDir = path.join(process.cwd(), "data");

export const RESERVATIONS_FILE = "reservations.json";
export const VOUCHERS_FILE = "vouchers.json";

async function ensureDataDir() {
  await mkdir(dataDir, { recursive: true });
}

function nowIso() {
  return new Date().toISOString();
}

function createId(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeReservation(item = {}) {
  return {
    id: item.id || createId("res"),
    type: "reservation",
    name: normalizeString(item.name),
    phone: normalizeString(item.phone),
    guests: String(item.guests || ""),
    datetime: normalizeString(item.datetime),
    selectedOffer: normalizeString(item.selectedOffer),
    status: normalizeString(item.status) || "new",
    source: normalizeString(item.source) || "landing-page",
    notes: normalizeString(item.notes),
    assignedTo: normalizeString(item.assignedTo),
    lastContactAt: normalizeString(item.lastContactAt),
    tags: Array.isArray(item.tags) ? item.tags : [],
    createdAt: item.createdAt || nowIso(),
    updatedAt: item.updatedAt || item.createdAt || nowIso()
  };
}

function normalizeVoucher(item = {}) {
  return {
    id: item.id || createId("vou"),
    type: "voucher",
    phone: normalizeString(item.phone),
    status: normalizeString(item.status) || "new",
    source: normalizeString(item.source) || "landing-page",
    notes: normalizeString(item.notes),
    createdAt: item.createdAt || nowIso(),
    updatedAt: item.updatedAt || item.createdAt || nowIso()
  };
}

function getNormalizer(type) {
  return type === "voucher" ? normalizeVoucher : normalizeReservation;
}

async function readJsonArray(filename) {
  await ensureDataDir();
  const filePath = path.join(dataDir, filename);

  try {
    const contents = await readFile(filePath, "utf8");
    const parsed = JSON.parse(contents);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeJsonArray(filename, data) {
  await ensureDataDir();
  const filePath = path.join(dataDir, filename);
  await writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

export async function readLeads(filename, type) {
  const items = await readJsonArray(filename);
  const normalize = getNormalizer(type);
  return items.map((item) => normalize(item));
}

export async function writeLeads(filename, data) {
  await writeJsonArray(filename, data);
}

export async function appendLead(filename, payload, type) {
  const normalize = getNormalizer(type);
  const existing = await readLeads(filename, type);
  const item = normalize(payload);
  existing.push(item);
  await writeLeads(filename, existing);
  return item;
}

export async function updateLead(filename, type, id, updates) {
  const existing = await readLeads(filename, type);
  const normalize = getNormalizer(type);
  const index = existing.findIndex((item) => item.id === id);

  if (index === -1) {
    return null;
  }

  const updated = normalize({
    ...existing[index],
    ...updates,
    updatedAt: nowIso()
  });

  existing[index] = updated;
  await writeLeads(filename, existing);
  return updated;
}

export async function deleteLead(filename, type, id) {
  const existing = await readLeads(filename, type);
  const next = existing.filter((item) => item.id !== id);

  if (next.length === existing.length) {
    return false;
  }

  await writeLeads(filename, next);
  return true;
}

export function reservationsToCsv(items) {
  const headers = [
    "id",
    "name",
    "phone",
    "guests",
    "datetime",
    "selectedOffer",
    "status",
    "source",
    "assignedTo",
    "lastContactAt",
    "notes",
    "createdAt",
    "updatedAt"
  ];

  const rows = items.map((item) =>
    headers
      .map((header) => `"${String(item[header] ?? "").replaceAll('"', '""')}"`)
      .join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}

export function vouchersToCsv(items) {
  const headers = ["id", "phone", "status", "source", "notes", "createdAt", "updatedAt"];
  const rows = items.map((item) =>
    headers
      .map((header) => `"${String(item[header] ?? "").replaceAll('"', '""')}"`)
      .join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}

export async function forwardToWebhooks(payload, urls = []) {
  const targets = urls.filter(Boolean);
  if (!targets.length) {
    return [];
  }

  const results = await Promise.allSettled(
    targets.map((url) =>
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
    )
  );

  return results;
}
