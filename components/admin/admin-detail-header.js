"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function AdminDetailHeader({ kicker, title, actions = null }) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3 border-b border-zinc-100 pb-4")}>
      <div>
        {kicker ? <Badge variant="outline" className="mb-2 w-fit border-zinc-200 text-zinc-600">{kicker}</Badge> : null}
        {title ? <h2 className="text-lg font-semibold text-zinc-950">{title}</h2> : null}
      </div>
      {actions}
    </div>
  );
}
