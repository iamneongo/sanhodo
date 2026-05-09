export function isSupabaseSchemaMissingError(error) {
  const message = String(error?.message || "");
  return (
    message.includes("schema cache") ||
    message.includes("Could not find the table") ||
    message.includes("Supabase schema") ||
    message.includes("relation") && message.includes("does not exist")
  );
}

export function toFriendlySupabaseErrorMessage(error, fallbackMessage) {
  if (isSupabaseSchemaMissingError(error)) {
    return "Supabase schema chua duoc khoi tao. Hay chay file supabase/schema.sql va tao user admin theo SUPABASE_SETUP.md.";
  }

  return error?.message || fallbackMessage || "Supabase request failed";
}

function throwIfError(error, fallbackMessage) {
  if (error) {
    throw new Error(toFriendlySupabaseErrorMessage(error, fallbackMessage));
  }
}

function parseInteger(value, fallback = 0) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseMoney(value, fallback = 0) {
  const normalized = String(value ?? "").replace(/[^\d.-]/g, "");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function cleanText(value, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function slugify(value) {
  return cleanText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function toInputDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return cleanText(value);
  }

  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function toIsoDateTime(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
}

function normalizeReservationRow(row) {
  return {
    id: row.id,
    type: "reservation",
    name: row.customer_name,
    phone: row.customer_phone,
    guests: String(row.guest_count),
    datetime: toInputDateTime(row.reservation_at),
    selectedOffer: row.selected_offer || "",
    status: row.status,
    source: row.source,
    notes: row.notes || "",
    assignedTo: row.assigned_to || "",
    lastContactAt: toInputDateTime(row.last_contact_at),
    tableId: row.table_id || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function normalizeVoucherRow(row) {
  return {
    id: row.id,
    type: "voucher",
    phone: row.phone,
    status: row.status,
    source: row.source,
    notes: row.notes || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function normalizeMenuItemRow(row) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    category: row.category,
    description: row.description || "",
    price: Number(row.price || 0),
    imageUrl: row.image_url || "",
    prepTimeMinutes: row.prep_time_minutes || 15,
    spicyLevel: row.spicy_level || "none",
    isFeatured: Boolean(row.is_featured),
    isAvailable: Boolean(row.is_available),
    sortOrder: row.sort_order || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function normalizeTableRow(row) {
  return {
    id: row.id,
    name: row.name,
    area: row.area,
    capacity: row.capacity,
    status: row.status,
    minSpend: Number(row.min_spend || 0),
    notes: row.notes || "",
    sortOrder: row.sort_order || 0,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function normalizeOrderItemRow(row) {
  return {
    id: row.id,
    menuItemId: row.menu_item_id || "",
    itemName: row.item_name,
    unitPrice: Number(row.unit_price || 0),
    quantity: row.quantity,
    lineTotal: Number(row.line_total || 0),
    notes: row.notes || ""
  };
}

function normalizeOrderRow(row) {
  return {
    id: row.id,
    reservationId: row.reservation_id || "",
    tableId: row.table_id || "",
    customerName: row.customer_name,
    customerPhone: row.customer_phone || "",
    status: row.status,
    orderChannel: row.order_channel,
    notes: row.notes || "",
    subtotal: Number(row.subtotal || 0),
    discountAmount: Number(row.discount_amount || 0),
    serviceCharge: Number(row.service_charge || 0),
    totalAmount: Number(row.total_amount || 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items: Array.isArray(row.order_items) ? row.order_items.map(normalizeOrderItemRow) : []
  };
}

function normalizeIntegrationRow(row) {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    category: row.category,
    market: row.market,
    description: row.description || "",
    enabled: Boolean(row.enabled),
    syncMode: row.sync_mode,
    endpoint: row.endpoint || "",
    apiKey: row.api_key || "",
    apiSecret: row.api_secret || "",
    locationCode: row.location_code || "",
    tenantCode: row.tenant_code || "",
    notes: row.notes || "",
    mapping: row.mapping || {
      customerNameField: "name",
      customerPhoneField: "phone",
      guestCountField: "guests",
      bookingTimeField: "datetime",
      noteField: "notes"
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function normalizeSyncLogRow(row) {
  return {
    id: row.id,
    integrationId: row.integration_code,
    integrationName: row.integration_name,
    reservationId: row.reservation_id || "",
    ok: Boolean(row.ok),
    status: row.status,
    endpoint: row.endpoint || "",
    responsePreview: row.response_preview || "",
    createdAt: row.created_at
  };
}

function buildReservationValues(payload) {
  return {
    customer_name: cleanText(payload.name),
    customer_phone: cleanText(payload.phone),
    guest_count: parseInteger(payload.guests, 2),
    reservation_at: toIsoDateTime(payload.datetime),
    selected_offer: cleanText(payload.selectedOffer),
    status: cleanText(payload.status, "new") || "new",
    source: cleanText(payload.source, "landing-page") || "landing-page",
    notes: cleanText(payload.notes),
    assigned_to: cleanText(payload.assignedTo),
    last_contact_at: toIsoDateTime(payload.lastContactAt),
    table_id: cleanText(payload.tableId) || null
  };
}

function buildVoucherValues(payload) {
  return {
    phone: cleanText(payload.phone),
    status: cleanText(payload.status, "new") || "new",
    source: cleanText(payload.source, "landing-page") || "landing-page",
    notes: cleanText(payload.notes)
  };
}

function buildMenuItemValues(payload) {
  const slug = cleanText(payload.slug) || slugify(payload.name);
  return {
    name: cleanText(payload.name),
    slug: slug || `menu-${Date.now()}`,
    category: cleanText(payload.category, "Hải sản") || "Hải sản",
    description: cleanText(payload.description),
    price: parseMoney(payload.price, 0),
    image_url: cleanText(payload.imageUrl),
    prep_time_minutes: parseInteger(payload.prepTimeMinutes, 15),
    spicy_level: cleanText(payload.spicyLevel, "none") || "none",
    is_featured: Boolean(payload.isFeatured),
    is_available: payload.isAvailable !== false,
    sort_order: parseInteger(payload.sortOrder, 0)
  };
}

function buildTableValues(payload) {
  return {
    name: cleanText(payload.name),
    area: cleanText(payload.area, "Sảnh chính") || "Sảnh chính",
    capacity: parseInteger(payload.capacity, 2),
    status: cleanText(payload.status, "available") || "available",
    min_spend: parseMoney(payload.minSpend, 0),
    notes: cleanText(payload.notes),
    sort_order: parseInteger(payload.sortOrder, 0),
    is_active: payload.isActive !== false
  };
}

function calculateOrderItems(items = []) {
  const normalizedItems = items
    .filter((item) => cleanText(item.itemName || item.name))
    .map((item) => {
      const quantity = Math.max(1, parseInteger(item.quantity, 1));
      const unitPrice = parseMoney(item.unitPrice ?? item.price, 0);
      return {
        menu_item_id: cleanText(item.menuItemId) || null,
        item_name: cleanText(item.itemName || item.name),
        unit_price: unitPrice,
        quantity,
        line_total: unitPrice * quantity,
        notes: cleanText(item.notes)
      };
    });

  const subtotal = normalizedItems.reduce((sum, item) => sum + item.line_total, 0);
  return { normalizedItems, subtotal };
}

function buildOrderValues(payload) {
  const discountAmount = parseMoney(payload.discountAmount, 0);
  const serviceCharge = parseMoney(payload.serviceCharge, 0);
  const { normalizedItems, subtotal } = calculateOrderItems(payload.items);
  const totalAmount = Math.max(0, subtotal - discountAmount + serviceCharge);

  return {
    order: {
      reservation_id: cleanText(payload.reservationId) || null,
      table_id: cleanText(payload.tableId) || null,
      customer_name: cleanText(payload.customerName),
      customer_phone: cleanText(payload.customerPhone),
      status: cleanText(payload.status, "draft") || "draft",
      order_channel: cleanText(payload.orderChannel, "admin") || "admin",
      notes: cleanText(payload.notes),
      subtotal,
      discount_amount: discountAmount,
      service_charge: serviceCharge,
      total_amount: totalAmount
    },
    items: normalizedItems
  };
}

function buildIntegrationValues(payload) {
  return {
    name: cleanText(payload.name),
    category: cleanText(payload.category),
    market: cleanText(payload.market),
    description: cleanText(payload.description),
    enabled: Boolean(payload.enabled),
    sync_mode: cleanText(payload.syncMode, "manual") || "manual",
    endpoint: cleanText(payload.endpoint),
    api_key: cleanText(payload.apiKey),
    api_secret: cleanText(payload.apiSecret),
    location_code: cleanText(payload.locationCode),
    tenant_code: cleanText(payload.tenantCode),
    notes: cleanText(payload.notes),
    mapping: payload.mapping || undefined
  };
}

export async function listReservations(supabase) {
  const { data, error } = await supabase
    .from("reservations")
    .select("*")
    .order("created_at", { ascending: false });

  throwIfError(error, "Không tải được đặt bàn");
  return (data || []).map(normalizeReservationRow);
}

export async function createReservation(supabase, payload) {
  const values = buildReservationValues(payload);
  const { data, error } = await supabase
    .from("reservations")
    .insert(values)
    .select("*")
    .single();

  throwIfError(error, "Không tạo được đặt bàn");
  return normalizeReservationRow(data);
}

export async function updateReservation(supabase, id, payload) {
  const values = buildReservationValues(payload);
  const { data, error } = await supabase
    .from("reservations")
    .update(values)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  throwIfError(error, "Không cập nhật được đặt bàn");
  return data ? normalizeReservationRow(data) : null;
}

export async function deleteReservation(supabase, id) {
  const { error } = await supabase.from("reservations").delete().eq("id", id);
  throwIfError(error, "Không xóa được đặt bàn");
  return true;
}

export async function listVoucherLeads(supabase) {
  const { data, error } = await supabase
    .from("voucher_leads")
    .select("*")
    .order("created_at", { ascending: false });

  throwIfError(error, "Không tải được voucher");
  return (data || []).map(normalizeVoucherRow);
}

export async function createVoucherLead(supabase, payload) {
  const values = buildVoucherValues(payload);
  const { data, error } = await supabase
    .from("voucher_leads")
    .insert(values)
    .select("*")
    .single();

  throwIfError(error, "Không tạo được voucher");
  return normalizeVoucherRow(data);
}

export async function updateVoucherLead(supabase, id, payload) {
  const values = buildVoucherValues(payload);
  const { data, error } = await supabase
    .from("voucher_leads")
    .update(values)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  throwIfError(error, "Không cập nhật được voucher");
  return data ? normalizeVoucherRow(data) : null;
}

export async function deleteVoucherLead(supabase, id) {
  const { error } = await supabase.from("voucher_leads").delete().eq("id", id);
  throwIfError(error, "Không xóa được voucher");
  return true;
}

export async function listMenuItems(supabase, options = {}) {
  let query = supabase
    .from("menu_items")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (options.availableOnly) {
    query = query.eq("is_available", true);
  }

  if (options.featuredOnly) {
    query = query.eq("is_featured", true);
  }

  const { data, error } = await query;
  throwIfError(error, "Không tải được món ăn");
  return (data || []).map(normalizeMenuItemRow);
}

export async function createMenuItem(supabase, payload) {
  const values = buildMenuItemValues(payload);
  const { data, error } = await supabase
    .from("menu_items")
    .insert(values)
    .select("*")
    .single();

  throwIfError(error, "Không tạo được món ăn");
  return normalizeMenuItemRow(data);
}

export async function updateMenuItem(supabase, id, payload) {
  const values = buildMenuItemValues(payload);
  const { data, error } = await supabase
    .from("menu_items")
    .update(values)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  throwIfError(error, "Không cập nhật được món ăn");
  return data ? normalizeMenuItemRow(data) : null;
}

export async function deleteMenuItem(supabase, id) {
  const { error } = await supabase.from("menu_items").delete().eq("id", id);
  throwIfError(error, "Không xóa được món ăn");
  return true;
}

export async function listRestaurantTables(supabase) {
  const { data, error } = await supabase
    .from("restaurant_tables")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  throwIfError(error, "Không tải được bàn");
  return (data || []).map(normalizeTableRow);
}

export async function createRestaurantTable(supabase, payload) {
  const values = buildTableValues(payload);
  const { data, error } = await supabase
    .from("restaurant_tables")
    .insert(values)
    .select("*")
    .single();

  throwIfError(error, "Không tạo được bàn");
  return normalizeTableRow(data);
}

export async function updateRestaurantTable(supabase, id, payload) {
  const values = buildTableValues(payload);
  const { data, error } = await supabase
    .from("restaurant_tables")
    .update(values)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  throwIfError(error, "Không cập nhật được bàn");
  return data ? normalizeTableRow(data) : null;
}

export async function deleteRestaurantTable(supabase, id) {
  const { error } = await supabase.from("restaurant_tables").delete().eq("id", id);
  throwIfError(error, "Không xóa được bàn");
  return true;
}

export async function listOrders(supabase) {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false });

  throwIfError(error, "Không tải được đơn món");
  return (data || []).map(normalizeOrderRow);
}

export async function createOrder(supabase, payload) {
  const { order, items } = buildOrderValues(payload);
  const { data: orderRow, error: orderError } = await supabase
    .from("orders")
    .insert(order)
    .select("*")
    .single();

  throwIfError(orderError, "Không tạo được đơn món");

  if (items.length) {
    const insertItems = items.map((item) => ({ ...item, order_id: orderRow.id }));
    const { error: itemsError } = await supabase.from("order_items").insert(insertItems);
    throwIfError(itemsError, "Không thêm được món vào đơn");
  }

  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", orderRow.id)
    .single();

  throwIfError(error, "Không tải lại được đơn món");
  return normalizeOrderRow(data);
}

export async function createPublicOrder(supabase, payload) {
  const draft = {
    ...payload,
    status: payload.status || "draft",
    orderChannel: payload.orderChannel || "website"
  };

  return createOrder(supabase, draft);
}

export async function updateOrder(supabase, id, payload) {
  const { order, items } = buildOrderValues(payload);
  const { data: updatedOrder, error: orderError } = await supabase
    .from("orders")
    .update(order)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  throwIfError(orderError, "Không cập nhật được đơn món");
  if (!updatedOrder) return null;

  if (Array.isArray(payload.items)) {
    const { error: deleteItemsError } = await supabase.from("order_items").delete().eq("order_id", id);
    throwIfError(deleteItemsError, "Không làm mới được món trong đơn");

    if (items.length) {
      const insertItems = items.map((item) => ({ ...item, order_id: id }));
      const { error: itemsError } = await supabase.from("order_items").insert(insertItems);
      throwIfError(itemsError, "Không cập nhật được món trong đơn");
    }
  }

  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", id)
    .single();

  throwIfError(error, "Không tải lại được đơn món");
  return normalizeOrderRow(data);
}

export async function deleteOrder(supabase, id) {
  const { error } = await supabase.from("orders").delete().eq("id", id);
  throwIfError(error, "Không xóa được đơn món");
  return true;
}

export async function listIntegrationSettings(supabase) {
  const { data, error } = await supabase
    .from("integration_settings")
    .select("*")
    .order("name", { ascending: true });

  throwIfError(error, "Không tải được cấu hình tích hợp");
  return (data || []).map(normalizeIntegrationRow);
}

export async function updateIntegrationSettingDb(supabase, id, payload) {
  const { data: currentRow, error: currentError } = await supabase
    .from("integration_settings")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  throwIfError(currentError, "Không tải được cấu hình tích hợp");
  if (!currentRow) return null;

  const current = normalizeIntegrationRow(currentRow);
  const values = buildIntegrationValues({
    ...current,
    ...payload,
    mapping: {
      ...(current.mapping || {}),
      ...(payload.mapping || {})
    }
  });

  const { data, error } = await supabase
    .from("integration_settings")
    .update(values)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  throwIfError(error, "Không cập nhật được cấu hình tích hợp");
  return data ? normalizeIntegrationRow(data) : null;
}

export async function listIntegrationSyncLogs(supabase) {
  const { data, error } = await supabase
    .from("integration_sync_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  throwIfError(error, "Không tải được log tích hợp");
  return (data || []).map(normalizeSyncLogRow);
}

function buildIntegrationPayload(reservation, integration) {
  return {
    integrationId: integration.id,
    integrationCode: integration.code,
    integrationName: integration.name,
    locationCode: integration.locationCode,
    tenantCode: integration.tenantCode,
    booking: {
      id: reservation.id,
      [integration.mapping.customerNameField || "name"]: reservation.name,
      [integration.mapping.customerPhoneField || "phone"]: reservation.phone,
      [integration.mapping.guestCountField || "guests"]: reservation.guests,
      [integration.mapping.bookingTimeField || "datetime"]: reservation.datetime,
      [integration.mapping.noteField || "notes"]: reservation.notes,
      selectedOffer: reservation.selectedOffer,
      assignedTo: reservation.assignedTo,
      status: reservation.status,
      source: reservation.source,
      createdAt: reservation.createdAt
    }
  };
}

export async function syncReservationToIntegrationDb(supabase, reservationId, integrationId) {
  const [reservations, integrations] = await Promise.all([
    listReservations(supabase),
    listIntegrationSettings(supabase)
  ]);

  const reservation = reservations.find((item) => item.id === reservationId);
  const integration = integrations.find((item) => item.id === integrationId);

  if (!reservation || !integration) {
    throw new Error("Reservation or integration not found");
  }

  if (!integration.enabled || !integration.endpoint) {
    throw new Error("Integration is not fully configured");
  }

  const payload = buildIntegrationPayload(reservation, integration);
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

  const responsePreview = (await response.text()).slice(0, 500);

  const { error: logError } = await supabase.from("integration_sync_logs").insert({
    integration_code: integration.code,
    integration_name: integration.name,
    reservation_id: reservation.id,
    ok: response.ok,
    status: response.status,
    endpoint: integration.endpoint,
    response_preview: responsePreview
  });

  throwIfError(logError, "Không lưu được sync log");

  if (!response.ok) {
    throw new Error(`Sync failed: ${response.status}`);
  }

  return {
    ok: true,
    status: response.status,
    responsePreview
  };
}

export async function getAdminDashboardData(supabase) {
  const [
    reservations,
    vouchers,
    integrations,
    syncLogs,
    menuItems,
    restaurantTables,
    orders
  ] = await Promise.all([
    listReservations(supabase),
    listVoucherLeads(supabase),
    listIntegrationSettings(supabase),
    listIntegrationSyncLogs(supabase),
    listMenuItems(supabase),
    listRestaurantTables(supabase),
    listOrders(supabase)
  ]);

  return {
    reservations,
    vouchers,
    integrations,
    syncLogs,
    menuItems,
    restaurantTables,
    orders
  };
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
    "tableId",
    "createdAt",
    "updatedAt"
  ];

  const rows = items.map((item) =>
    headers.map((header) => `"${String(item[header] ?? "").replaceAll('"', '""')}"`).join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}

export function vouchersToCsv(items) {
  const headers = ["id", "phone", "status", "source", "notes", "createdAt", "updatedAt"];
  const rows = items.map((item) =>
    headers.map((header) => `"${String(item[header] ?? "").replaceAll('"', '""')}"`).join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}

export async function forwardToWebhooks(payload, urls = []) {
  const targets = urls.filter(Boolean);
  if (!targets.length) {
    return [];
  }

  return Promise.allSettled(
    targets.map((url) =>
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
    )
  );
}
