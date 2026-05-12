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

export default function AdminHeader({ title, adminProfile, selectedBranch, notificationCount = 0 }) {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-zinc-200 bg-white/90 px-4 backdrop-blur md:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <SidebarTrigger className="-ml-1 shrink-0" />
        <Separator orientation="vertical" className="mx-1 hidden h-4 md:block" />
        <div className="min-w-0">
          <Breadcrumb className="hidden md:block">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/admin/overview">Dashboard</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="truncate text-sm font-semibold text-zinc-950 md:text-base">{title}</h1>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {selectedBranch ? (
          <div className="hidden rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-500 lg:inline-flex">
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
