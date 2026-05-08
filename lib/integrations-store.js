import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const dataDir = path.join(process.cwd(), "data");
const settingsFile = path.join(dataDir, "integrations.json");
const syncLogFile = path.join(dataDir, "integration-sync-logs.json");

export const integrationCatalog = [
  {
    id: "misa-cukcuk",
    name: "MISA CukCuk",
    category: "pos",
    market: "Vietnam",
    description: "Phù hợp cho nhà hàng/quán ăn, có nghiệp vụ đặt chỗ, order, khách hàng, bếp/bar."
  },
  {
    id: "sapo-fnb",
    name: "Sapo FnB",
    category: "pos",
    market: "Vietnam",
    description: "Phù hợp cho nhà hàng & dịch vụ, có bàn, đặt bàn, hóa đơn, thanh toán, khách hàng."
  },
  {
    id: "ipos",
    name: "iPOS / FABi",
    category: "pos",
    market: "Vietnam",
    description: "Giải pháp F&B chuyên sâu cho order, bán tại chỗ, khách hàng và vận hành đa kênh."
  },
  {
    id: "kiotviet-restaurant",
    name: "KiotViet Nhà hàng",
    category: "pos",
    market: "Vietnam",
    description: "Mạnh về POS cảm ứng và vận hành bán hàng nhà hàng/cafe."
  },
  {
    id: "opera-cloud",
    name: "Oracle Hospitality OPERA Cloud",
    category: "pms",
    market: "Hospitality",
    description: "PMS cho khách sạn/resort, phù hợp khi cần đồng bộ dữ liệu khách lưu trú và F&B."
  },
  {
    id: "custom-webhook",
    name: "Custom Webhook / Internal POS",
    category: "custom",
    market: "Any",
    description: "Dùng cho hệ POS nội bộ hoặc trường hợp đối tác chỉ cấp webhook/API riêng."
  }
];

function nowIso() {
  return new Date().toISOString();
}

async function ensureDataDir() {
  await mkdir(dataDir, { recursive: true });
}

async function readJson(filePath, fallback) {
  await ensureDataDir();
  try {
    const contents = await readFile(filePath, "utf8");
    return JSON.parse(contents);
  } catch {
    return fallback;
  }
}

async function writeJson(filePath, value) {
  await ensureDataDir();
  await writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
}

function toDefaultConfig(item) {
  return {
    ...item,
    enabled: false,
    syncMode: "manual",
    endpoint: "",
    apiKey: "",
    apiSecret: "",
    locationCode: "",
    tenantCode: "",
    notes: "",
    mapping: {
      customerNameField: "name",
      customerPhoneField: "phone",
      guestCountField: "guests",
      bookingTimeField: "datetime",
      noteField: "notes"
    },
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
}

export async function getIntegrationSettings() {
  const stored = await readJson(settingsFile, []);
  const byId = new Map(stored.map((item) => [item.id, item]));

  const merged = integrationCatalog.map((catalogItem) => {
    const storedItem = byId.get(catalogItem.id);
    return storedItem
      ? {
          ...toDefaultConfig(catalogItem),
          ...storedItem,
          mapping: {
            ...toDefaultConfig(catalogItem).mapping,
            ...(storedItem.mapping || {})
          }
        }
      : toDefaultConfig(catalogItem);
  });

  await writeJson(settingsFile, merged);
  return merged;
}

export async function updateIntegrationSetting(id, updates) {
  const settings = await getIntegrationSettings();
  const index = settings.findIndex((item) => item.id === id);

  if (index === -1) {
    return null;
  }

  settings[index] = {
    ...settings[index],
    ...updates,
    mapping: {
      ...settings[index].mapping,
      ...(updates.mapping || {})
    },
    updatedAt: nowIso()
  };

  await writeJson(settingsFile, settings);
  return settings[index];
}

export async function getEnabledIntegrations() {
  const settings = await getIntegrationSettings();
  return settings.filter((item) => item.enabled && item.endpoint);
}

export async function appendSyncLog(payload) {
  const logs = await readJson(syncLogFile, []);
  logs.unshift({
    id: `sync_${crypto.randomUUID()}`,
    createdAt: nowIso(),
    ...payload
  });
  await writeJson(syncLogFile, logs.slice(0, 200));
}

export async function getSyncLogs() {
  return readJson(syncLogFile, []);
}

export function buildReservationPayload(reservation, integration) {
  return {
    integrationId: integration.id,
    integrationName: integration.name,
    locationCode: integration.locationCode,
    tenantCode: integration.tenantCode,
    booking: {
      id: reservation.id,
      [integration.mapping.customerNameField]: reservation.name,
      [integration.mapping.customerPhoneField]: reservation.phone,
      [integration.mapping.guestCountField]: reservation.guests,
      [integration.mapping.bookingTimeField]: reservation.datetime,
      [integration.mapping.noteField]: reservation.notes,
      selectedOffer: reservation.selectedOffer,
      assignedTo: reservation.assignedTo,
      status: reservation.status,
      source: reservation.source,
      createdAt: reservation.createdAt
    }
  };
}

export async function syncReservationToIntegration(reservation, integration) {
  const payload = buildReservationPayload(reservation, integration);

  const headers = {
    "Content-Type": "application/json"
  };

  if (integration.apiKey) {
    headers["x-api-key"] = integration.apiKey;
  }

  if (integration.apiSecret) {
    headers["x-api-secret"] = integration.apiSecret;
  }

  const response = await fetch(integration.endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(payload)
  });

  const bodyText = await response.text();

  await appendSyncLog({
    integrationId: integration.id,
    integrationName: integration.name,
    reservationId: reservation.id,
    ok: response.ok,
    status: response.status,
    endpoint: integration.endpoint,
    responsePreview: bodyText.slice(0, 500)
  });

  if (!response.ok) {
    throw new Error(`Sync failed: ${response.status}`);
  }

  return {
    ok: true,
    status: response.status,
    responsePreview: bodyText.slice(0, 500)
  };
}
