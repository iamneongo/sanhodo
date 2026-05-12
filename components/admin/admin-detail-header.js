"use client";

import { Badge } from "@/components/ui/badge";
import styles from "../admin.module.css";

export default function AdminDetailHeader({ kicker, title, actions = null }) {
  return (
    <div className={styles.detailHeading}>
      <div>
        {kicker ? <Badge variant="outline" className="mb-2 w-fit">{kicker}</Badge> : null}
        {title ? <h2>{title}</h2> : null}
      </div>
      {actions}
    </div>
  );
}
