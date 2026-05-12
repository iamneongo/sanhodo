"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import styles from "../admin.module.css";

export default function AdminStatCard({ label, value, detail, accent = "default" }) {
  return (
    <Card className={`${styles.statCard} ${styles[`statCard_${accent}`] || ""}`.trim()}>
      <CardContent className="space-y-2 p-5">
        <Badge variant="outline" className="w-fit rounded-full uppercase tracking-[0.08em]">
          {label}
        </Badge>
        <strong>{value}</strong>
        <small>{detail}</small>
      </CardContent>
    </Card>
  );
}
