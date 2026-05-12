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
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const updateState = () => {
      const mobile = mediaQuery.matches;
      setIsMobile(mobile);
      if (mobile) {
        setOpen(false);
      }
    };

    updateState();
    mediaQuery.addEventListener("change", updateState);

    return () => mediaQuery.removeEventListener("change", updateState);
  }, []);

  const toggleSidebar = React.useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  const value = React.useMemo(
    () => ({
      open,
      isMobile,
      state: open ? "expanded" : "collapsed",
      setOpen,
      toggleSidebar
    }),
    [isMobile, open, toggleSidebar]
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
        className={cn("group/sidebar-wrapper flex min-h-svh w-full bg-zinc-100/80", className)}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

export function Sidebar({ className, children }) {
  const { state, open, isMobile, setOpen } = useSidebar();

  return (
    <>
      {isMobile ? (
        <>
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={() => setOpen(false)}
            className={cn(
              "fixed inset-0 z-40 cursor-pointer bg-zinc-950/40 transition-opacity md:hidden",
              open ? "opacity-100" : "pointer-events-none opacity-0"
            )}
          />
          <aside
            data-slot="sidebar"
            data-state={state}
            className={cn(
              "fixed inset-y-0 left-0 z-50 flex w-[var(--sidebar-width)] max-w-[85vw] flex-col border-r border-zinc-200/80 bg-white shadow-xl transition-transform duration-200 ease-linear md:hidden",
              open ? "translate-x-0" : "-translate-x-full",
              className
            )}
          >
            <div className="flex h-full flex-col">{children}</div>
          </aside>
        </>
      ) : (
        <aside
          data-slot="sidebar"
          data-state={state}
          className={cn(
            "sticky top-0 hidden h-svh shrink-0 border-r border-zinc-200/80 bg-white transition-[width] duration-200 ease-linear md:block",
            state === "expanded" ? "w-[var(--sidebar-width)]" : "w-[var(--sidebar-width-collapsed)]",
            className
          )}
        >
          <div className="flex h-full flex-col">{children}</div>
        </aside>
      )}
    </>
  );
}

export function SidebarInset({ className, children }) {
  return (
    <main
      data-slot="sidebar-inset"
      className={cn(
        "relative flex min-h-svh min-w-0 flex-1 flex-col bg-background md:m-2 md:ml-0 md:rounded-xl md:border md:border-zinc-200/80 md:bg-white md:shadow-sm",
        className
      )}
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
        "inline-flex size-8 cursor-pointer items-center justify-center rounded-md border border-transparent bg-transparent text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950",
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
  return <div data-slot="sidebar-header" className={cn("flex flex-col gap-2 p-2", className)} {...props} />;
}

export function SidebarContent({ className, ...props }) {
  return <div data-slot="sidebar-content" className={cn("flex min-h-0 flex-1 flex-col gap-0 overflow-auto", className)} {...props} />;
}

export function SidebarFooter({ className, ...props }) {
  return <div data-slot="sidebar-footer" className={cn("mt-auto flex flex-col gap-2 p-2", className)} {...props} />;
}

export function SidebarGroup({ className, ...props }) {
  return <section data-slot="sidebar-group" className={cn("flex w-full min-w-0 flex-col p-2", className)} {...props} />;
}

export function SidebarGroupLabel({ className, ...props }) {
  return (
    <div
      data-slot="sidebar-group-label"
      className={cn("flex h-8 items-center px-2 text-xs font-medium text-zinc-500 transition-[margin,opacity] duration-200 ease-linear", className)}
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
  "group/menu-button flex h-8 w-full cursor-pointer items-center gap-2 overflow-hidden rounded-md px-2 text-left text-sm text-zinc-600 outline-none transition-[width,height,padding,color,background-color] hover:bg-zinc-100 hover:text-zinc-950 focus-visible:ring-2 focus-visible:ring-zinc-200 disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50 data-[active=true]:bg-zinc-100 data-[active=true]:font-medium data-[active=true]:text-zinc-950",
  {
    variants: {
      size: {
        default: "",
        lg: "h-9 text-sm"
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
