import * as React from "react";
import { cn } from "@/lib/utils";

function Card({ className, ...props }) {
  return <div className={cn("rounded-3xl border border-[#e6d6ca] bg-white/85 text-[#41251e] shadow-[0_18px_36px_rgba(84,50,29,0.06)]", className)} {...props} />;
}

function CardHeader({ className, ...props }) {
  return <div className={cn("flex flex-col gap-1.5 p-6", className)} {...props} />;
}

function CardTitle({ className, ...props }) {
  return <h3 className={cn("font-[var(--font-cormorant)] text-2xl font-semibold leading-none tracking-tight text-[#311b15]", className)} {...props} />;
}

function CardDescription({ className, ...props }) {
  return <p className={cn("text-sm text-[#6d544a]", className)} {...props} />;
}

function CardAction({ className, ...props }) {
  return <div className={cn("justify-self-end", className)} {...props} />;
}

function CardContent({ className, ...props }) {
  return <div className={cn("p-6 pt-0", className)} {...props} />;
}

function CardFooter({ className, ...props }) {
  return <div className={cn("flex items-center p-6 pt-0", className)} {...props} />;
}

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent };
