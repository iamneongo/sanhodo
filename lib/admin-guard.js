import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, isAdminAuthenticated } from "./admin-auth";

export async function requireAdminApi() {
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  return isAdminAuthenticated(session);
}
