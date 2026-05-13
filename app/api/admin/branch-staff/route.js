import { NextResponse } from "next/server";
import {
  listBranchStaffAssignments,
  listProfiles,
  upsertBranchStaffAssignment
} from "../../../../lib/restaurant-db";
import { requireAdminApi, unauthorizedResponse } from "../../../../lib/supabase/auth";

export async function GET(request) {
  const context = await requireAdminApi("branches.view");
  if (!context) {
    return unauthorizedResponse();
  }

  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get("branchId") || "";
  const [assignments, profiles] = await Promise.all([
    listBranchStaffAssignments(context.supabase, { branchId }),
    listProfiles(context.supabase)
  ]);

  return NextResponse.json({ ok: true, data: { assignments, profiles } });
}

export async function POST(request) {
  const context = await requireAdminApi("branches.manage");
  if (!context) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const created = await upsertBranchStaffAssignment(context.supabase, body);
    return NextResponse.json({ ok: true, data: created });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Không lưu được nhân sự chi nhánh" }, { status: 500 });
  }
}
