import { DEFAULT_BRANCHES, MAIN_BRANCH_ID, normalizeBranches } from "./branches";
import {
  buildFallbackVoucherCampaign,
  isValidVietnamPhone,
  normalizeVietnamPhone,
  sanitizeGuestCount
} from "./business-rules";

export function isSupabaseSchemaMissingError(error) {
  const message = String(error?.message || "");
  const code = String(error?.code || "");
  return (
    message.includes("schema cache") ||
    message.includes("Could not find the table") ||
    message.includes("Supabase schema") ||
    (message.includes("relation") && message.includes("does not exist")) ||
    (message.includes("column") && message.includes("does not exist")) ||
    code === "42703"
  );
}

function getSupabaseMigrationHint(error) {
  const message = String(error?.message || "").toLowerCase();

  const hints = [
    {
      matchers: [
        "availability_status",
        "season_note",
        "confirmation_channel",
        "confirmation_sent_at",
        "voucher_discount_type",
        "voucher_discount_value",
        "voucher_title",
        "expires_at"
      ],
      migration: "supabase/migrations/20260511_003_phase1_conversion.sql",
      label: "schema phase 1"
    },
    {
      matchers: ["last_login_at", "is_active"],
      migration: "supabase/migrations/20260513_009_staff_account_status.sql",
      label: "schema nhan su"
    },
    {
      matchers: ["branches", "branch_staff_assignments"],
      migration: "supabase/migrations/20260511_005_phase3_multi_branch_foundation.sql",
      label: "schema chi nhanh"
    },
    {
      matchers: ["voucher_campaigns", "customer_profiles", "voucher_redemptions", "campaign_id"],
      migration: "supabase/migrations/20260511_006_phase4_voucher_loyalty.sql",
      label: "schema voucher loyalty"
    },
    {
      matchers: ["drivers", "driver_referrals", "driver_commission_transactions", "driver_id", "referral_code"],
      migration: "supabase/migrations/20260511_007_phase5_driver_commission.sql",
      label: "schema tai xe"
    },
    {
      matchers: ["travel_partners", "partner_contracts", "partner_bookings"],
      migration: "supabase/migrations/20260511_008_phase6_travel_partner_portal.sql",
      label: "schema doi tac"
    }
  ];

  const matched = hints.find((hint) => hint.matchers.some((item) => message.includes(item)));
  return matched || null;
}

export function toFriendlySupabaseErrorMessage(error, fallbackMessage) {
  if (isSupabaseSchemaMissingError(error)) {
    const hint = getSupabaseMigrationHint(error);
    if (hint) {
      return `Supabase dang thieu ${hint.label}. Hay chay file ${hint.migration} theo huong dan trong SUPABASE_SETUP.md.`;
    }

    return "Supabase schema chua duoc khoi tao. Hay chay file supabase/schema.sql va tao user admin theo SUPABASE_SETUP.md.";
  }

  return error?.message || fallbackMessage || "Supabase request failed";
}

function isMissingColumnError(error, columnName) {
  const message = String(error?.message || "");
  const code = String(error?.code || "");
  return (
    message.includes(columnName) &&
    (code === "42703" || message.includes("schema cache") || message.includes("does not exist"))
  );
}

function isConstraintError(error, constraintName) {
  const message = String(error?.message || "");
  return message.includes(constraintName);
}

async function runWithOptionalBranchFilter(branchId, factory) {
  const shouldUseBranch = Boolean(branchId);
  let result = await factory(shouldUseBranch);

  if (!result.error) {
    return result;
  }

  if (shouldUseBranch && isMissingColumnError(result.error, "branch_id")) {
    result = await factory(false);
  }

  return result;
}

async function probeFeatureTable(supabase, table, options = {}) {
  const branchId = cleanText(options.branchId);
  const usesBranch = Boolean(options.usesBranch);
  const factory = (useBranch) => {
    let query = supabase.from(table).select("id").limit(1);
    if (usesBranch && useBranch) {
      query = query.eq("branch_id", branchId);
    }
    return query;
  };

  const result =
    usesBranch && branchId ? await runWithOptionalBranchFilter(branchId, factory) : await factory(false);

  if (!result.error) {
    return {
      ready: true,
      message: ""
    };
  }

  return {
    ready: false,
    message: toFriendlySupabaseErrorMessage(result.error, options.fallbackMessage)
  };
}

function stripOptionalColumns(values, optionalColumns = []) {
  const next = { ...values };
  optionalColumns.forEach((column) => {
    delete next[column];
  });
  return next;
}

async function insertWithOptionalColumns(supabase, table, values, options = {}) {
  const { select = false, single = false } = options;
  const execute = (payload) => {
    let query = supabase.from(table).insert(payload);
    if (select) {
      query = query.select("*");
      if (single) {
        query = query.single();
      }
    }
    return query;
  };

  const optionalColumns = options.optionalColumns || ["branch_id"];
  let payload = { ...values };
  let result = await execute(payload);

  for (const column of optionalColumns) {
    if (result.error && isMissingColumnError(result.error, column)) {
      payload = stripOptionalColumns(payload, [column]);
      result = await execute(payload);
    }
  }

  return result;
}

