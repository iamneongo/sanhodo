"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const PAGE_SIZE_OPTIONS = [
  { value: "10", label: "10 / trang" },
  { value: "20", label: "20 / trang" },
  { value: "50", label: "50 / trang" }
];

export default function AdminTableFooter({
  page,
  setPage,
  pageSize,
  setPageSize,
  totalItems,
  totalPages,
  range,
  className = ""
}) {
  return (
    <div
      className={cn(
        "mt-4 flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 lg:flex-row lg:items-center lg:justify-between",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-600">
        <span className="font-medium text-zinc-900">
          {totalItems ? `${range.start}-${range.end}` : "0"} / {totalItems}
        </span>
        <span>Bản ghi hiển thị</span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Select value={String(pageSize)} onValueChange={(value) => setPageSize(Number(value))}>
          <SelectTrigger className="min-w-[130px] bg-white">
            <SelectValue placeholder="Số dòng" />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}>
            Trước
          </Button>
          <div className="flex items-center gap-2">
            {pageNumbers(totalPages, page).map((item) => (
              <Button
                key={item}
                type="button"
                variant={item === page ? "default" : "outline"}
                size="sm"
                className="min-w-9"
                onClick={() => setPage(item)}
              >
                {item}
              </Button>
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}>
            Sau
          </Button>
        </div>
      </div>
    </div>
  );
}

function pageNumbers(totalPages, page) {
  const pages = [];
  const start = Math.max(1, page - 1);
  const end = Math.min(totalPages, start + 2);
  const adjustedStart = Math.max(1, end - 2);

  for (let value = adjustedStart; value <= end; value += 1) {
    pages.push(value);
  }

  return pages;
}
