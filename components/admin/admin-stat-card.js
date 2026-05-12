"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const accentClasses = {
  default: "bg-white",
  warm: "bg-amber-50/60",
  soft: "bg-zinc-50",
  ocean: "bg-slate-50"
};

export default function AdminStatCard({ label, value, detail, accent = "default" }) {
  return (
    <Card className={cn("rounded-3xl border-zinc-200 shadow-sm", accentClasses[accent] || accentClasses.default)}>
      <CardContent className="space-y-3 p-5">
        <Badge variant="outline" className="w-fit rounded-full border-zinc-200 uppercase tracking-[0.08em] text-zinc-600">
          {label}
        </Badge>
        <div className="text-3xl font-semibold tracking-tight text-zinc-950">{value}</div>
        <p className="text-sm text-zinc-500">{detail}</p>
      </CardContent>
    </Card>
  );
}
