import { NextResponse } from "next/server";
import { getLocalAdminCookieOptions, LOCAL_ADMIN_COOKIE } from "../../../../lib/local-admin";
import { createClient } from "../../../../lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(LOCAL_ADMIN_COOKIE, "", {
    ...getLocalAdminCookieOptions(),
    maxAge: 0
  });
  return response;
}
