const VIETNAM_TZ_OFFSET = "+07:00";

export const BUSINESS_HOURS = {
  opensAt: "10:00",
  closesAt: "22:00",
  lastReservationSlot: "21:30"
};

export const RESERVATION_TIME_SLOTS = buildTimeSlots(
  BUSINESS_HOURS.opensAt,
  BUSINESS_HOURS.lastReservationSlot,
  30
);

export const VOUCHER_PRESET = {
  code: "early-booking",
  title: "Ưu đãi đặt bàn sớm",
  discountType: "percent",
  discountValue: 10,
  description: "Giảm 10% cho hóa đơn hải sản khi đặt bàn trước và xác nhận qua hotline/Zalo.",
  validDays: 14
};

function buildTimeSlots(start, end, stepMinutes) {
  const slots = [];
  let cursor = toMinutes(start);
  const finish = toMinutes(end);

  while (cursor <= finish) {
    const hours = Math.floor(cursor / 60)
      .toString()
      .padStart(2, "0");
    const minutes = (cursor % 60).toString().padStart(2, "0");
    slots.push(`${hours}:${minutes}`);
    cursor += stepMinutes;
  }

  return slots;
}

function toMinutes(value) {
  const [hours, minutes] = String(value || "00:00")
    .split(":")
    .map((part) => Number.parseInt(part, 10));

  return (hours || 0) * 60 + (minutes || 0);
}

export function normalizeVietnamPhone(value = "") {
  const digits = String(value).replace(/[^\d+]/g, "");

  if (digits.startsWith("+84")) {
    return `0${digits.slice(3)}`;
  }

  if (digits.startsWith("84") && digits.length === 11) {
    return `0${digits.slice(2)}`;
  }

  return digits;
}

export function isValidVietnamPhone(value = "") {
  const normalized = normalizeVietnamPhone(value);
  return /^(03|05|07|08|09)\d{8}$/.test(normalized);
}

export function formatVietnamPhone(value = "") {
  const normalized = normalizeVietnamPhone(value);
  if (normalized.length !== 10) {
    return normalized;
  }

  return `${normalized.slice(0, 4)} ${normalized.slice(4, 7)} ${normalized.slice(7)}`;
}

export function sanitizeGuestCount(value) {
  if (String(value) === "10+") {
    return 10;
  }

  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 2;
}

export function isValidReservationTimeSlot(value = "") {
  return RESERVATION_TIME_SLOTS.includes(String(value));
}

export function buildReservationDateTime(date, timeSlot) {
  if (!date || !timeSlot || !isValidReservationTimeSlot(timeSlot)) {
    return "";
  }

  return `${date}T${timeSlot}:00${VIETNAM_TZ_OFFSET}`;
}

export function getReservationDateLabel(date, timeSlot) {
  const isoValue = buildReservationDateTime(date, timeSlot);
  if (!isoValue) {
    return "";
  }

  const value = new Date(isoValue);
  if (Number.isNaN(value.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Bangkok"
  }).format(value);
}

export function isReservationDateInPast(date, timeSlot) {
  const isoValue = buildReservationDateTime(date, timeSlot);
  if (!isoValue) {
    return true;
  }

  return new Date(isoValue).getTime() < Date.now();
}

export function getTodayDateInput() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  return formatter.format(new Date());
}

export function buildFallbackVoucherCampaign(branchId = "") {
  return {
    id: "fallback-early-booking",
    code: VOUCHER_PRESET.code,
    name: "Fallback early booking",
    title: VOUCHER_PRESET.title,
    description: VOUCHER_PRESET.description,
    discountType: VOUCHER_PRESET.discountType,
    discountValue: VOUCHER_PRESET.discountValue,
    validDays: VOUCHER_PRESET.validDays,
    minOrderValue: 0,
    branchId,
    autoIssue: true,
    isActive: true,
    usageLimitTotal: 0,
    usageLimitPerPhone: 1,
    startsAt: null,
    endsAt: null,
    sortOrder: 0
  };
}

function normalizeVoucherCampaign(campaign, branchId = "") {
  if (!campaign || typeof campaign !== "object") {
    return buildFallbackVoucherCampaign(branchId);
  }

  const fallback = buildFallbackVoucherCampaign(branchId);
  return {
    ...fallback,
    ...campaign,
    id: campaign.id || fallback.id,
    code: campaign.code || fallback.code,
    title: campaign.title || fallback.title,
    description: campaign.description || fallback.description,
    discountType: campaign.discountType || fallback.discountType,
    discountValue: Number(campaign.discountValue ?? fallback.discountValue),
    validDays: Number(campaign.validDays ?? fallback.validDays),
    minOrderValue: Number(campaign.minOrderValue ?? fallback.minOrderValue),
    usageLimitTotal: Number(campaign.usageLimitTotal ?? fallback.usageLimitTotal),
    usageLimitPerPhone: Number(campaign.usageLimitPerPhone ?? fallback.usageLimitPerPhone)
  };
}

export function formatVoucherBenefit(campaign) {
  const normalized = normalizeVoucherCampaign(campaign);
  if (normalized.discountType === "amount") {
    return `Giảm ${new Intl.NumberFormat("vi-VN").format(normalized.discountValue)}đ`;
  }

  return `Giảm ${normalized.discountValue}%`;
}

export function generateVoucherPayload(phone, campaign = null, branchId = "") {
  const normalizedPhone = normalizeVietnamPhone(phone);
  const suffix = normalizedPhone.slice(-4) || "0000";
  const normalizedCampaign = normalizeVoucherCampaign(campaign, branchId);
  const codePrefix = String(normalizedCampaign.code || "SANHODO")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toUpperCase();
  const code = `${codePrefix || "SANHODO"}-${suffix}`;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + normalizedCampaign.validDays);

  return {
    voucherCode: code,
    voucherTitle: normalizedCampaign.title,
    voucherDiscountType: normalizedCampaign.discountType,
    voucherDiscountValue: normalizedCampaign.discountValue,
    voucherDescription: normalizedCampaign.description,
    campaignId: normalizedCampaign.id || "",
    campaignCode: normalizedCampaign.code || "",
    expiresAt: expiresAt.toISOString()
  };
}
