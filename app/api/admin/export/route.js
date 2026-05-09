import { NextResponse } from "next/server";
import { requireAdminApi, unauthorizedResponse } from "../../../../lib/supabase/auth";
import { listReservations, listVoucherLeads, reservationsToCsv, vouchersToCsv } from "../../../../lib/restaurant-db";

export async function GET(request) {
  const context = await requireAdminApi();
  if (!context) {
    return unauthorizedResponse();
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "reservations";

  if (type === "vouchers") {
    const vouchers = await listVoucherLeads(context.supabase);
    const csv = vouchersToCsv(vouchers);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="vouchers.csv"'
      }
    });
  }

  const reservations = await listReservations(context.supabase);
  const csv = reservationsToCsv(reservations);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="reservations.csv"'
    }
  });
}
