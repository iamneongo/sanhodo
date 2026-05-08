import { NextResponse } from "next/server";
import { requireAdminApi } from "../../../../../lib/admin-guard";
import { getSyncLogs } from "../../../../../lib/integrations-store";

export async function GET() {
  const isAllowed = await requireAdminApi();
  if (!isAllowed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const logs = await getSyncLogs();
  return NextResponse.json({ ok: true, data: logs });
}
