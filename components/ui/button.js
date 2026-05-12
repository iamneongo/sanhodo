import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-[#c64738]/30 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[#c64738] text-[#fffaf4] shadow-[0_12px_24px_rgba(198,71,56,0.22)] hover:bg-[#b33b2e]",
        secondary: "bg-[#f7eee6] text-[#553328] border border-[#e4d2c3] hover:bg-[#f1e5db]",
        outline: "border border-[#dccabe] bg-white/80 text-[#553328] hover:bg-[#faf3ed]",
        ghost: "text-[#5f473d] hover:bg-[#f5ece4]",
        destructive: "bg-[#8e271d] text-white hover:bg-[#7f2219]"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-lg px-3",
        lg: "h-11 rounded-xl px-5",
        icon: "size-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

function Button({ className, variant, size, asChild = false, ...props }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
