"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function AdminEmptyState({ title, description, className = "" }) {
  return (
    <Card className={cn("rounded-3xl border-dashed border-zinc-200 bg-zinc-50/70 shadow-none", className)}>
      <CardContent className="grid gap-1 p-6 text-center sm:p-8">
        <p className="text-sm font-medium text-zinc-900">{title}</p>
        {description ? <p className="text-sm text-zinc-500">{description}</p> : null}
      </CardContent>
    </Card>
  );
}
