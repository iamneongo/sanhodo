import { NextResponse } from "next/server";
import { requireAdminApi, unauthorizedResponse } from "../../../../lib/supabase/auth";
import {
  driverCommissionsToCsv,
  listDriverCommissionTransactions,
  listPartnerBookings,
  listReservations,
  listVoucherLeads,
  partnerBookingsToCsv,
  reservationsToCsv,
  vouchersToCsv
} from "../../../../lib/restaurant-db";

export async function GET(request) {
  const context = await requireAdminApi("dashboard.export");
  if (!context) {
    return unauthorizedResponse();
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "reservations";
  const branchId = searchParams.get("branchId") || "";

  if (type === "vouchers") {
    const vouchers = await listVoucherLeads(context.supabase, { branchId });
    const csv = vouchersToCsv(vouchers);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="vouchers.csv"'
      }
    });
  }

  if (type === "driver-commissions") {
    const commissions = await listDriverCommissionTransactions(context.supabase, { branchId });
    const csv = driverCommissionsToCsv(commissions);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="driver-commissions.csv"'
      }
    });
  }

  if (type === "partner-bookings") {
    const partnerBookings = await listPartnerBookings(context.supabase, { branchId });
    const csv = partnerBookingsToCsv(partnerBookings);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="partner-bookings.csv"'
      }
    });
  }

  const reservations = await listReservations(context.supabase, { branchId });
  const csv = reservationsToCsv(reservations);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="reservations.csv"'
    }
  });
}
