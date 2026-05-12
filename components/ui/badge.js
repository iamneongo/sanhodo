import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[#f3e6dc] text-[#7f392d]",
        secondary: "border-transparent bg-[#eef3f6] text-[#27465c]",
        success: "border-transparent bg-[#e5f3eb] text-[#236b4b]",
        destructive: "border-transparent bg-[#f9e3e1] text-[#8e271d]",
        outline: "border-[#dccabe] text-[#6d544a]"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
