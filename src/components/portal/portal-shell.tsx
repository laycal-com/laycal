'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { MotionConfig } from 'motion/react';
import {
  Bot,
  CalendarCheck,
  ChevronRight,
  LayoutDashboard,
  LifeBuoy,
  Menu,
  PanelLeft,
  Plug,
  Settings,
  Users,
  Wallet,
} from 'lucide-react';

import {
  SidebarBody,
  SidebarLabel,
  SidebarLink,
  SidebarProvider,
  useSidebar,
} from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Other path prefixes that should light this item up. */
  also?: string[];
};

const NAV: { group: string; items: NavItem[] }[] = [
  { group: 'Overview', items: [{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }] },
  {
    group: 'Pipeline',
    items: [
      { label: 'Leads', href: '/leads', icon: Users, also: ['/call-summary'] },
      { label: 'Appointments', href: '/appointments', icon: CalendarCheck },
    ],
  },
  {
    group: 'Agents',
    items: [
      { label: 'Assistants', href: '/assistants', icon: Bot },
      { label: 'Integrations', href: '/integrations', icon: Plug },
    ],
  },
  {
    group: 'Account',
    items: [
      { label: 'Settings', href: '/settings', icon: Settings },
      { label: 'Support', href: '/support', icon: LifeBuoy },
    ],
  },
];

/** Routes that render inside the portal shell. */
export const PORTAL_ROUTES = NAV.flatMap((g) => g.items.flatMap((i) => [i.href, ...(i.also ?? [])]));

/**
 * Pages already moved onto the dark tokens. Everything else in the portal still
 * carries its own light styling, so its content column stays light until that
 * page is redesigned and added here.
 */
const DARK_ROUTES = ['/dashboard', '/leads', '/call-summary', '/appointments', '/assistants', '/integrations', '/settings', '/support'];

const matches = (pathname: string, prefix: string) => pathname === prefix || pathname.startsWith(`${prefix}/`);

function findCurrent(pathname: string) {
  for (const g of NAV) {
    for (const item of g.items) {
      if ([item.href, ...(item.also ?? [])].some((p) => matches(pathname, p))) return { group: g.group, item };
    }
  }
  return null;
}

const OPEN_KEY = 'laycal-sidebar-open';

/* ------------------------------ unread support ----------------------------- */

