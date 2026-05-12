"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

export default function AdminFormDialog({
  open,
  onOpenChange,
  title,
  description,
  size = "default",
  children
}) {
  const sizeClass =
    size === "wide"
      ? "w-[min(96vw,980px)]"
      : size === "medium"
        ? "w-[min(94vw,820px)]"
        : "w-[min(92vw,720px)]";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${sizeClass} max-h-[88vh] overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
