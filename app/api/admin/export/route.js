import { NextResponse } from "next/server";
import { requireAdminApi } from "../../../../lib/admin-guard";
import {
  readLeads,
  reservationsToCsv,
  vouchersToCsv,
  RESERVATIONS_FILE,
  VOUCHERS_FILE
} from "../../../../lib/lead-store";

export async function GET(request) {
  const isAllowed = await requireAdminApi();
  if (!isAllowed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "reservations";

  if (type === "vouchers") {
    const vouchers = await readLeads(VOUCHERS_FILE, "voucher");
    const csv = vouchersToCsv(vouchers);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="vouchers.csv"'
      }
    });
  }

  const reservations = await readLeads(RESERVATIONS_FILE, "reservation");
  const csv = reservationsToCsv(reservations);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="reservations.csv"'
    }
  });
}