function useUnreadSupport(pathname: string) {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const check = async () => {
      try {
        const lastChecked =
          localStorage.getItem('support-last-checked') || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const res = await fetch(`/api/support/unread?lastChecked=${encodeURIComponent(lastChecked)}`);
        if (res.ok) setUnread((await res.json()).unreadCount || 0);
      } catch {
        /* the badge is a convenience; stay quiet if it cannot load */
      }
    };
    check();
    const interval = setInterval(check, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Visiting the support page marks everything as read.
  useEffect(() => {
    if (pathname === '/support' && unread > 0) {
      localStorage.setItem('support-last-checked', new Date().toISOString());
      setUnread(0);
      fetch('/api/support/unread', { method: 'POST' }).catch(() => {});
    }
  }, [pathname, unread]);

  return unread;
}

/* --------------------------------- sidebar -------------------------------- */

function SidebarContent({ pathname, unread }: { pathname: string; unread: number }) {
  const { open, setOpen, mobileOpen } = useSidebar();
  const expanded = open || mobileOpen;
  const current = findCurrent(pathname);

  return (
    <>
      <div className="flex h-14 shrink-0 items-center border-b border-border px-5">
        <Link href="/dashboard" aria-label="Laycal dashboard" className="flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary">
            <span className="size-2 rounded-full bg-white" />
          </span>
          <SidebarLabel className="text-[17px] font-semibold tracking-tight text-foreground">Laycal</SidebarLabel>
        </Link>
      </div>

      <nav aria-label="Portal" className="flex-1 space-y-5 overflow-y-auto overflow-x-hidden px-3 py-4">
        {NAV.map((g, gi) => (
          <div key={g.group}>
            <div className="mb-1.5 flex h-5 items-center px-3">
              {expanded ? (
                <span className="font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground/60">
                  {g.group}
                </span>
              ) : (
                gi > 0 && <span className="h-px w-full bg-border" />
              )}
            </div>
            <div className="space-y-0.5">
              {g.items.map((item) => (
                <SidebarLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={<item.icon />}
                  active={current?.item.href === item.href}
                  badge={
                    item.href === '/support' && unread > 0 ? (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 font-mono text-[10px] font-medium text-white">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    ) : undefined
                  }
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="hidden shrink-0 border-t border-border p-3 md:block">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
          aria-expanded={open}
          className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground outline-none transition-colors duration-200 hover:bg-sidebar-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <PanelLeft className="size-4 shrink-0" />
          <SidebarLabel>Collapse</SidebarLabel>
        </button>
      </div>
    </>
  );
}

/* --------------------------------- top bar -------------------------------- */

function BalanceChip() {
  const [credits, setCredits] = useState<{ balance: number; needsTopup: boolean } | null>(null);

  useEffect(() => {
    let alive = true;
    fetch('/api/credits', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive && d && typeof d.balance === 'number') setCredits(d);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (!credits) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href="/dashboard#credits"
          className="flex h-8 items-center gap-2 rounded-full border border-border px-3 font-mono text-xs tabular-nums text-foreground outline-none transition-colors duration-200 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Wallet className="size-3.5 text-muted-foreground" />
          ${credits.balance.toFixed(2)}
          {credits.needsTopup && (
            <>
              <span className="size-1.5 rounded-full bg-amber-500" />
              <span className="sr-only">Balance is low</span>
            </>
          )}
        </Link>
      </TooltipTrigger>
      <TooltipContent sideOffset={8}>{credits.needsTopup ? 'Credits are low. Top up.' : 'Credit balance'}</TooltipContent>
    </Tooltip>
  );
}

function TopBar({ pathname }: { pathname: string }) {
  const { setMobileOpen } = useSidebar();
  const current = findCurrent(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md md:px-8">
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
        className="-ml-2 flex size-9 items-center justify-center rounded-lg text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring md:hidden"
      >
        <Menu className="size-5" />
      </button>

      {current && (
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm">
          <span className="hidden text-muted-foreground sm:inline">{current.group}</span>
          <ChevronRight className="hidden size-3.5 text-muted-foreground/60 sm:inline" />
          <span className="truncate font-medium text-foreground">{current.item.label}</span>
        </nav>
      )}

      <div className="ml-auto flex items-center gap-3">
        <BalanceChip />
        <UserButton />
      </div>
    </header>
  );
}

/* ---------------------------------- shell --------------------------------- */

export function PortalShell({ children, forceDark = false }: { children: React.ReactNode; forceDark?: boolean }) {
  const pathname = usePathname();
  const unread = useUnreadSupport(pathname);
  const [open, setOpenState] = useState(true);

  // The pinned state is a per-browser convenience; the shell works without it.
  useEffect(() => {
    try {
      if (localStorage.getItem(OPEN_KEY) === '0') setOpenState(false);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const setOpen = (next: boolean) => {
    setOpenState(next);
    try {
      localStorage.setItem(OPEN_KEY, next ? '1' : '0');
    } catch {
      /* storage unavailable */
    }
  };

  const dark = forceDark || DARK_ROUTES.some((p) => matches(pathname, p));

  return (
    <MotionConfig reducedMotion="user">
      <TooltipProvider delayDuration={150}>
        <SidebarProvider open={open} setOpen={setOpen}>
          <div className="flex min-h-screen font-sans antialiased">
            <SidebarBody className="dark">
              <SidebarContent pathname={pathname} unread={unread} />
            </SidebarBody>

            <div
              className={cn(
                'flex min-w-0 flex-1 flex-col',
                dark ? 'dark bg-background text-foreground' : 'bg-white text-black'
              )}
            >
              <TopBar pathname={pathname} />
              <main className="flex-1">{children}</main>
            </div>
          </div>
        </SidebarProvider>
      </TooltipProvider>
    </MotionConfig>
  );
}
