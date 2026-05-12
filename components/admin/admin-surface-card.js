"use client";

import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function AdminSurfaceCard({
  kicker,
  title,
  description,
  actions = null,
  children,
  className = "",
  bodyClassName = ""
}) {
  return (
    <Card className={cn("rounded-3xl border-zinc-200 bg-white shadow-sm", className)}>
      {kicker || title || description || actions ? (
        <CardHeader className="flex flex-col gap-4 border-b border-zinc-100 p-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {kicker ? (
              <span className="mb-2 inline-flex text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                {kicker}
              </span>
            ) : null}
            {title ? <CardTitle className="text-base font-semibold text-zinc-950 md:text-lg">{title}</CardTitle> : null}
            {description ? <CardDescription className="mt-1 text-sm text-zinc-500">{description}</CardDescription> : null}
          </div>
          {actions ? <CardAction className="flex flex-wrap gap-2.5">{actions}</CardAction> : null}
        </CardHeader>
      ) : null}
      <CardContent className={cn("p-6", bodyClassName)}>{children}</CardContent>
    </Card>
  );
}
