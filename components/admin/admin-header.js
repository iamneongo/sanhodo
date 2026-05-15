"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function AdminHeader({
  title,
  adminProfile,
  selectedBranch,
  notificationCount = 0,
  currentSection = "overview",
  detailMode = false,
  detailTitle = "",
  branchFilterId = ""
}) {
  const sectionHref = withBranchQuery(`/admin/${currentSection}`, branchFilterId);
  const overviewHref = withBranchQuery("/admin/overview", branchFilterId);

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-zinc-200 bg-white/95 px-4 backdrop-blur md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger className="-ml-1 shrink-0" />
        <Separator orientation="vertical" className="mx-1 hidden h-4 md:block" />
        <div className="min-w-0 space-y-0.5">
          <Breadcrumb className="hidden md:block">
            <BreadcrumbList>
              {currentSection === "overview" && !detailMode ? (
                <BreadcrumbItem>
                  <BreadcrumbPage>Tổng quan</BreadcrumbPage>
                </BreadcrumbItem>
              ) : (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link href={overviewHref}>Tổng quan</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {detailMode ? (
                      <BreadcrumbLink asChild>
                        <Link href={sectionHref}>{title}</Link>
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage>{title}</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                  {detailMode ? (
                    <>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbPage>{detailTitle || "Chi tiết"}</BreadcrumbPage>
                      </BreadcrumbItem>
                    </>
                  ) : null}
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="truncate text-sm font-semibold text-zinc-950 md:text-base">{title}</h1>
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        {selectedBranch ? (
          <div className="hidden rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-500 lg:inline-flex">
            {selectedBranch.name}
          </div>
        ) : null}
        <div className="hidden items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-500 lg:flex">
          <Bell className="size-4" />
          <span>{notificationCount}</span>
        </div>
        <Badge variant="secondary" className="hidden rounded-full md:inline-flex">{adminProfile?.role || "admin"}</Badge>
      </div>
    </header>
  );
}

function withBranchQuery(url, branchId) {
  if (!branchId) {
    return url;
  }

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}branch=${encodeURIComponent(branchId)}`;
}
