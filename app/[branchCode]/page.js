import { notFound, redirect } from "next/navigation";
import {
  DEFAULT_BRANCHES,
  MAIN_BRANCH_CODE,
  getBranchByCode,
  getBranchLandingPath,
  normalizeBranchCode
} from "../../lib/branches";
import { isSupabaseSchemaMissingError, listBranches } from "../../lib/restaurant-db";
import { createClient } from "../../lib/supabase/server";

export const dynamic = "force-dynamic";

async function loadActiveBranches() {
  try {
    const supabase = await createClient();
    return await listBranches(supabase, { activeOnly: true });
  } catch (error) {
    if (!isSupabaseSchemaMissingError(error)) {
      console.error("Branch landing fallback:", error);
    }
    return DEFAULT_BRANCHES;
  }
}

export async function generateMetadata() {
  return {};
}

export default async function BranchLandingPage({ params, searchParams }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const branchCode = normalizeBranchCode(resolvedParams?.branchCode);

  if (!branchCode) {
    notFound();
  }

  if (branchCode === MAIN_BRANCH_CODE) {
    redirect(
      getBranchLandingPath(MAIN_BRANCH_CODE, {
        lang: resolvedSearchParams?.lang
      })
    );
  }

  const branches = await loadActiveBranches();
  const selectedBranch = getBranchByCode(branches, branchCode);

  if (!selectedBranch) {
    notFound();
  }

  redirect(
    getBranchLandingPath(selectedBranch, {
      lang: resolvedSearchParams?.lang
    })
  );
}
