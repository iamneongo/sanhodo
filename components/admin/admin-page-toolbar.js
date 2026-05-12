"use client";

import { cn } from "@/lib/utils";

export default function AdminPageToolbar({ children, actions = null, footer = null, className = "" }) {
  return (
    <div
      className={cn(
        "grid gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-start",
        className
      )}
    >
      <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">{children}</div>
      {actions ? <div className="flex flex-wrap items-center gap-2 md:justify-end">{actions}</div> : null}
      {footer ? <div className="md:col-span-2">{footer}</div> : null}
    </div>
  );
}
