"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminActiveFilters({ items = [], onClearAll = null }) {
  const visibleItems = items.filter((item) => item?.active);

  if (!visibleItems.length && !onClearAll) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2">
      <span className="text-xs font-medium uppercase tracking-[0.08em] text-zinc-500">
        Bộ lọc đang bật
      </span>
      {visibleItems.length ? (
        visibleItems.map((item) => (
          <Button
            key={item.key}
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1 rounded-full border-zinc-200 bg-zinc-50 px-3 text-zinc-700 hover:bg-zinc-100"
            onClick={item.onClear}
          >
            <span>{item.label}</span>
            <X className="h-3.5 w-3.5" />
          </Button>
        ))
      ) : (
        <span className="text-sm text-zinc-500">Chưa áp dụng bộ lọc nào.</span>
      )}
      {visibleItems.length && onClearAll ? (
        <Button type="button" variant="ghost" size="sm" className="h-8 text-zinc-600 hover:text-zinc-900" onClick={onClearAll}>
          Xóa tất cả
        </Button>
      ) : null}
    </div>
  );
}
