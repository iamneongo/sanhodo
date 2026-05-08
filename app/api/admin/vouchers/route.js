import { NextResponse } from "next/server";
import { requireAdminApi } from "../../../../lib/admin-guard";
import { readLeads, VOUCHERS_FILE } from "../../../../lib/lead-store";

export async function GET() {
  const isAllowed = await requireAdminApi();
  if (!isAllowed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await readLeads(VOUCHERS_FILE, "voucher");
  items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return NextResponse.json({ ok: true, data: items });
}
