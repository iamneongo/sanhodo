import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-zinc-900 text-white shadow-sm hover:bg-zinc-800",
        secondary: "border border-zinc-200 bg-white text-zinc-900 shadow-sm hover:bg-zinc-50",
        outline: "border border-zinc-200 bg-transparent text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900",
        ghost: "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
        destructive: "bg-red-600 text-white shadow-sm hover:bg-red-500"
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

function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  loadingLabel = "",
  disabled,
  children,
  ...props
}) {
  const Comp = asChild ? Slot : "button";
  const content = loading ? (
    <>
      <LoaderCircle className="size-4 animate-spin" />
      <span>{loadingLabel || children}</span>
    </>
  ) : (
    children
  );

  return (
    <Comp
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {content}
    </Comp>
  );
}

export { Button, buttonVariants };
