import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import {
  createPublicVoucherLead,
  forwardToWebhooks,
  isSupabaseSchemaMissingError,
  listVoucherCampaigns,
  upsertCustomerProfileByPhone
} from "../../../lib/restaurant-db";
import {
  buildFallbackVoucherCampaign,
  generateVoucherPayload,
  isValidVietnamPhone,
  toPersistedVoucherCampaignId
} from "../../../lib/business-rules";

export async function POST(request) {
  try {
    const body = await request.json();
    const supabase = await createClient();
    const branchId = body.branchId || "";
    const campaigns = await listVoucherCampaigns(supabase, {
      branchId,
      activeOnly: true,
      autoIssueOnly: true
    }).catch(() => [buildFallbackVoucherCampaign(branchId)]);
    const selectedCampaign =
      campaigns.find((item) => item.id === body.campaignId) || campaigns[0] || buildFallbackVoucherCampaign(branchId);
    const voucherInfo = generateVoucherPayload(body.phone || "", selectedCampaign, branchId);
    const persistedCampaignId =
      toPersistedVoucherCampaignId(body.campaignId) ||
      toPersistedVoucherCampaignId(selectedCampaign.id) ||
      toPersistedVoucherCampaignId(voucherInfo.campaignId);
    const customerProfile = await upsertCustomerProfileByPhone(supabase, {
      phone: body.phone || "",
      fullName: body.fullName || "",
      branchId,
      lastSeenAt: new Date().toISOString(),
      notes: body.notes || ""
    }).catch(() => null);

    const payload = {
      phone: body.phone?.trim() || "",
      branchId,
      status: "new",
      source: body.source || "landing-page",
      voucherCode: voucherInfo.voucherCode,
      voucherTitle: voucherInfo.voucherTitle,
      voucherDiscountType: voucherInfo.voucherDiscountType,
      voucherDiscountValue: voucherInfo.voucherDiscountValue,
      voucherDescription: voucherInfo.voucherDescription,
      campaignId: persistedCampaignId,
      customerProfileId: customerProfile?.id || "",
      expiresAt: voucherInfo.expiresAt,
      notes: body.notes || ""
    };

    if (!payload.phone) {
      return NextResponse.json({ error: "Vui lòng nhập số điện thoại để nhận ưu đãi." }, { status: 400 });
    }

    if (!isValidVietnamPhone(payload.phone)) {
      return NextResponse.json(
        { error: "Số điện thoại nhận ưu đãi chưa đúng định dạng di động Việt Nam." },
        { status: 400 }
      );
    }

    const saved = await createPublicVoucherLead(supabase, payload);

    await forwardToWebhooks(saved, [
      process.env.CRM_WEBHOOK_URL,
      process.env.GOOGLE_SHEET_WEBHOOK_URL,
      process.env.ZALO_WEBHOOK_URL
    ]);

    return NextResponse.json({
      ok: true,
      data: saved,
      message: "Ưu đãi đã được giữ chỗ. Đội ngũ có thể chăm sóc tiếp qua Zalo hoặc hotline.",
      meta: {
        campaign: selectedCampaign
      }
    });
  } catch (error) {
    if (isSupabaseSchemaMissingError(error)) {
      return NextResponse.json(
        {
          error: error.message,
          setupRequired: true
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Không thể lưu lead voucher" },
      { status: 500 }
    );
  }
}
