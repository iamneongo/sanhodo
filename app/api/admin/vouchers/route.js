import { NextResponse } from "next/server";
import { requireAdminApi, unauthorizedResponse } from "../../../../lib/supabase/auth";
import {
  createPublicVoucherLead,
  listVoucherCampaigns,
  listVoucherLeads,
  upsertCustomerProfileByPhone
} from "../../../../lib/restaurant-db";
import {
  buildFallbackVoucherCampaign,
  generateVoucherPayload,
  isValidVietnamPhone,
  toPersistedVoucherCampaignId
} from "../../../../lib/business-rules";

export async function GET(request) {
  const context = await requireAdminApi("vouchers.view");
  if (!context) {
    return unauthorizedResponse();
  }

  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get("branchId") || "";
  const items = await listVoucherLeads(context.supabase, { branchId });
  return NextResponse.json({ ok: true, data: items });
}

export async function POST(request) {
  const context = await requireAdminApi("vouchers.manage");
  if (!context) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const branchId = body.branchId || "";
    const campaigns = await listVoucherCampaigns(context.supabase, {
      branchId,
      activeOnly: true
    }).catch(() => [buildFallbackVoucherCampaign(branchId)]);
    const selectedCampaign =
      campaigns.find((item) => item.id === body.campaignId) ||
      campaigns[0] ||
      buildFallbackVoucherCampaign(branchId);
    const voucherInfo = generateVoucherPayload(body.phone || "", selectedCampaign, branchId);
    const persistedCampaignId =
      toPersistedVoucherCampaignId(body.campaignId) ||
      toPersistedVoucherCampaignId(selectedCampaign.id) ||
      toPersistedVoucherCampaignId(voucherInfo.campaignId);
    const customerProfile = await upsertCustomerProfileByPhone(context.supabase, {
      phone: body.phone || "",
      fullName: body.fullName || "",
      branchId,
      lastSeenAt: new Date().toISOString(),
      notes: body.notes || ""
    }).catch(() => null);

    const payload = {
      phone: body.phone?.trim() || "",
      branchId,
      status: body.status || "new",
      source: body.source || "admin",
      voucherCode: body.voucherCode || voucherInfo.voucherCode,
      voucherTitle: body.voucherTitle || voucherInfo.voucherTitle,
      voucherDiscountType: body.voucherDiscountType || voucherInfo.voucherDiscountType,
      voucherDiscountValue: body.voucherDiscountValue ?? voucherInfo.voucherDiscountValue,
      voucherDescription: body.voucherDescription || voucherInfo.voucherDescription,
      campaignId: persistedCampaignId,
      customerProfileId: customerProfile?.id || "",
      expiresAt: body.expiresAt || voucherInfo.expiresAt,
      notes: body.notes || ""
    };

    if (!payload.phone) {
      return NextResponse.json({ error: "Vui lòng nhập số điện thoại." }, { status: 400 });
    }

    if (!isValidVietnamPhone(payload.phone)) {
      return NextResponse.json(
        { error: "Số điện thoại chưa đúng định dạng di động Việt Nam." },
        { status: 400 }
      );
    }

    const saved = await createPublicVoucherLead(context.supabase, payload);
    return NextResponse.json({ ok: true, data: saved });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Không tạo được voucher" },
      { status: 500 }
    );
  }
}