async function updateWithOptionalColumns(supabase, table, id, values, options = {}) {
  const execute = (payload) =>
    supabase.from(table).update(payload).eq("id", id).select("*").maybeSingle();

  const optionalColumns = options.optionalColumns || ["branch_id"];
  let payload = { ...values };
  let result = await execute(payload);

  for (const column of optionalColumns) {
    if (result.error && isMissingColumnError(result.error, column)) {
      payload = stripOptionalColumns(payload, [column]);
      result = await execute(payload);
    }
  }

  return result;
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
    confirmationChannel: row.confirmation_channel || "zalo",
    confirmationSentAt: toInputDateTime(row.confirmation_sent_at),
    driverId: row.driver_id || "",
    referralCode: row.referral_code || "",
    branchId: row.branch_id || "",
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
    voucherCode: row.voucher_code || "",
    voucherTitle: row.voucher_title || "",
    voucherDiscountType: row.voucher_discount_type || "percent",
    voucherDiscountValue: Number(row.voucher_discount_value || 0),
    voucherDescription: row.voucher_description || "",
    expiresAt: row.expires_at || "",
    campaignId: row.campaign_id || "",
    customerProfileId: row.customer_profile_id || "",
    branchId: row.branch_id || "",
    notes: row.notes || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function normalizeVoucherCampaignRow(row) {
  return {
    id: row.id,
    code: row.code || "early-booking",
    name: row.name || row.title || "Voucher campaign",
    title: row.title || row.name || "Ưu đãi đặt bàn sớm",
    description: row.description || "",
    discountType: row.discount_type || "percent",
    discountValue: Number(row.discount_value || 0),
    minOrderValue: Number(row.min_order_value || 0),
    validDays: Number(row.valid_days || 14),
    usageLimitTotal: Number(row.usage_limit_total || 0),
    usageLimitPerPhone: Number(row.usage_limit_per_phone || 1),
    autoIssue: row.auto_issue !== false,
    isActive: row.is_active !== false,
    startsAt: row.starts_at || "",
    endsAt: row.ends_at || "",
    branchId: row.branch_id || "",
    sortOrder: row.sort_order || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function normalizeCustomerProfileRow(row) {
  return {
    id: row.id,
    phone: row.phone || "",
    fullName: row.full_name || "",
    email: row.email || "",
    tier: row.tier || "member",
    loyaltyPoints: Number(row.loyalty_points || 0),
    totalSpent: Number(row.total_spent || 0),
    visitCount: Number(row.visit_count || 0),
    lastSeenAt: row.last_seen_at || "",
    branchId: row.branch_id || "",
    notes: row.notes || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function normalizeVoucherRedemptionRow(row) {
  return {
    id: row.id,
    voucherLeadId: row.voucher_lead_id || "",
    campaignId: row.campaign_id || "",
    customerProfileId: row.customer_profile_id || "",
    orderId: row.order_id || "",
    branchId: row.branch_id || "",
    status: row.status || "redeemed",
    amountSaved: Number(row.amount_saved || 0),
    spendAmount: Number(row.spend_amount || 0),
    loyaltyPointsAwarded: Number(row.loyalty_points_awarded || 0),
    redeemedBy: row.redeemed_by || "",
    notes: row.notes || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function normalizeDriverRow(row) {
  return {
    id: row.id,
    branchId: row.branch_id || "",
    code: row.code || "",
    fullName: row.full_name || "",
    phone: row.phone || "",
    vehicleType: row.vehicle_type || "",
    status: row.status || "active",
    referralCode: row.referral_code || "",
    commissionRate: Number(row.commission_rate || 0),
    notes: row.notes || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function normalizeDriverReferralRow(row) {
  return {
    id: row.id,
    branchId: row.branch_id || "",
    driverId: row.driver_id || "",
    reservationId: row.reservation_id || "",
    orderId: row.order_id || "",
    referredName: row.referred_name || "",
    referredPhone: row.referred_phone || "",
    referralCode: row.referral_code || "",
    status: row.status || "new",
    commissionBaseAmount: Number(row.commission_base_amount || 0),
    commissionAmount: Number(row.commission_amount || 0),
    notes: row.notes || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function normalizeDriverCommissionRow(row) {
  return {
    id: row.id,
    branchId: row.branch_id || "",
    driverId: row.driver_id || "",
    referralId: row.referral_id || "",
    reservationId: row.reservation_id || "",
    orderId: row.order_id || "",
    status: row.status || "pending",
    commissionAmount: Number(row.commission_amount || 0),
    payoutMethod: row.payout_method || "",
    paidAt: row.paid_at || "",
    notes: row.notes || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function normalizeTravelPartnerRow(row) {
  return {
    id: row.id,
    branchId: row.branch_id || "",
    code: row.code || "",
    name: row.name || "",
    partnerType: row.partner_type || "agency",
    contactName: row.contact_name || "",
    phone: row.phone || "",
    email: row.email || "",
    commissionType: row.commission_type || "percent",
    commissionValue: Number(row.commission_value || 0),
    status: row.status || "active",
    notes: row.notes || "",
    contractStartAt: row.contract_start_at || "",
    contractEndAt: row.contract_end_at || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function normalizePartnerContractRow(row) {
  return {
    id: row.id,
    partnerId: row.partner_id || "",
    branchId: row.branch_id || "",
    title: row.title || "",
    discountPercent: Number(row.discount_percent || 0),
    commissionPercent: Number(row.commission_percent || 0),
    paymentTerms: row.payment_terms || "",
    status: row.status || "draft",
    startsAt: row.starts_at || "",
    endsAt: row.ends_at || "",
    notes: row.notes || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function normalizePartnerBookingRow(row) {
  return {
    id: row.id,
    partnerId: row.partner_id || "",
    reservationId: row.reservation_id || "",
    branchId: row.branch_id || "",
    code: row.code || "",
    customerName: row.customer_name || "",
    customerPhone: row.customer_phone || "",
    groupSize: Number(row.group_size || 0),
    bookingAt: toInputDateTime(row.booking_at),
    packageName: row.package_name || "",
    menuBudget: Number(row.menu_budget || 0),
    discountAmount: Number(row.discount_amount || 0),
    commissionAmount: Number(row.commission_amount || 0),
    status: row.status || "lead",
    guestManifestUrl: row.guest_manifest_url || "",
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
    availabilityStatus: row.availability_status || "available",
    seasonNote: row.season_note || "",
    branchId: row.branch_id || "",
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
    branchId: row.branch_id || "",
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
    driverId: row.driver_id || "",
    referralCode: row.referral_code || "",
    branchId: row.branch_id || "",
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
    branchId: row.branch_id || "",
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
  const name = cleanText(payload.name || payload.customerName);
  const phone = cleanText(payload.phone || payload.customerPhone);
  const guests =
    payload.guests !== undefined && payload.guests !== null && payload.guests !== ""
      ? payload.guests
      : payload.guestCount;
  const datetime = cleanText(payload.datetime || payload.reservationAt);

  return {
    customer_name: name,
    customer_phone: normalizeVietnamPhone(phone),
    guest_count: sanitizeGuestCount(guests),
    reservation_at: toIsoDateTime(datetime),
    selected_offer: cleanText(payload.selectedOffer),
    status: cleanText(payload.status, "new") || "new",
    source: cleanText(payload.source, "landing-page") || "landing-page",
    notes: cleanText(payload.notes),
    assigned_to: cleanText(payload.assignedTo),
    last_contact_at: toIsoDateTime(payload.lastContactAt),
    confirmation_channel: cleanText(payload.confirmationChannel, "zalo") || "zalo",
    confirmation_sent_at: toIsoDateTime(payload.confirmationSentAt),
    driver_id: cleanText(payload.driverId) || null,
    referral_code: cleanText(payload.referralCode),
    branch_id: cleanText(payload.branchId) || null,
    table_id: cleanText(payload.tableId) || null
  };
}

function buildVoucherValues(payload) {
  return {
    phone: normalizeVietnamPhone(payload.phone),
    status: cleanText(payload.status, "new") || "new",
    source: cleanText(payload.source, "landing-page") || "landing-page",
    voucher_code: cleanText(payload.voucherCode),
    voucher_title: cleanText(payload.voucherTitle),
    voucher_discount_type: cleanText(payload.voucherDiscountType, "percent") || "percent",
    voucher_discount_value: parseMoney(payload.voucherDiscountValue, 0),
    voucher_description: cleanText(payload.voucherDescription),
    expires_at: toIsoDateTime(payload.expiresAt),
    campaign_id: cleanText(payload.campaignId) || null,
    customer_profile_id: cleanText(payload.customerProfileId) || null,
    branch_id: cleanText(payload.branchId) || null,
    notes: cleanText(payload.notes)
  };
}

function buildVoucherCampaignValues(payload) {
  return {
    code: cleanText(payload.code) || slugify(payload.title || payload.name || "voucher"),
    name: cleanText(payload.name || payload.title),
    title: cleanText(payload.title || payload.name),
    description: cleanText(payload.description),
    discount_type: cleanText(payload.discountType, "percent") || "percent",
    discount_value: parseMoney(payload.discountValue, 0),
    min_order_value: parseMoney(payload.minOrderValue, 0),
    valid_days: parseInteger(payload.validDays, 14),
    usage_limit_total: parseInteger(payload.usageLimitTotal, 0),
    usage_limit_per_phone: parseInteger(payload.usageLimitPerPhone, 1),
    auto_issue: payload.autoIssue !== false,
    is_active: payload.isActive !== false,
    starts_at: toIsoDateTime(payload.startsAt),
    ends_at: toIsoDateTime(payload.endsAt),
    branch_id: cleanText(payload.branchId) || null,
    sort_order: parseInteger(payload.sortOrder, 0)
  };
}

function buildCustomerProfileValues(payload) {
  return {
    phone: normalizeVietnamPhone(payload.phone),
    full_name: cleanText(payload.fullName),
    email: cleanText(payload.email),
    tier: cleanText(payload.tier, "member") || "member",
    loyalty_points: parseInteger(payload.loyaltyPoints, 0),
    total_spent: parseMoney(payload.totalSpent, 0),
    visit_count: parseInteger(payload.visitCount, 0),
    last_seen_at: toIsoDateTime(payload.lastSeenAt) || new Date().toISOString(),
    branch_id: cleanText(payload.branchId) || null,
    notes: cleanText(payload.notes)
  };
}

function buildVoucherRedemptionValues(payload) {
  return {
    voucher_lead_id: cleanText(payload.voucherLeadId) || null,
    campaign_id: cleanText(payload.campaignId) || null,
    customer_profile_id: cleanText(payload.customerProfileId) || null,
    order_id: cleanText(payload.orderId) || null,
    branch_id: cleanText(payload.branchId) || null,
    status: cleanText(payload.status, "redeemed") || "redeemed",
    amount_saved: parseMoney(payload.amountSaved, 0),
    spend_amount: parseMoney(payload.spendAmount, 0),
    loyalty_points_awarded: parseInteger(payload.loyaltyPointsAwarded, 0),
    redeemed_by: cleanText(payload.redeemedBy),
    notes: cleanText(payload.notes)
  };
}

function buildDriverValues(payload) {
  return {
    branch_id: cleanText(payload.branchId) || null,
    code: cleanText(payload.code) || `DRV-${Date.now()}`,
    full_name: cleanText(payload.fullName),
    phone: normalizeVietnamPhone(payload.phone),
    vehicle_type: cleanText(payload.vehicleType),
    status: cleanText(payload.status, "active") || "active",
    referral_code: cleanText(payload.referralCode) || cleanText(payload.code) || `DRV${Date.now()}`,
    commission_rate: parseMoney(payload.commissionRate, 0),
    notes: cleanText(payload.notes)
  };
}

function buildDriverReferralValues(payload) {
  return {
    branch_id: cleanText(payload.branchId) || null,
    driver_id: cleanText(payload.driverId) || null,
    reservation_id: cleanText(payload.reservationId) || null,
    order_id: cleanText(payload.orderId) || null,
    referred_name: cleanText(payload.referredName),
    referred_phone: normalizeVietnamPhone(payload.referredPhone),
    referral_code: cleanText(payload.referralCode),
    status: cleanText(payload.status, "new") || "new",
    commission_base_amount: parseMoney(payload.commissionBaseAmount, 0),
    commission_amount: parseMoney(payload.commissionAmount, 0),
    notes: cleanText(payload.notes)
  };
}

function buildDriverCommissionValues(payload) {
  return {
    branch_id: cleanText(payload.branchId) || null,
    driver_id: cleanText(payload.driverId) || null,
    referral_id: cleanText(payload.referralId) || null,
    reservation_id: cleanText(payload.reservationId) || null,
    order_id: cleanText(payload.orderId) || null,
    status: cleanText(payload.status, "pending") || "pending",
    commission_amount: parseMoney(payload.commissionAmount, 0),
    payout_method: cleanText(payload.payoutMethod),
    paid_at: toIsoDateTime(payload.paidAt),
    notes: cleanText(payload.notes)
  };
}

function toLegacyDriverReferralStatus(status) {
  switch (cleanText(status, "new") || "new") {
    case "qualified":
    case "converted":
    case "paid":
      return "approved";
    case "cancelled":
      return "cancelled";
    case "approved":
      return "approved";
    case "pending":
      return "pending";
    case "new":
    default:
      return "pending";
  }
}

function toLegacyDriverCommissionStatus(status) {
  switch (cleanText(status, "pending") || "pending") {
    case "approved":
      return "paid";
    case "cancelled":
      return "cancelled";
    case "paid":
      return "paid";
    case "pending":
    default:
      return "pending";
  }
}

function buildTravelPartnerValues(payload) {
  return {
    branch_id: cleanText(payload.branchId) || null,
    code: cleanText(payload.code) || `PARTNER-${Date.now()}`,
    name: cleanText(payload.name),
    partner_type: cleanText(payload.partnerType, "agency") || "agency",
    contact_name: cleanText(payload.contactName),
    phone: normalizeVietnamPhone(payload.phone),
    email: cleanText(payload.email),
    commission_type: cleanText(payload.commissionType, "percent") || "percent",
    commission_value: parseMoney(payload.commissionValue, 0),
    status: cleanText(payload.status, "active") || "active",
    notes: cleanText(payload.notes),
    contract_start_at: toIsoDateTime(payload.contractStartAt),
    contract_end_at: toIsoDateTime(payload.contractEndAt)
  };
}

function buildPartnerContractValues(payload) {
  return {
    partner_id: cleanText(payload.partnerId) || null,
    branch_id: cleanText(payload.branchId) || null,
    title: cleanText(payload.title),
    discount_percent: parseMoney(payload.discountPercent, 0),
    commission_percent: parseMoney(payload.commissionPercent, 0),
    payment_terms: cleanText(payload.paymentTerms),
    status: cleanText(payload.status, "draft") || "draft",
    starts_at: toIsoDateTime(payload.startsAt),
    ends_at: toIsoDateTime(payload.endsAt),
    notes: cleanText(payload.notes)
  };
}

function buildPartnerBookingValues(payload) {
  return {
    partner_id: cleanText(payload.partnerId) || null,
    reservation_id: cleanText(payload.reservationId) || null,
    branch_id: cleanText(payload.branchId) || null,
    code: cleanText(payload.code) || `PBK-${Date.now()}`,
    customer_name: cleanText(payload.customerName),
    customer_phone: normalizeVietnamPhone(payload.customerPhone),
    group_size: parseInteger(payload.groupSize, 2),
    booking_at: toIsoDateTime(payload.bookingAt),
    package_name: cleanText(payload.packageName),
    menu_budget: parseMoney(payload.menuBudget, 0),
    discount_amount: parseMoney(payload.discountAmount, 0),
    commission_amount: parseMoney(payload.commissionAmount, 0),
    status: cleanText(payload.status, "lead") || "lead",
    guest_manifest_url: cleanText(payload.guestManifestUrl),
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
    availability_status: cleanText(payload.availabilityStatus, "available") || "available",
    season_note: cleanText(payload.seasonNote),
    branch_id: cleanText(payload.branchId) || null,
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
    branch_id: cleanText(payload.branchId) || null,
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
      driver_id: cleanText(payload.driverId) || null,
      referral_code: cleanText(payload.referralCode),
      branch_id: cleanText(payload.branchId) || null,
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
    branch_id: cleanText(payload.branchId) || null,
    notes: cleanText(payload.notes),
    mapping: payload.mapping || undefined
  };
}

function normalizeBranchRow(row) {
  return {
    id: row.id,
    code: row.code || "main",
    name: row.name || "San Hô Đỏ Hồ Tràm",
    shortName: row.short_name || row.name || "Hồ Tràm",
    address: row.address || "",
    phone: row.phone || "",
    isActive: row.is_active !== false,
    sortOrder: row.sort_order || 0,
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || ""
  };
}

function normalizeProfileRow(row) {
  return {
    id: row.id,
    email: row.email || "",
    fullName: row.full_name || "",
    role: row.role || "staff",
    branchId: row.branch_id || "",
    isActive: row.is_active !== false,
    lastLoginAt: row.last_login_at || "",
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || ""
  };
}

function normalizeBranchStaffAssignmentRow(row) {
  return {
    id: row.id,
    branchId: row.branch_id || "",
    profileId: row.profile_id || "",
    role: row.role || "staff",
    isPrimary: row.is_primary === true,
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || ""
  };
}

function buildBranchValues(payload) {
  const code =
    cleanText(payload.code) ||
    slugify(payload.shortName || payload.name || "chi-nhanh") ||
    `branch-${Date.now()}`;

  return {
    code,
    name: cleanText(payload.name),
    short_name: cleanText(payload.shortName || payload.name),
    address: cleanText(payload.address),
    phone: normalizeVietnamPhone(payload.phone),
    is_active: payload.isActive !== false,
    sort_order: parseInteger(payload.sortOrder, 0)
  };
}

function validateBranchPayload(payload) {
  const name = cleanText(payload.name);
  if (!name) {
    throw new Error("Tên chi nhánh không được để trống");
  }

  const phone = cleanText(payload.phone);
  if (phone && !isValidVietnamPhone(phone)) {
    throw new Error("Số điện thoại chi nhánh chưa đúng định dạng Việt Nam");
  }
}

async function countBranchDependencies(supabase, branchId) {
  const tables = [
    { table: "restaurant_tables", label: "bàn" },
    { table: "menu_items", label: "món ăn" },
    { table: "reservations", label: "đặt bàn" },
    { table: "orders", label: "đơn hàng" },
    { table: "voucher_leads", label: "voucher" },
    { table: "travel_partners", label: "đối tác" },
    { table: "drivers", label: "tài xế" },
    { table: "integration_settings", label: "tích hợp" },
    { table: "branch_staff_assignments", label: "nhân sự chi nhánh" }
  ];

  const results = await Promise.all(
    tables.map(async ({ table, label }) => {
      const { count, error } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true })
        .eq("branch_id", branchId);

      if (error) {
        if (isMissingColumnError(error, "branch_id") || isSupabaseSchemaMissingError(error)) {
          return { label, count: 0 };
        }
        throw new Error(toFriendlySupabaseErrorMessage(error, `Không kiểm tra được dữ liệu ${label}`));
      }

      return { label, count: Number(count || 0) };
    })
  );

  return results.filter((item) => item.count > 0);
}

export async function listBranches(supabase, options = {}) {
  const { activeOnly = true } = options;
  const { data, error } = await supabase
    .from("branches")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    if (isSupabaseSchemaMissingError(error)) {
      return normalizeBranches(DEFAULT_BRANCHES).filter((branch) => (activeOnly ? branch.isActive : true));
    }

    throw new Error(toFriendlySupabaseErrorMessage(error, "Không tải được danh sách chi nhánh"));
  }

  return (data || [])
    .map(normalizeBranchRow)
    .filter((branch) => (activeOnly ? branch.isActive : true));
}

export async function createBranch(supabase, payload) {
  validateBranchPayload(payload);
  const values = buildBranchValues(payload);
  const { data, error } = await supabase.from("branches").insert(values).select("*").single();

  if (error?.code === "23505") {
    throw new Error("Mã chi nhánh đã tồn tại. Hãy dùng một mã khác.");
  }
  throwIfError(error, "Không tạo được chi nhánh");
  return normalizeBranchRow(data);
}

export async function updateBranch(supabase, id, payload) {
  validateBranchPayload(payload);
  const values = buildBranchValues(payload);
  const { data, error } = await supabase
    .from("branches")
    .update(values)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error?.code === "23505") {
    throw new Error("Mã chi nhánh đã tồn tại. Hãy dùng một mã khác.");
  }
  throwIfError(error, "Không cập nhật được chi nhánh");
  return data ? normalizeBranchRow(data) : null;
}

export async function deleteBranch(supabase, id) {
  if (id === MAIN_BRANCH_ID) {
    throw new Error("Không thể xóa chi nhánh mặc định của hệ thống");
  }

  const { data: branch, error: branchError } = await supabase
    .from("branches")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  throwIfError(branchError, "Không tải được chi nhánh");

  if (!branch) {
    return false;
  }

  if (branch.code === "main") {
    throw new Error("Không thể xóa chi nhánh mặc định của hệ thống");
  }

  const dependencies = await countBranchDependencies(supabase, id);
  if (dependencies.length) {
    const summary = dependencies.map((item) => `${item.count} ${item.label}`).join(", ");
    throw new Error(`Không thể xóa chi nhánh vì vẫn còn dữ liệu liên quan: ${summary}.`);
  }

  const { error } = await supabase.from("branches").delete().eq("id", id);
  throwIfError(error, "Không xóa được chi nhánh");
  return true;
}

export async function listProfiles(supabase) {
  const selectAttempts = [
    "id, email, full_name, role, branch_id, is_active, last_login_at, created_at, updated_at",
    "id, email, full_name, role, branch_id, last_login_at, created_at, updated_at",
    "id, email, full_name, role, is_active, last_login_at, created_at, updated_at",
    "id, email, full_name, role, branch_id, created_at, updated_at",
    "id, email, full_name, role, last_login_at, created_at, updated_at",
    "id, email, full_name, role, created_at, updated_at"
  ];

  let result = null;

  for (const selectClause of selectAttempts) {
    result = await supabase
      .from("profiles")
      .select(selectClause)
      .order("full_name", { ascending: true })
      .order("email", { ascending: true });

    if (!result.error) {
      break;
    }

    if (!isSupabaseSchemaMissingError(result.error)) {
      break;
    }
  }

  if (result?.error) {
    throw new Error(toFriendlySupabaseErrorMessage(result.error, "Không tải được danh sách nhân sự"));
  }

  return (result?.data || []).map(normalizeProfileRow);
}

export async function listBranchStaffAssignments(supabase, options = {}) {
  const branchId = cleanText(options.branchId);
  const { data, error } = await runWithOptionalBranchFilter(branchId, (useBranch) => {
    let query = supabase
      .from("branch_staff_assignments")
      .select("*")
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: false });

    if (useBranch) {
      query = query.eq("branch_id", branchId);
    }

    return query;
  });

  if (error) {
    if (isSupabaseSchemaMissingError(error)) {
      return [];
    }

    throw new Error(toFriendlySupabaseErrorMessage(error, "Không tải được phân công chi nhánh"));
  }

  return (data || []).map(normalizeBranchStaffAssignmentRow);
}

async function syncPrimaryProfileBranch(supabase, profileId, fallbackRole = "") {
  const { data: primaryAssignment, error: assignmentError } = await supabase
    .from("branch_staff_assignments")
    .select("*")
    .eq("profile_id", profileId)
    .eq("is_primary", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (assignmentError) {
    if (isSupabaseSchemaMissingError(assignmentError)) {
      return null;
    }

    throw new Error(toFriendlySupabaseErrorMessage(assignmentError, "Không đồng bộ được nhân sự chi nhánh"));
  }

  const nextValues = primaryAssignment
    ? {
        branch_id: primaryAssignment.branch_id || null,
        role: primaryAssignment.role || fallbackRole || "staff"
      }
    : {
        branch_id: null
      };

  const { data: profileData, error: profileError } = await updateWithOptionalColumns(
    supabase,
    "profiles",
    profileId,
    nextValues,
    { optionalColumns: ["branch_id"] }
  );

  throwIfError(profileError, "Không cập nhật được hồ sơ nhân sự");
  return profileData ? normalizeProfileRow(profileData) : null;
}

const BRANCH_STAFF_ROLES = ["super_admin", "admin", "manager", "branch_manager", "staff", "driver"];

function validateBranchStaffPayload(payload) {
  if (!cleanText(payload.branchId)) {
    throw new Error("Thiếu chi nhánh cần gán");
  }

  if (!cleanText(payload.profileId)) {
    throw new Error("Hãy chọn nhân sự");
  }

  const role = cleanText(payload.role, "staff") || "staff";
  if (!BRANCH_STAFF_ROLES.includes(role)) {
    throw new Error("Vai trò nhân sự chưa hợp lệ");
  }
}

export async function upsertBranchStaffAssignment(supabase, payload) {
  validateBranchStaffPayload(payload);

  const values = {
    branch_id: cleanText(payload.branchId),
    profile_id: cleanText(payload.profileId),
    role: cleanText(payload.role, "staff") || "staff",
    is_primary: Boolean(payload.isPrimary)
  };

  const { data, error } = await supabase
    .from("branch_staff_assignments")
    .upsert(values, { onConflict: "branch_id,profile_id" })
    .select("*")
    .single();

  throwIfError(error, "Không lưu được phân công chi nhánh");

  if (values.is_primary) {
    const { error: resetError } = await supabase
      .from("branch_staff_assignments")
      .update({ is_primary: false })
      .eq("profile_id", values.profile_id)
      .neq("id", data.id);

    throwIfError(resetError, "Không cập nhật được người phụ trách chính");
  }

  const profile = values.is_primary
    ? await syncPrimaryProfileBranch(supabase, values.profile_id, values.role)
    : null;

  return {
    assignment: normalizeBranchStaffAssignmentRow(data),
    profile
  };
}

export async function deleteBranchStaffAssignment(supabase, id) {
  const { data: assignment, error: assignmentError } = await supabase
    .from("branch_staff_assignments")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  throwIfError(assignmentError, "Không tải được phân công chi nhánh");

  if (!assignment) {
    return { deleted: false, profile: null };
  }

  const { error } = await supabase.from("branch_staff_assignments").delete().eq("id", id);
  throwIfError(error, "Không gỡ được nhân sự khỏi chi nhánh");

  const profile = assignment.is_primary
    ? await syncPrimaryProfileBranch(supabase, assignment.profile_id, assignment.role)
    : null;

  return {
    deleted: true,
    profile,
    assignmentId: id
  };
}

function validateProfilePayload(payload) {
  const role = cleanText(payload.role, "staff") || "staff";
  if (!BRANCH_STAFF_ROLES.includes(role)) {
    throw new Error("Vai trò tài khoản chưa hợp lệ");
  }
}

export async function updateProfile(supabase, id, payload) {
  validateProfilePayload(payload);

  const branchId = cleanText(payload.branchId);
  const values = {
    full_name: cleanText(payload.fullName),
    role: cleanText(payload.role, "staff") || "staff",
    branch_id: branchId || null,
    is_active: payload.isActive !== false
  };

  const { data, error } = await updateWithOptionalColumns(supabase, "profiles", id, values, {
    optionalColumns: ["branch_id", "is_active"]
  });

  throwIfError(error, "Không cập nhật được tài khoản nhân sự");

  if (branchId) {
    await upsertBranchStaffAssignment(supabase, {
      branchId,
      profileId: id,
      role: values.role,
      isPrimary: true
    });
  } else {
    const { error: resetError } = await supabase
      .from("branch_staff_assignments")
      .update({ is_primary: false })
      .eq("profile_id", id);

    if (resetError && !isSupabaseSchemaMissingError(resetError)) {
      throw new Error(toFriendlySupabaseErrorMessage(resetError, "Không đồng bộ được phân công chi nhánh"));
    }
  }

  return data ? normalizeProfileRow(data) : null;
}

export async function listDrivers(supabase, options = {}) {
  const branchId = cleanText(options.branchId);
  const { data, error } = await runWithOptionalBranchFilter(branchId, (useBranch) => {
    let query = supabase
      .from("drivers")
      .select("*")
      .order("full_name", { ascending: true })
      .order("created_at", { ascending: false });

    if (useBranch) {
      query = query.eq("branch_id", branchId);
    }

    return query;
  });

  if (error) {
    if (isSupabaseSchemaMissingError(error)) {
      return [];
    }

    throw new Error(toFriendlySupabaseErrorMessage(error, "Không tải được tài xế"));
  }

  return (data || []).map(normalizeDriverRow);
}

export async function createDriver(supabase, payload) {
  const values = buildDriverValues(payload);
  const { data, error } = await insertWithOptionalColumns(supabase, "drivers", values, {
    select: true,
    single: true,
    optionalColumns: ["branch_id"]
  });

  throwIfError(error, "Không tạo được tài xế");
  return normalizeDriverRow(data);
}

export async function updateDriver(supabase, id, payload) {
  const values = buildDriverValues(payload);
  const { data, error } = await updateWithOptionalColumns(supabase, "drivers", id, values, {
    optionalColumns: ["branch_id"]
  });

  throwIfError(error, "Không cập nhật được tài xế");
  return data ? normalizeDriverRow(data) : null;
}

export async function deleteDriver(supabase, id) {
  const { error } = await supabase.from("drivers").delete().eq("id", id);
  throwIfError(error, "Không xóa được tài xế");
  return true;
}

export async function listDriverReferrals(supabase, options = {}) {
  const branchId = cleanText(options.branchId);
  const { data, error } = await runWithOptionalBranchFilter(branchId, (useBranch) => {
    let query = supabase
      .from("driver_referrals")
      .select("*")
      .order("created_at", { ascending: false });

    if (useBranch) {
      query = query.eq("branch_id", branchId);
    }

    return query.limit(options.limit || 100);
  });

  if (error) {
    if (isSupabaseSchemaMissingError(error)) {
      return [];
    }

    throw new Error(toFriendlySupabaseErrorMessage(error, "Không tải được referral tài xế"));
  }

  return (data || []).map(normalizeDriverReferralRow);
}

export async function listDriverCommissionTransactions(supabase, options = {}) {
  const branchId = cleanText(options.branchId);
  const { data, error } = await runWithOptionalBranchFilter(branchId, (useBranch) => {
    let query = supabase
      .from("driver_commission_transactions")
      .select("*")
      .order("created_at", { ascending: false });

    if (useBranch) {
      query = query.eq("branch_id", branchId);
    }

    return query.limit(options.limit || 100);
  });

  if (error) {
    if (isSupabaseSchemaMissingError(error)) {
      return [];
    }

    throw new Error(toFriendlySupabaseErrorMessage(error, "Không tải được hoa hồng tài xế"));
  }

  return (data || []).map(normalizeDriverCommissionRow);
}

export async function listTravelPartners(supabase, options = {}) {
  const branchId = cleanText(options.branchId);
  const { data, error } = await runWithOptionalBranchFilter(branchId, (useBranch) => {
    let query = supabase
      .from("travel_partners")
      .select("*")
      .order("name", { ascending: true })
      .order("created_at", { ascending: false });

    if (useBranch) {
      query = query.eq("branch_id", branchId);
    }

    return query;
  });

  if (error) {
    if (isSupabaseSchemaMissingError(error)) {
      return [];
    }

    throw new Error(toFriendlySupabaseErrorMessage(error, "Không tải được đối tác"));
  }

  return (data || []).map(normalizeTravelPartnerRow);
}

export async function createTravelPartner(supabase, payload) {
  const values = buildTravelPartnerValues(payload);
  const { data, error } = await insertWithOptionalColumns(supabase, "travel_partners", values, {
    select: true,
    single: true,
    optionalColumns: ["branch_id"]
  });

  throwIfError(error, "Không tạo được đối tác");
  return normalizeTravelPartnerRow(data);
}

export async function updateTravelPartner(supabase, id, payload) {
  const values = buildTravelPartnerValues(payload);
  const { data, error } = await updateWithOptionalColumns(supabase, "travel_partners", id, values, {
    optionalColumns: ["branch_id"]
  });

  throwIfError(error, "Không cập nhật được đối tác");
  return data ? normalizeTravelPartnerRow(data) : null;
}

export async function deleteTravelPartner(supabase, id) {
  const { error } = await supabase.from("travel_partners").delete().eq("id", id);
  throwIfError(error, "Không xóa được đối tác");
  return true;
}

export async function listPartnerContracts(supabase, options = {}) {
  const branchId = cleanText(options.branchId);
  const { data, error } = await runWithOptionalBranchFilter(branchId, (useBranch) => {
    let query = supabase
      .from("partner_contracts")
      .select("*")
      .order("starts_at", { ascending: false })
      .order("created_at", { ascending: false });

    if (useBranch) {
      query = query.eq("branch_id", branchId);
    }

    return query.limit(options.limit || 100);
  });

  if (error) {
    if (isSupabaseSchemaMissingError(error)) {
      return [];
    }

    throw new Error(toFriendlySupabaseErrorMessage(error, "Không tải được hợp đồng đối tác"));
  }

  return (data || []).map(normalizePartnerContractRow);
}

export async function createPartnerContract(supabase, payload) {
  const values = buildPartnerContractValues(payload);
  const { data, error } = await insertWithOptionalColumns(supabase, "partner_contracts", values, {
    select: true,
    single: true,
    optionalColumns: ["branch_id"]
  });

  throwIfError(error, "Không tạo được hợp đồng");
  return normalizePartnerContractRow(data);
}

export async function updatePartnerContract(supabase, id, payload) {
  const values = buildPartnerContractValues(payload);
  const { data, error } = await updateWithOptionalColumns(supabase, "partner_contracts", id, values, {
    optionalColumns: ["branch_id"]
  });

  throwIfError(error, "Không cập nhật được hợp đồng");
  return data ? normalizePartnerContractRow(data) : null;
}

export async function deletePartnerContract(supabase, id) {
  const { error } = await supabase.from("partner_contracts").delete().eq("id", id);
  throwIfError(error, "Không xóa được hợp đồng");
  return true;
}

export async function listPartnerBookings(supabase, options = {}) {
  const branchId = cleanText(options.branchId);
  const { data, error } = await runWithOptionalBranchFilter(branchId, (useBranch) => {
    let query = supabase
      .from("partner_bookings")
      .select("*")
      .order("booking_at", { ascending: false })
      .order("created_at", { ascending: false });

    if (useBranch) {
      query = query.eq("branch_id", branchId);
    }

    return query.limit(options.limit || 200);
  });

  if (error) {
    if (isSupabaseSchemaMissingError(error)) {
      return [];
    }

    throw new Error(toFriendlySupabaseErrorMessage(error, "Không tải được booking đối tác"));
  }

  return (data || []).map(normalizePartnerBookingRow);
}

export async function createPartnerBooking(supabase, payload) {
  const values = buildPartnerBookingValues(payload);
  const { data, error } = await insertWithOptionalColumns(supabase, "partner_bookings", values, {
    select: true,
    single: true,
    optionalColumns: ["branch_id", "reservation_id"]
  });

  throwIfError(error, "Không tạo được booking đối tác");
  return normalizePartnerBookingRow(data);
}

export async function updatePartnerBooking(supabase, id, payload) {
  const values = buildPartnerBookingValues(payload);
  const { data, error } = await updateWithOptionalColumns(supabase, "partner_bookings", id, values, {
    optionalColumns: ["branch_id", "reservation_id"]
  });

  throwIfError(error, "Không cập nhật được booking đối tác");
  return data ? normalizePartnerBookingRow(data) : null;
}

export async function deletePartnerBooking(supabase, id) {
  const { error } = await supabase.from("partner_bookings").delete().eq("id", id);
  throwIfError(error, "Không xóa được booking đối tác");
  return true;
}

async function findDriverByReferralCode(supabase, referralCode, branchId = "") {
  const code = cleanText(referralCode);
  if (!code) return null;

  const { data, error } = await runWithOptionalBranchFilter(cleanText(branchId), (useBranch) => {
    let query = supabase
      .from("drivers")
      .select("*")
      .eq("referral_code", code)
      .maybeSingle();

    if (useBranch) {
      query = query.eq("branch_id", cleanText(branchId));
    }

    return query;
  });

  if (error) {
    if (isSupabaseSchemaMissingError(error)) {
      return null;
    }
    throw new Error(toFriendlySupabaseErrorMessage(error, "Không tra được mã giới thiệu tài xế"));
  }

  return data ? normalizeDriverRow(data) : null;
}

async function upsertDriverReferral(supabase, payload) {
  const values = buildDriverReferralValues(payload);
  const lookupColumn = values.order_id ? "order_id" : values.reservation_id ? "reservation_id" : null;

  if (!lookupColumn) {
    return null;
  }

  const { data: existing, error: lookupError } = await supabase
    .from("driver_referrals")
    .select("*")
    .eq(lookupColumn, values[lookupColumn])
    .maybeSingle();

  if (lookupError) {
    if (isSupabaseSchemaMissingError(lookupError)) {
      return null;
    }

    throw new Error(toFriendlySupabaseErrorMessage(lookupError, "Không tải được referral tài xế"));
  }

  if (existing) {
    let { data, error } = await updateWithOptionalColumns(
      supabase,
      "driver_referrals",
      existing.id,
      values,
      { optionalColumns: ["branch_id"] }
    );

    if (error && isConstraintError(error, "driver_referrals_status_check")) {
      ({ data, error } = await updateWithOptionalColumns(
        supabase,
        "driver_referrals",
        existing.id,
        {
          ...values,
          status: toLegacyDriverReferralStatus(values.status)
        },
        { optionalColumns: ["branch_id"] }
      ));
    }

    throwIfError(error, "Không cập nhật được referral tài xế");
    return data ? normalizeDriverReferralRow(data) : normalizeDriverReferralRow(existing);
  }

  let { data, error } = await insertWithOptionalColumns(
    supabase,
    "driver_referrals",
    { id: globalThis.crypto.randomUUID(), ...values },
    {
      select: true,
      single: true,
      optionalColumns: ["branch_id"]
    }
  );

  if (error && isConstraintError(error, "driver_referrals_status_check")) {
    ({ data, error } = await insertWithOptionalColumns(
      supabase,
      "driver_referrals",
      {
        id: globalThis.crypto.randomUUID(),
        ...values,
        status: toLegacyDriverReferralStatus(values.status)
      },
      {
        select: true,
        single: true,
        optionalColumns: ["branch_id"]
      }
    ));
  }

  throwIfError(error, "Không tạo được referral tài xế");
  return normalizeDriverReferralRow(data);
}

async function upsertDriverCommission(supabase, payload) {
  const values = buildDriverCommissionValues(payload);
  const lookupColumn = values.order_id ? "order_id" : values.reservation_id ? "reservation_id" : null;
  if (!lookupColumn) {
    return null;
  }

  const { data: existing, error: lookupError } = await supabase
    .from("driver_commission_transactions")
    .select("*")
    .eq(lookupColumn, values[lookupColumn])
    .maybeSingle();

  if (lookupError) {
    if (isSupabaseSchemaMissingError(lookupError)) {
      return null;
    }

    throw new Error(toFriendlySupabaseErrorMessage(lookupError, "Không tải được hoa hồng tài xế"));
  }

  if (existing) {
    let { data, error } = await updateWithOptionalColumns(
      supabase,
      "driver_commission_transactions",
      existing.id,
      values,
      { optionalColumns: ["branch_id"] }
    );

    if (error && isConstraintError(error, "driver_commission_transactions_status_check")) {
      ({ data, error } = await updateWithOptionalColumns(
        supabase,
        "driver_commission_transactions",
        existing.id,
        {
          ...values,
          status: toLegacyDriverCommissionStatus(values.status)
        },
        { optionalColumns: ["branch_id"] }
      ));
    }
    throwIfError(error, "Không cập nhật được hoa hồng tài xế");
    return data ? normalizeDriverCommissionRow(data) : normalizeDriverCommissionRow(existing);
  }

  let { data, error } = await insertWithOptionalColumns(
    supabase,
    "driver_commission_transactions",
    { id: globalThis.crypto.randomUUID(), ...values },
    {
      select: true,
      single: true,
      optionalColumns: ["branch_id"]
    }
  );

  if (error && isConstraintError(error, "driver_commission_transactions_status_check")) {
    ({ data, error } = await insertWithOptionalColumns(
      supabase,
      "driver_commission_transactions",
      {
        id: globalThis.crypto.randomUUID(),
        ...values,
        status: toLegacyDriverCommissionStatus(values.status)
      },
      {
        select: true,
        single: true,
        optionalColumns: ["branch_id"]
      }
    ));
  }
  throwIfError(error, "Không tạo được hoa hồng tài xế");
  return normalizeDriverCommissionRow(data);
}

async function syncDriverAttributionForReservation(supabase, reservation) {
  if (!reservation?.driverId && !reservation?.referralCode) {
    return null;
  }

  const driver =
    (reservation.driverId ? (await listDrivers(supabase, { branchId: reservation.branchId })).find((item) => item.id === reservation.driverId) : null) ||
    (await findDriverByReferralCode(supabase, reservation.referralCode, reservation.branchId));

  if (!driver) {
    return null;
  }

  return upsertDriverReferral(supabase, {
    branchId: reservation.branchId,
    driverId: driver.id,
    reservationId: reservation.id,
    referredName: reservation.name,
    referredPhone: reservation.phone,
    referralCode: driver.referralCode || reservation.referralCode,
    status: ["confirmed", "arrived"].includes(reservation.status) ? "qualified" : "new",
    commissionBaseAmount: 0,
    commissionAmount: 0,
    notes: reservation.notes || ""
  });
}

async function syncDriverAttributionForOrder(supabase, order) {
  if (!order?.driverId && !order?.referralCode) {
    return null;
  }

  const driver =
    (order.driverId ? (await listDrivers(supabase, { branchId: order.branchId })).find((item) => item.id === order.driverId) : null) ||
    (await findDriverByReferralCode(supabase, order.referralCode, order.branchId));

  if (!driver) {
    return null;
  }

  const commissionAmount = Math.round((Number(order.totalAmount || 0) * Number(driver.commissionRate || 0)) / 100);
  const referral = await upsertDriverReferral(supabase, {
    branchId: order.branchId,
    driverId: driver.id,
    orderId: order.id,
    referredName: order.customerName,
    referredPhone: order.customerPhone,
    referralCode: driver.referralCode || order.referralCode,
    status: ["confirmed", "preparing", "served", "paid"].includes(order.status) ? "converted" : "new",
    commissionBaseAmount: order.totalAmount,
    commissionAmount,
    notes: order.notes || ""
  });

  await upsertDriverCommission(supabase, {
    branchId: order.branchId,
    driverId: driver.id,
    referralId: referral?.id || null,
    orderId: order.id,
    status: order.status === "paid" ? "approved" : "pending",
    commissionAmount,
    notes: `Auto-generated from order ${order.id}`
  });

  return referral;
}

export async function listReservations(supabase, options = {}) {
  const branchId = cleanText(options.branchId);
  const { data, error } = await runWithOptionalBranchFilter(branchId, (useBranch) => {
    let query = supabase.from("reservations").select("*").order("created_at", { ascending: false });
    if (useBranch) {
      query = query.eq("branch_id", branchId);
    }
    return query;
  });

  throwIfError(error, "Không tải được đặt bàn");
  return (data || []).map(normalizeReservationRow);
}

export async function createReservation(supabase, payload) {
  const values = buildReservationValues(payload);
  const { data, error } = await insertWithOptionalColumns(supabase, "reservations", values, {
    select: true,
    single: true,
    optionalColumns: ["driver_id", "referral_code", "branch_id"]
  });

  throwIfError(error, "Không tạo được đặt bàn");
  const normalized = normalizeReservationRow(data);
  await syncDriverAttributionForReservation(supabase, normalized);
  return normalized;
}

export async function createPublicReservation(supabase, payload) {
  const values = buildReservationValues(payload);
  const id = globalThis.crypto.randomUUID();
  const { error } = await insertWithOptionalColumns(supabase, "reservations", { id, ...values }, {
    optionalColumns: ["driver_id", "referral_code", "branch_id"]
  });

  throwIfError(error, "Không tạo được đặt bàn");

  const now = new Date().toISOString();
  const normalized = normalizeReservationRow({
    id,
    ...values,
    created_at: now,
    updated_at: now
  });
  await syncDriverAttributionForReservation(supabase, normalized);
  return normalized;
}

export async function updateReservation(supabase, id, payload) {
  const values = buildReservationValues(payload);
  const { data, error } = await updateWithOptionalColumns(supabase, "reservations", id, values, {
    optionalColumns: ["driver_id", "referral_code", "branch_id"]
  });

  throwIfError(error, "Không cập nhật được đặt bàn");
  const normalized = data ? normalizeReservationRow(data) : null;
  if (normalized) {
    await syncDriverAttributionForReservation(supabase, normalized);
  }
  return normalized;
}

export async function deleteReservation(supabase, id) {
  const { error } = await supabase.from("reservations").delete().eq("id", id);
  throwIfError(error, "Không xóa được đặt bàn");
  return true;
}

export async function listVoucherLeads(supabase, options = {}) {
  const branchId = cleanText(options.branchId);
  const { data, error } = await runWithOptionalBranchFilter(branchId, (useBranch) => {
    let query = supabase.from("voucher_leads").select("*").order("created_at", { ascending: false });
    if (useBranch) {
      query = query.eq("branch_id", branchId);
    }
    return query;
  });

  throwIfError(error, "Không tải được voucher");
  return (data || []).map(normalizeVoucherRow);
}

export async function createVoucherLead(supabase, payload) {
  const values = buildVoucherValues(payload);
  const { data, error } = await insertWithOptionalColumns(supabase, "voucher_leads", values, {
    select: true,
    single: true,
    optionalColumns: ["campaign_id", "customer_profile_id", "branch_id"]
  });

  throwIfError(error, "Không tạo được voucher");
  return normalizeVoucherRow(data);
}

export async function createPublicVoucherLead(supabase, payload) {
  const values = buildVoucherValues(payload);
  const id = globalThis.crypto.randomUUID();
  const { error } = await insertWithOptionalColumns(supabase, "voucher_leads", { id, ...values }, {
    optionalColumns: ["campaign_id", "customer_profile_id", "branch_id"]
  });

  throwIfError(error, "Không tạo được voucher");

  const now = new Date().toISOString();
  return normalizeVoucherRow({
    id,
    ...values,
    created_at: now,
    updated_at: now
  });
}

export async function updateVoucherLead(supabase, id, payload) {
  const values = buildVoucherValues(payload);
  const { data, error } = await updateWithOptionalColumns(supabase, "voucher_leads", id, values, {
    optionalColumns: ["campaign_id", "customer_profile_id", "branch_id"]
  });

  throwIfError(error, "Không cập nhật được voucher");
  return data ? normalizeVoucherRow(data) : null;
}

export async function deleteVoucherLead(supabase, id) {
  const { error } = await supabase.from("voucher_leads").delete().eq("id", id);
  throwIfError(error, "Không xóa được voucher");
  return true;
}

export async function listVoucherCampaigns(supabase, options = {}) {
  const branchId = cleanText(options.branchId);
  const activeOnly = options.activeOnly === true;
  const autoIssueOnly = options.autoIssueOnly === true;
  const { data, error } = await runWithOptionalBranchFilter(branchId, (useBranch) => {
    let query = supabase
      .from("voucher_campaigns")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (activeOnly) {
      query = query.eq("is_active", true);
    }

    if (autoIssueOnly) {
      query = query.eq("auto_issue", true);
    }

    if (useBranch) {
      query = query.eq("branch_id", branchId);
    }

    return query;
  });

  if (error) {
    if (isSupabaseSchemaMissingError(error)) {
      return [buildFallbackVoucherCampaign(branchId)];
    }

    throw new Error(toFriendlySupabaseErrorMessage(error, "Không tải được campaign voucher"));
  }

  const now = Date.now();
  const items = (data || [])
    .map(normalizeVoucherCampaignRow)
    .filter((item) => {
      if (!activeOnly) {
        return true;
      }

      const startsAt = item.startsAt ? new Date(item.startsAt).getTime() : null;
      const endsAt = item.endsAt ? new Date(item.endsAt).getTime() : null;

      if (startsAt && !Number.isNaN(startsAt) && startsAt > now) {
        return false;
      }

      if (endsAt && !Number.isNaN(endsAt) && endsAt < now) {
        return false;
      }

      return true;
    });
  return items.length ? items : [buildFallbackVoucherCampaign(branchId)];
}

export async function createVoucherCampaign(supabase, payload) {
  const values = buildVoucherCampaignValues(payload);
  const { data, error } = await insertWithOptionalColumns(supabase, "voucher_campaigns", values, {
    select: true,
    single: true,
    optionalColumns: ["branch_id"]
  });

  throwIfError(error, "Không tạo được campaign voucher");
  return normalizeVoucherCampaignRow(data);
}

export async function updateVoucherCampaign(supabase, id, payload) {
  const values = buildVoucherCampaignValues(payload);
  const { data, error } = await updateWithOptionalColumns(supabase, "voucher_campaigns", id, values, {
    optionalColumns: ["branch_id"]
  });

  throwIfError(error, "Không cập nhật được campaign voucher");
  return data ? normalizeVoucherCampaignRow(data) : null;
}

export async function deleteVoucherCampaign(supabase, id) {
  const { error } = await supabase.from("voucher_campaigns").delete().eq("id", id);
  throwIfError(error, "Không xóa được campaign voucher");
  return true;
}

export async function listCustomerProfiles(supabase, options = {}) {
  const branchId = cleanText(options.branchId);
  const { data, error } = await runWithOptionalBranchFilter(branchId, (useBranch) => {
    let query = supabase
      .from("customer_profiles")
      .select("*")
      .order("loyalty_points", { ascending: false })
      .order("updated_at", { ascending: false });

    if (useBranch) {
      query = query.eq("branch_id", branchId);
    }

    return query.limit(options.limit || 100);
  });

  if (error) {
    if (isSupabaseSchemaMissingError(error)) {
      return [];
    }

    throw new Error(toFriendlySupabaseErrorMessage(error, "Không tải được khách loyalty"));
  }

  return (data || []).map(normalizeCustomerProfileRow);
}

export async function listVoucherRedemptions(supabase, options = {}) {
  const branchId = cleanText(options.branchId);
  const { data, error } = await runWithOptionalBranchFilter(branchId, (useBranch) => {
    let query = supabase
      .from("voucher_redemptions")
      .select("*")
      .order("created_at", { ascending: false });

    if (useBranch) {
      query = query.eq("branch_id", branchId);
    }

    return query.limit(options.limit || 100);
  });

  if (error) {
    if (isSupabaseSchemaMissingError(error)) {
      return [];
    }

    throw new Error(toFriendlySupabaseErrorMessage(error, "Không tải được voucher redemption"));
  }

  return (data || []).map(normalizeVoucherRedemptionRow);
}

export async function upsertCustomerProfileByPhone(supabase, payload) {
  const values = buildCustomerProfileValues(payload);
  const normalizedPhone = values.phone;
  const { data: existing, error: lookupError } = await supabase
    .from("customer_profiles")
    .select("*")
    .eq("phone", normalizedPhone)
    .maybeSingle();

  if (lookupError) {
    if (isSupabaseSchemaMissingError(lookupError)) {
      return {
        id: "",
        phone: normalizedPhone,
        fullName: values.full_name,
        tier: "member",
        loyaltyPoints: 0,
        totalSpent: 0,
        visitCount: 0,
        branchId: values.branch_id || "",
        notes: values.notes || "",
        lastSeenAt: values.last_seen_at
      };
    }

    throw new Error(toFriendlySupabaseErrorMessage(lookupError, "Không tải được hồ sơ khách hàng"));
  }

  if (!existing) {
    const { data, error } = await insertWithOptionalColumns(
      supabase,
      "customer_profiles",
      {
        ...values,
        id: globalThis.crypto.randomUUID()
      },
      {
        select: true,
        single: true,
        optionalColumns: ["branch_id"]
      }
    );

    throwIfError(error, "Không tạo được hồ sơ khách hàng");
    return normalizeCustomerProfileRow(data);
  }

  const merged = {
    fullName: payload.fullName || existing.full_name || "",
    email: payload.email || existing.email || "",
    tier: payload.tier || existing.tier || "member",
    loyaltyPoints: Number(payload.loyaltyPoints ?? existing.loyalty_points ?? 0),
    totalSpent: Number(payload.totalSpent ?? existing.total_spent ?? 0),
    visitCount: Number(payload.visitCount ?? existing.visit_count ?? 0),
    branchId: payload.branchId || existing.branch_id || "",
    notes: payload.notes || existing.notes || "",
    lastSeenAt: payload.lastSeenAt || new Date().toISOString(),
    phone: normalizedPhone
  };

  const { data, error } = await updateWithOptionalColumns(
    supabase,
    "customer_profiles",
    existing.id,
    buildCustomerProfileValues(merged),
    { optionalColumns: ["branch_id"] }
  );

  throwIfError(error, "Không cập nhật được hồ sơ khách hàng");
  return data ? normalizeCustomerProfileRow(data) : normalizeCustomerProfileRow(existing);
}

export async function redeemVoucherLead(supabase, voucherLeadId, payload = {}) {
  const vouchers = await listVoucherLeads(supabase, { branchId: payload.branchId });
  const target = vouchers.find((item) => item.id === voucherLeadId);

  if (!target) {
    throw new Error("Không tìm thấy voucher lead");
  }

  const spendAmount = parseMoney(payload.spendAmount, 0);
  const loyaltyPointsAwarded = payload.loyaltyPointsAwarded ?? Math.max(10, Math.floor(spendAmount / 100000) * 10);
  const existingCustomers = await listCustomerProfiles(supabase, {
    branchId: payload.branchId || target.branchId || ""
  }).catch(() => []);
  const existingCustomer =
    existingCustomers.find((item) => item.id === target.customerProfileId) ||
    existingCustomers.find((item) => item.phone === target.phone) ||
    null;
  const customer = await upsertCustomerProfileByPhone(supabase, {
    phone: target.phone,
    fullName: payload.customerName || "",
    branchId: payload.branchId || target.branchId || "",
    visitCount: Number(existingCustomer?.visitCount || 0) + Number(payload.visitCount || 1),
    totalSpent: Number(existingCustomer?.totalSpent || 0) + spendAmount,
    loyaltyPoints: Number(existingCustomer?.loyaltyPoints || 0) + loyaltyPointsAwarded,
    lastSeenAt: new Date().toISOString(),
    notes: payload.notes || target.notes || ""
  });

  let redemption = null;

  const redemptionValues = buildVoucherRedemptionValues({
    voucherLeadId,
    campaignId: target.campaignId || payload.campaignId,
    customerProfileId: customer.id || payload.customerProfileId,
    orderId: payload.orderId || "",
    branchId: payload.branchId || target.branchId || "",
    amountSaved:
      payload.amountSaved ??
      (target.voucherDiscountType === "amount"
        ? target.voucherDiscountValue
        : Math.round((spendAmount * Number(target.voucherDiscountValue || 0)) / 100)),
    spendAmount,
    loyaltyPointsAwarded,
    redeemedBy: payload.redeemedBy || "",
    notes: payload.notes || ""
  });

  const insertResult = await insertWithOptionalColumns(
    supabase,
    "voucher_redemptions",
    {
      id: globalThis.crypto.randomUUID(),
      ...redemptionValues
    },
    {
      select: true,
      single: true,
      optionalColumns: ["campaign_id", "customer_profile_id", "branch_id"]
    }
  );

  if (!insertResult.error) {
    redemption = normalizeVoucherRedemptionRow(insertResult.data);
  } else if (!isSupabaseSchemaMissingError(insertResult.error)) {
    throw new Error(toFriendlySupabaseErrorMessage(insertResult.error, "Không ghi nhận được redemption"));
  }

  const updatedVoucher = await updateVoucherLead(supabase, voucherLeadId, {
    ...target,
    status: "used",
    customerProfileId: customer.id || target.customerProfileId,
    notes: payload.notes || target.notes || ""
  });

  return {
    voucher: updatedVoucher,
    customer,
    redemption
  };
}

export async function listMenuItems(supabase, options = {}) {
  const branchId = cleanText(options.branchId);
  const { data, error } = await runWithOptionalBranchFilter(branchId, (useBranch) => {
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

    if (useBranch) {
      query = query.eq("branch_id", branchId);
    }

    return query;
  });

  throwIfError(error, "Không tải được món ăn");
  return (data || []).map(normalizeMenuItemRow);
}

export async function createMenuItem(supabase, payload) {
  const values = buildMenuItemValues(payload);
  const { data, error } = await insertWithOptionalColumns(supabase, "menu_items", values, {
    select: true,
    single: true
  });

  throwIfError(error, "Không tạo được món ăn");
  return normalizeMenuItemRow(data);
}

export async function updateMenuItem(supabase, id, payload) {
  const values = buildMenuItemValues(payload);
  const { data, error } = await updateWithOptionalColumns(supabase, "menu_items", id, values);

  throwIfError(error, "Không cập nhật được món ăn");
  return data ? normalizeMenuItemRow(data) : null;
}

export async function deleteMenuItem(supabase, id) {
  const { error } = await supabase.from("menu_items").delete().eq("id", id);
  throwIfError(error, "Không xóa được món ăn");
  return true;
}

export async function listRestaurantTables(supabase, options = {}) {
  const branchId = cleanText(options.branchId);
  const { data, error } = await runWithOptionalBranchFilter(branchId, (useBranch) => {
    let query = supabase
      .from("restaurant_tables")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (useBranch) {
      query = query.eq("branch_id", branchId);
    }

    return query;
  });

  throwIfError(error, "Không tải được bàn");
  return (data || []).map(normalizeTableRow);
}

export async function createRestaurantTable(supabase, payload) {
  const values = buildTableValues(payload);
  const { data, error } = await insertWithOptionalColumns(supabase, "restaurant_tables", values, {
    select: true,
    single: true
  });

  throwIfError(error, "Không tạo được bàn");
  return normalizeTableRow(data);
}

export async function updateRestaurantTable(supabase, id, payload) {
  const values = buildTableValues(payload);
  const { data, error } = await updateWithOptionalColumns(supabase, "restaurant_tables", id, values);

  throwIfError(error, "Không cập nhật được bàn");
  return data ? normalizeTableRow(data) : null;
}

export async function deleteRestaurantTable(supabase, id) {
  const { error } = await supabase.from("restaurant_tables").delete().eq("id", id);
  throwIfError(error, "Không xóa được bàn");
  return true;
}

export async function listOrders(supabase, options = {}) {
  const branchId = cleanText(options.branchId);
  const { data, error } = await runWithOptionalBranchFilter(branchId, (useBranch) => {
    let query = supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false });

    if (useBranch) {
      query = query.eq("branch_id", branchId);
    }

    return query;
  });

  throwIfError(error, "Không tải được đơn món");
  return (data || []).map(normalizeOrderRow);
}

export async function createOrder(supabase, payload) {
  const { order, items } = buildOrderValues(payload);
  const { data: orderRow, error: orderError } = await insertWithOptionalColumns(supabase, "orders", order, {
    select: true,
    single: true,
    optionalColumns: ["driver_id", "referral_code", "branch_id"]
  });

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
  const normalized = normalizeOrderRow(data);
  await syncDriverAttributionForOrder(supabase, normalized);
  return normalized;
}

export async function createPublicOrder(supabase, payload) {
  const draft = {
    ...payload,
    status: payload.status || "draft",
    orderChannel: payload.orderChannel || "website"
  };
  const { order, items } = buildOrderValues(draft);
  const id = globalThis.crypto.randomUUID();

  const { error: orderError } = await insertWithOptionalColumns(supabase, "orders", {
    id,
    ...order
  }, {
    optionalColumns: ["driver_id", "referral_code", "branch_id"]
  });
  throwIfError(orderError, "Không tạo được đơn món");

  if (items.length) {
    const insertItems = items.map((item) => ({
      ...item,
      id: globalThis.crypto.randomUUID(),
      order_id: id
    }));
    const { error: itemsError } = await supabase.from("order_items").insert(insertItems);
    throwIfError(itemsError, "Không thêm được món vào đơn");
  }

  const now = new Date().toISOString();
  const normalized = normalizeOrderRow({
    id,
    ...order,
    created_at: now,
    updated_at: now,
    order_items: items.map((item) => ({
      ...item,
      id: globalThis.crypto.randomUUID(),
      order_id: id,
      created_at: now,
      updated_at: now
    }))
  });
  await syncDriverAttributionForOrder(supabase, normalized);
  return normalized;
}

export async function updateOrder(supabase, id, payload) {
  const { order, items } = buildOrderValues(payload);
  const { data: updatedOrder, error: orderError } = await updateWithOptionalColumns(
    supabase,
    "orders",
    id,
    order,
    {
      optionalColumns: ["driver_id", "referral_code", "branch_id"]
    }
  );

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
  const normalized = normalizeOrderRow(data);
  await syncDriverAttributionForOrder(supabase, normalized);
  return normalized;
}

export async function deleteOrder(supabase, id) {
  const { error } = await supabase.from("orders").delete().eq("id", id);
  throwIfError(error, "Không xóa được đơn món");
  return true;
}

export async function listIntegrationSettings(supabase, options = {}) {
  const branchId = cleanText(options.branchId);
  const { data, error } = await runWithOptionalBranchFilter(branchId, (useBranch) => {
    let query = supabase
      .from("integration_settings")
      .select("*")
      .order("name", { ascending: true });

    if (useBranch) {
      query = query.eq("branch_id", branchId);
    }

    return query;
  });

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

  const { data, error } = await updateWithOptionalColumns(supabase, "integration_settings", id, values);

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

export async function getAdminDashboardData(supabase, options = {}) {
  const branchId = cleanText(options.branchId);
  const [
    branches,
    profiles,
    branchStaffAssignments,
    reservations,
    vouchers,
    voucherCampaigns,
    customerProfiles,
    voucherRedemptions,
    drivers,
    driverReferrals,
    driverCommissions,
    travelPartners,
    partnerContracts,
    partnerBookings,
    integrations,
    syncLogs,
    menuItems,
    restaurantTables,
    orders,
    driverFeatureStatus
  ] = await Promise.all([
    listBranches(supabase, { activeOnly: false }),
    listProfiles(supabase),
    listBranchStaffAssignments(supabase, { branchId }),
    listReservations(supabase, { branchId }),
    listVoucherLeads(supabase, { branchId }),
    listVoucherCampaigns(supabase, { branchId }),
    listCustomerProfiles(supabase, { branchId, limit: 50 }),
    listVoucherRedemptions(supabase, { branchId, limit: 100 }),
    listDrivers(supabase, { branchId }),
    listDriverReferrals(supabase, { branchId, limit: 100 }),
    listDriverCommissionTransactions(supabase, { branchId, limit: 100 }),
    listTravelPartners(supabase, { branchId }),
    listPartnerContracts(supabase, { branchId, limit: 100 }),
    listPartnerBookings(supabase, { branchId, limit: 200 }),
    listIntegrationSettings(supabase, { branchId }),
    listIntegrationSyncLogs(supabase),
    listMenuItems(supabase, { branchId }),
    listRestaurantTables(supabase, { branchId }),
    listOrders(supabase, { branchId }),
    probeFeatureTable(supabase, "drivers", {
      branchId,
      usesBranch: true,
      fallbackMessage: "Khong kiem tra duoc tinh nang tai xe"
    })
  ]);
  const reservationIds = new Set(reservations.map((item) => item.id));
  const filteredSyncLogs = branchId
    ? syncLogs.filter((item) => !item.reservationId || reservationIds.has(item.reservationId))
    : syncLogs;

  return {
    branches,
    profiles,
    branchStaffAssignments,
    reservations,
    vouchers,
    voucherCampaigns,
    customerProfiles,
    voucherRedemptions,
    drivers,
    driverReferrals,
    driverCommissions,
    travelPartners,
    partnerContracts,
    partnerBookings,
    integrations,
    syncLogs: filteredSyncLogs,
    menuItems,
    restaurantTables,
    orders,
    featureStatus: {
      drivers: driverFeatureStatus
    }
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
    "driverId",
    "referralCode",
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

export function driverCommissionsToCsv(items) {
  const headers = [
    "id",
    "driverId",
    "referralId",
    "reservationId",
    "orderId",
    "branchId",
    "status",
    "commissionAmount",
    "payoutMethod",
    "paidAt",
    "notes",
    "createdAt",
    "updatedAt"
  ];

  const rows = items.map((item) =>
    headers.map((header) => `"${String(item[header] ?? "").replaceAll('"', '""')}"`).join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}

export function partnerBookingsToCsv(items) {
  const headers = [
    "id",
    "partnerId",
    "reservationId",
    "branchId",
    "code",
    "customerName",
    "customerPhone",
    "groupSize",
    "bookingAt",
    "packageName",
    "menuBudget",
    "discountAmount",
    "commissionAmount",
    "status",
    "guestManifestUrl",
    "notes",
    "createdAt",
    "updatedAt"
  ];

  const rows = items.map((item) =>
    headers.map((header) => `"${String(item[header] ?? "").replaceAll('"', '""')}"`).join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}

export function vouchersToCsv(items) {
  const headers = [
    "id",
    "phone",
    "status",
    "source",
    "campaignId",
    "customerProfileId",
    "voucherCode",
    "voucherTitle",
    "voucherDiscountType",
    "voucherDiscountValue",
    "voucherDescription",
    "expiresAt",
    "notes",
    "createdAt",
    "updatedAt"
  ];
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
