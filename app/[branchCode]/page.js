import { notFound, redirect } from "next/navigation";
import LandingPage from "../../components/landing-page";
import {
  DEFAULT_BRANCHES,
  MAIN_BRANCH_CODE,
  getBranchByCode,
  getBranchLandingPath,
  normalizeBranchCode
} from "../../lib/branches";
import { normalizeLandingPageConfig } from "../../lib/landing-page-config";
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

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const branchCode = normalizeBranchCode(resolvedParams?.branchCode);

  if (!branchCode || branchCode === MAIN_BRANCH_CODE) {
    return {};
  }

  const branches = await loadActiveBranches();
  const selectedBranch = getBranchByCode(branches, branchCode);

  if (!selectedBranch) {
    return {};
  }

  const landingConfig = normalizeLandingPageConfig(selectedBranch.landingConfig || {});

  return {
    title:
      landingConfig.seoTitle ||
      `${selectedBranch.name} | Hải sản cao cấp, đặt bàn nhanh, combo tiết kiệm`,
    description:
      landingConfig.seoDescription ||
      `Landing page riêng cho chi nhánh ${selectedBranch.name}. Xem menu, nhận voucher và gửi đặt bàn trực tiếp cho đúng chi nhánh.`
  };
}

export default async function BranchLandingPage({ params }) {
  const resolvedParams = await params;
  const branchCode = normalizeBranchCode(resolvedParams?.branchCode);

  if (!branchCode) {
    notFound();
  }

  if (branchCode === MAIN_BRANCH_CODE) {
    redirect("/");
  }

  const branches = await loadActiveBranches();
  const selectedBranch = getBranchByCode(branches, branchCode);

  if (!selectedBranch) {
    notFound();
  }

  const canonicalPath = getBranchLandingPath(selectedBranch);
  if (canonicalPath !== `/${branchCode}`) {
    redirect(canonicalPath);
  }

  return <LandingPage initialBranches={branches} initialBranchCode={selectedBranch.code} />;
}
