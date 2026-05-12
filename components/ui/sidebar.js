"use client";

import * as React from "react";
import { PanelLeftIcon } from "lucide-react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const SidebarContext = React.createContext(null);

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within SidebarProvider.");
  }
  return context;
}

export function SidebarProvider({ defaultOpen = true, children, className, style }) {
  const [open, setOpen] = React.useState(defaultOpen);

  const toggleSidebar = React.useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  const value = React.useMemo(
    () => ({
      open,
      state: open ? "expanded" : "collapsed",
      setOpen,
      toggleSidebar
    }),
    [open, toggleSidebar]
  );

  return (
    <SidebarContext.Provider value={value}>
      <div
        data-slot="sidebar-wrapper"
        data-state={value.state}
        style={{
          "--sidebar-width": "17rem",
          "--sidebar-width-collapsed": "4.5rem",
          ...style
        }}
        className={cn("group/sidebar-wrapper flex min-h-svh w-full bg-zinc-100/70", className)}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

export function Sidebar({ className, children }) {
  const { state } = useSidebar();

  return (
    <aside
      data-slot="sidebar"
      data-state={state}
      className={cn(
        "sticky top-0 hidden h-svh shrink-0 border-r border-zinc-200 bg-white transition-[width] duration-200 ease-linear md:block",
        state === "expanded" ? "w-[var(--sidebar-width)]" : "w-[var(--sidebar-width-collapsed)]",
        className
      )}
    >
      <div className="flex h-full flex-col">{children}</div>
    </aside>
  );
}

export function SidebarInset({ className, children }) {
  return (
    <main
      data-slot="sidebar-inset"
      className={cn("flex min-h-svh min-w-0 flex-1 flex-col bg-zinc-50", className)}
    >
      {children}
    </main>
  );
}

export function SidebarTrigger({ className, ...props }) {
  const { toggleSidebar } = useSidebar();

  return (
    <button
      type="button"
      data-slot="sidebar-trigger"
      onClick={toggleSidebar}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-950",
        className
      )}
      {...props}
    >
      <PanelLeftIcon className="size-4" />
      <span className="sr-only">Toggle Sidebar</span>
    </button>
  );
}

export function SidebarHeader({ className, ...props }) {
  return <div data-slot="sidebar-header" className={cn("flex flex-col gap-2 p-3", className)} {...props} />;
}

export function SidebarContent({ className, ...props }) {
  return <div data-slot="sidebar-content" className={cn("flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-3", className)} {...props} />;
}

export function SidebarFooter({ className, ...props }) {
  return <div data-slot="sidebar-footer" className={cn("mt-auto flex flex-col gap-3 p-3", className)} {...props} />;
}

export function SidebarGroup({ className, ...props }) {
  return <section data-slot="sidebar-group" className={cn("flex flex-col gap-2", className)} {...props} />;
}

export function SidebarGroupLabel({ className, ...props }) {
  return (
    <div
      data-slot="sidebar-group-label"
      className={cn("px-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500", className)}
      {...props}
    />
  );
}

export function SidebarMenu({ className, ...props }) {
  return <ul data-slot="sidebar-menu" className={cn("flex flex-col gap-1", className)} {...props} />;
}

export function SidebarMenuItem({ className, ...props }) {
  return <li data-slot="sidebar-menu-item" className={cn("list-none", className)} {...props} />;
}

const sidebarMenuButtonVariants = cva(
  "group/menu-button flex w-full items-center gap-3 overflow-hidden rounded-xl px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 data-[active=true]:bg-zinc-900 data-[active=true]:text-white",
  {
    variants: {
      size: {
        default: "h-10",
        lg: "h-11"
      }
    },
    defaultVariants: {
      size: "default"
    }
  }
);

export function SidebarMenuButton({ asChild = false, isActive = false, size = "default", className, ...props }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="sidebar-menu-button"
      data-active={isActive}
      className={cn(sidebarMenuButtonVariants({ size }), className)}
      {...props}
    />
  );
}
