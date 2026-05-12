import * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-24 w-full rounded-xl border border-[#dccabe] bg-white/88 px-3 py-2 text-sm text-[#41251e] shadow-sm outline-none transition-[color,box-shadow] placeholder:text-[#9b8175] focus-visible:border-[#c64738]/40 focus-visible:ring-2 focus-visible:ring-[#c64738]/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
