"use client";

import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import styles from "../admin.module.css";

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
    <Card className={`${styles.surfaceCard} ${className}`.trim()}>
      {kicker || title || description || actions ? (
        <CardHeader className={styles.surfaceCardHeader}>
          <div>
            {kicker ? <span className={styles.kicker}>{kicker}</span> : null}
            {title ? <CardTitle className={styles.surfaceCardTitle}>{title}</CardTitle> : null}
            {description ? <CardDescription className={styles.surfaceCardDescription}>{description}</CardDescription> : null}
          </div>
          {actions ? <CardAction className={styles.surfaceCardActions}>{actions}</CardAction> : null}
        </CardHeader>
      ) : null}
      <CardContent className={`${styles.surfaceCardBody} ${bodyClassName}`.trim()}>{children}</CardContent>
    </Card>
  );
}
