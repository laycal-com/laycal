"use client";
import React, { createContext, useContext, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Aceternity Sidebar, adapted. The original expands on hover, which shifts the
 * page every time the pointer crosses it; this one is pinned open or closed by
 * the user instead, and the mobile drawer is opened from the page's top bar
 * rather than from a bar of its own.
 */

export const SIDEBAR_WIDTH = 264;
export const SIDEBAR_RAIL = 64;

interface SidebarContextProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open,
  setOpen,
}: {
  children: React.ReactNode;
  open: boolean;
  setOpen: (open: boolean) => void;
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <SidebarContext.Provider value={{ open, setOpen, mobileOpen, setMobileOpen }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const SidebarBody = ({ className, children }: { className?: string; children: React.ReactNode }) => {
  return (
    <>
      <DesktopSidebar className={className}>{children}</DesktopSidebar>
      <MobileSidebar className={className}>{children}</MobileSidebar>
    </>
  );
};

export const DesktopSidebar = ({ className, children }: { className?: string; children: React.ReactNode }) => {
  const { open } = useSidebar();
  return (
    <motion.aside
      initial={false}
      animate={{ width: open ? SIDEBAR_WIDTH : SIDEBAR_RAIL }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col overflow-hidden border-r border-border bg-sidebar text-sidebar-foreground md:flex",
        className
      )}
    >
      {children}
    </motion.aside>
  );
};

export const MobileSidebar = ({ className, children }: { className?: string; children: React.ReactNode }) => {
  const { mobileOpen, setMobileOpen } = useSidebar();
  return (
    <AnimatePresence>
      {mobileOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "fixed inset-y-0 left-0 z-[100] flex w-[280px] max-w-[85vw] flex-col border-r border-border bg-sidebar text-sidebar-foreground md:hidden",
              className
            )}
          >
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-3.5 z-10 flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
            >
              <X className="size-4" />
            </button>
            {children}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

/** Text that collapses away with the rail. On the mobile drawer it always shows. */
export const SidebarLabel = ({ className, children }: { className?: string; children: React.ReactNode }) => {
  const { open, mobileOpen } = useSidebar();
  const shown = open || mobileOpen;
  return (
    <motion.span
      initial={false}
      animate={{ opacity: shown ? 1 : 0, width: shown ? "auto" : 0 }}
      transition={{ duration: 0.18 }}
      className={cn("inline-block overflow-hidden whitespace-pre", className)}
    >
      {children}
    </motion.span>
  );
};

export const SidebarLink = ({
  href,
  label,
  icon,
  active = false,
  badge,
  className,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  badge?: React.ReactNode;
  className?: string;
}) => {
  const { open, mobileOpen, setMobileOpen } = useSidebar();
  const collapsed = !open && !mobileOpen;

  const link = (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      aria-label={collapsed ? label : undefined}
      onClick={() => setMobileOpen(false)}
      className={cn(
        "group/sidebar relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "bg-primary/12 font-medium text-foreground"
          : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
        className
      )}
    >
      {active && (
        <motion.span
          layoutId="sidebar-active"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="absolute inset-y-2 -left-3 w-0.5 rounded-full bg-primary"
        />
      )}
      <span className="relative flex size-4 shrink-0 items-center justify-center [&>svg]:size-4">
        {icon}
        {badge && collapsed && <span className="absolute -right-1 -top-1 size-2 rounded-full bg-primary" />}
      </span>
      <SidebarLabel>{label}</SidebarLabel>
      {badge && !collapsed && <span className="ml-auto">{badge}</span>}
    </Link>
  );

  if (!collapsed) return link;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={12}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
};
