"use client";

import { cn } from "@/lib/utils";

function Table({ className, ...props }) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full max-w-full overflow-x-auto overscroll-x-contain rounded-2xl border border-zinc-200 bg-white"
    >
      <table
        data-slot="table"
        className={cn(
          "w-full caption-bottom text-sm md:min-w-full md:table-fixed",
          className
        )}
        {...props}
      />
    </div>
  );
}

function TableHeader({ className, ...props }) {
  return (
    <thead
      data-slot="table-header"
      className={cn("hidden md:table-header-group [&_tr]:border-b", className)}
      {...props}
    />
  );
}

function TableBody({ className, ...props }) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("block md:table-row-group [&_tr:last-child]:border-0", className)}
      {...props}
    />
  );
}

function TableRow({ className, ...props }) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "mb-3 block rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm transition-colors hover:bg-zinc-50 data-[state=selected]:bg-zinc-100 md:mb-0 md:table-row md:rounded-none md:border-0 md:border-b md:border-zinc-100 md:bg-transparent md:p-0 md:shadow-none",
        className
      )}
      {...props}
    />
  );
}

function TableHead({ className, ...props }) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-11 whitespace-nowrap px-3 text-left align-middle text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-500 md:px-4 md:text-xs",
        className
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "block px-0 py-2 align-top text-sm text-zinc-700 before:mb-1 before:block before:content-[attr(data-label)] before:text-[11px] before:font-medium before:uppercase before:tracking-[0.08em] before:text-zinc-500 md:table-cell md:px-4 md:py-3 md:before:hidden",
        className
      )}
      {...props}
    />
  );
}

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
