import * as React from "react";
import { cn } from "@/lib/utils";

function Card({ className, ...props }) {
  return <div className={cn("rounded-2xl border border-zinc-200 bg-white text-zinc-950 shadow-sm", className)} {...props} />;
}

function CardHeader({ className, ...props }) {
  return <div className={cn("flex flex-col gap-1.5 p-6", className)} {...props} />;
}

function CardTitle({ className, ...props }) {
  return <h3 className={cn("text-lg font-semibold leading-none tracking-tight text-zinc-950", className)} {...props} />;
}

function CardDescription({ className, ...props }) {
  return <p className={cn("text-sm text-zinc-500", className)} {...props} />;
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
