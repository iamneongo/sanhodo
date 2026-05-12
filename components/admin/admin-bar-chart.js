"use client";

export default function AdminBarChart({ items = [], formatValue }) {
  if (!items.length) return null;

  const maxValue = Math.max(...items.map((item) => Number(item.value || 0)), 1);

  return (
    <div className="grid gap-4 p-1">
      {items.map((item) => {
        const percent = Math.max(8, Math.round((Number(item.value || 0) / maxValue) * 100));
        return (
          <div key={item.label} className="grid gap-2">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <strong className="block truncate text-sm font-semibold text-zinc-900">{item.label}</strong>
                {item.helper ? <span className="text-xs text-zinc-500">{item.helper}</span> : null}
              </div>
              <span className="shrink-0 text-sm font-medium text-zinc-600">{formatValue ? formatValue(item.value) : item.value}</span>
            </div>
            <div className="h-2.5 rounded-full bg-zinc-100">
              <div
                className="h-2.5 rounded-full bg-zinc-900 transition-[width] duration-300"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
