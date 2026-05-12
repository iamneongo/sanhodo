"use client";

import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function AdminHeader({ title, adminProfile, selectedBranch, notificationCount = 0 }) {
  return (
    <header className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm md:px-5">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="shrink-0" />
        <div>
          <h1 className="text-lg font-semibold text-zinc-950 md:text-xl">{title}</h1>
          {selectedBranch ? <p className="text-sm text-zinc-500">{selectedBranch.name}</p> : null}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="hidden items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-500 lg:flex">
          <Bell className="size-4" />
          <span>{notificationCount}</span>
        </div>
        <Badge variant="secondary" className="hidden md:inline-flex">{adminProfile?.role || "admin"}</Badge>
      </div>
    </header>
  );
}
