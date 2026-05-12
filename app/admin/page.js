import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminIndexPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const branch = resolvedSearchParams?.branch;
  redirect(branch ? `/admin/overview?branch=${encodeURIComponent(branch)}` : "/admin/overview");
}
