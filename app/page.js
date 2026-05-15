import LandingPage from "../components/landing-page";
import { DEFAULT_BRANCHES, MAIN_BRANCH_CODE } from "../lib/branches";
import { isSupabaseSchemaMissingError, listBranches } from "../lib/restaurant-db";
import { createClient } from "../lib/supabase/server";

export const dynamic = "force-dynamic";

async function loadActiveBranches() {
  try {
    const supabase = await createClient();
    return await listBranches(supabase, { activeOnly: true });
  } catch (error) {
    if (!isSupabaseSchemaMissingError(error)) {
      console.error("Root landing branch fallback:", error);
    }
    return DEFAULT_BRANCHES;
  }
}

export default async function Page() {
  const branches = await loadActiveBranches();

  return <LandingPage initialBranches={branches} initialBranchCode={MAIN_BRANCH_CODE} />;
}
