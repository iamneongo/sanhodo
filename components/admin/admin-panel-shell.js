"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function AdminListShell({ children, className = "" }) {
  return (
    <Card className={cn("rounded-3xl border-zinc-200 bg-white shadow-sm", className)}>
      <CardContent className="p-5">{children}</CardContent>
    </Card>
  );
}

export function AdminDetailShell({ children, className = "" }) {
  return (
    <Card className={cn("rounded-3xl border-zinc-200 bg-white shadow-sm xl:sticky xl:top-6", className)}>
      <CardContent className="grid gap-5 p-5">{children}</CardContent>
    </Card>
  );
}
