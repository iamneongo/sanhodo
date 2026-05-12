import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-11 w-full min-w-0 rounded-xl border border-[#dccabe] bg-white/88 px-3 py-2 text-sm text-[#41251e] shadow-sm outline-none transition-[color,box-shadow] placeholder:text-[#9b8175] focus-visible:border-[#c64738]/40 focus-visible:ring-2 focus-visible:ring-[#c64738]/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { Input };
