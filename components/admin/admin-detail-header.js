"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function AdminDetailHeader({ kicker, title, actions = null }) {
  return (
    <div className={cn("flex flex-col gap-5 border-b border-zinc-100 pb-5 md:flex-row md:items-start md:justify-between")}>
      <div className="min-w-0">
        {kicker ? <Badge variant="outline" className="mb-2.5 w-fit border-zinc-200 text-zinc-600">{kicker}</Badge> : null}
        {title ? <h2 className="truncate text-lg font-semibold text-zinc-950 md:text-xl">{title}</h2> : null}
      </div>
      {actions ? <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:justify-end">{actions}</div> : null}
    </div>
  );
}
