import { NextResponse } from "next/server";
import { requireAdminApi } from "../../../../lib/admin-guard";
import { getIntegrationSettings } from "../../../../lib/integrations-store";

export async function GET() {
  const isAllowed = await requireAdminApi();
  if (!isAllowed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await getIntegrationSettings();
  return NextResponse.json({ ok: true, data: items });
}
