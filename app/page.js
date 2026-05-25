import LandingPage from "../components/landing-page";
import {
  DEFAULT_BRANCHES,
  MAIN_BRANCH_CODE,
  MAIN_BRANCH_ID,
  getBranchByCode,
  normalizeBranchCode
} from "../lib/branches";
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

function resolveRequestedBranch(branches, branchCode) {
  return (
    getBranchByCode(branches, branchCode) ||
    branches.find((item) => item.id === MAIN_BRANCH_ID) ||
    branches.find((item) => item.code === MAIN_BRANCH_CODE) ||
    branches[0]
  );
}

export async function generateMetadata({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const branches = await loadActiveBranches();
  const selectedBranch = resolveRequestedBranch(
    branches,
    normalizeBranchCode(resolvedSearchParams?.branch)
  );
  const landingConfig = normalizeLandingPageConfig(selectedBranch?.landingConfig || {});

  return {
    title:
      landingConfig.seoTitle ||
      `${selectedBranch?.name || "San Hô Đỏ Hồ Tràm"} | Hải sản cao cấp, đặt bàn nhanh, combo tiết kiệm`,
    description:
      landingConfig.seoDescription ||
      `Landing page chính của ${selectedBranch?.name || "San Hô Đỏ"}. Xem menu, nhận voucher và gửi đặt bàn trực tiếp cho đúng chi nhánh.`
  };
}

export default async function Page({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const branches = await loadActiveBranches();
  const selectedBranch = resolveRequestedBranch(
    branches,
    normalizeBranchCode(resolvedSearchParams?.branch)
  );

  return <LandingPage initialBranches={branches} initialBranchCode={selectedBranch?.code || MAIN_BRANCH_CODE} />;
}
