import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import {
  createPublicReservation,
  forwardToWebhooks,
  isSupabaseSchemaMissingError,
  upsertCustomerProfileByPhone
} from "../../../lib/restaurant-db";
import {
  buildReservationDateTime,
  isReservationDateInPast,
  isValidReservationTimeSlot,
  isValidVietnamPhone
} from "../../../lib/business-rules";

export async function POST(request) {
  try {
    const body = await request.json();
    const supabase = await createClient();
    const reservationDate = body.date || "";
    const reservationTimeSlot = body.timeSlot || "";
    const computedDateTime =
      body.datetime || buildReservationDateTime(reservationDate, reservationTimeSlot);

    const payload = {
      name: body.name?.trim() || "",
      phone: body.phone?.trim() || "",
      guests: body.guests || "",
      datetime: computedDateTime,
      branchId: body.branchId || "",
      date: reservationDate,
      timeSlot: reservationTimeSlot,
      selectedOffer: body.selectedOffer || "",
      status: "new",
      source: "landing-page",
      notes: body.notes || "",
      assignedTo: "",
      lastContactAt: "",
      confirmationChannel: "zalo",
      confirmationSentAt: "",
      tableId: body.tableId || ""
    };

    if (!payload.name || !payload.phone || !payload.guests || !payload.datetime) {
      return NextResponse.json({ error: "Vui lòng điền đủ tên, số điện thoại, số khách và thời gian." }, { status: 400 });
    }

    if (!isValidVietnamPhone(payload.phone)) {
      return NextResponse.json(
        { error: "Số điện thoại chưa đúng định dạng di động Việt Nam." },
        { status: 400 }
      );
    }

    if (!isValidReservationTimeSlot(reservationTimeSlot)) {
      return NextResponse.json(
        { error: "Khung giờ đặt bàn chỉ hỗ trợ từ 10:00 đến 21:30." },
        { status: 400 }
      );
    }

    if (isReservationDateInPast(reservationDate, reservationTimeSlot)) {
      return NextResponse.json(
        { error: "Thời gian đặt bàn cần lớn hơn thời điểm hiện tại." },
        { status: 400 }
      );
    }

    const saved = await createPublicReservation(supabase, payload);
    await upsertCustomerProfileByPhone(supabase, {
      phone: payload.phone,
      fullName: payload.name,
      branchId: payload.branchId,
      lastSeenAt: new Date().toISOString(),
      notes: `Lead đặt bàn từ landing page • ${payload.selectedOffer || "no-offer"}`
    }).catch(() => {});

    await forwardToWebhooks(saved, [
      process.env.CRM_WEBHOOK_URL,
      process.env.GOOGLE_SHEET_WEBHOOK_URL,
      process.env.ZALO_WEBHOOK_URL
    ]);

    return NextResponse.json({
      ok: true,
      data: saved,
      message: "Đã nhận yêu cầu đặt bàn. Đội ngũ sẽ liên hệ xác nhận qua điện thoại hoặc Zalo."
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
      { error: error.message || "Không thể tạo yêu cầu đặt bàn" },
      { status: 500 }
    );
  }
}
