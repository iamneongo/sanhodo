import LandingPage from "../components/landing-page";
import { DEFAULT_BRANCHES, MAIN_BRANCH_CODE, MAIN_BRANCH_ID } from "../lib/branches";
import { normalizeLandingPageConfig } from "../lib/landing-page-config";
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

export async function generateMetadata() {
  const branches = await loadActiveBranches();
  const selectedBranch =
    branches.find((item) => item.id === MAIN_BRANCH_ID) || branches.find((item) => item.code === MAIN_BRANCH_CODE) || branches[0];
  const landingConfig = normalizeLandingPageConfig(selectedBranch?.landingConfig || {});

  return {
    title:
      landingConfig.seoTitle ||
      `${selectedBranch?.name || "San Hô Đỏ Hồ Tràm"} | Hải sản cao cấp, đặt bàn nhanh, combo tiết kiệm`,
    description:
      landingConfig.seoDescription ||
      "Landing page chính của San Hô Đỏ. Xem menu, nhận voucher và gửi đặt bàn trực tiếp cho chi nhánh mặc định."
  };
}

export default async function Page() {
  const branches = await loadActiveBranches();

  return <LandingPage initialBranches={branches} initialBranchCode={MAIN_BRANCH_CODE} />;
}
