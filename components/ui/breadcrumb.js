"use client";

import { Slot } from "@radix-ui/react-slot";
import { ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";

function Breadcrumb({ className, ...props }) {
  return <nav aria-label="breadcrumb" data-slot="breadcrumb" className={cn(className)} {...props} />;
}

function BreadcrumbList({ className, ...props }) {
  return <ol data-slot="breadcrumb-list" className={cn("flex flex-wrap items-center gap-1.5 text-sm text-zinc-500", className)} {...props} />;
}

function BreadcrumbItem({ className, ...props }) {
  return <li data-slot="breadcrumb-item" className={cn("inline-flex items-center gap-1", className)} {...props} />;
}

function BreadcrumbLink({ asChild, className, ...props }) {
  const Comp = asChild ? Slot : "a";
  return <Comp data-slot="breadcrumb-link" className={cn("transition-colors hover:text-zinc-950", className)} {...props} />;
}

function BreadcrumbPage({ className, ...props }) {
  return <span data-slot="breadcrumb-page" aria-current="page" className={cn("font-normal text-zinc-950", className)} {...props} />;
}

function BreadcrumbSeparator({ className, children, ...props }) {
  return (
    <li data-slot="breadcrumb-separator" role="presentation" aria-hidden="true" className={cn("[&>svg]:size-3.5", className)} {...props}>
      {children ?? <ChevronRightIcon />}
    </li>
  );
}

export { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator };
