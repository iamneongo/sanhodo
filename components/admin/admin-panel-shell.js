"use client";

import { Card, CardContent } from "@/components/ui/card";
import styles from "../admin.module.css";

export function AdminListShell({ children, className = "" }) {
  return <Card className={`${styles.listPanel} ${className}`.trim()}><CardContent className="p-5">{children}</CardContent></Card>;
}

export function AdminDetailShell({ children, className = "" }) {
  return <Card className={`${styles.detailPanel} ${className}`.trim()}><CardContent className="grid gap-5 p-5">{children}</CardContent></Card>;
}
