'use client';

import { usePathname } from "next/navigation";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import ConditionalNavbar from "@/components/ConditionalNavbar";
import { clerkAppearance } from "@/lib/clerkAppearance";
import { PORTAL_ROUTES, PortalShell } from "@/components/portal/portal-shell";
import { Analytics } from "@vercel/analytics/next";

const MARKETING_ROUTES = [
  '/contact', '/lead-reactivation', '/justcall-alternative', '/nooks-alternative', '/blogs', '/privacy', '/terms', '/status',
];

interface ClientLayoutWrapperProps {
  children: React.ReactNode;
}

export default function ClientLayoutWrapper({ 
  children
}: ClientLayoutWrapperProps) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');
  // Signed-in product pages get the sidebar shell instead of the top navbar.
  // Marketing pages share the landing page's dark tokens, nav and footer.
  const isMarketingRoute = MARKETING_ROUTES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const isPortalRoute = PORTAL_ROUTES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (isAdminRoute) {
    return (
      <>
        {children}
        <Analytics />
      </>
    );
  }

  return (
    <ClerkProvider appearance={clerkAppearance}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        forcedTheme="light"
        enableSystem={false}
        storageKey="saas-theme"
      >
        {isPortalRoute ? (
          <PortalShell>{children}</PortalShell>
        ) : isMarketingRoute ? (
          <div className="dark min-h-screen bg-background font-sans text-foreground antialiased">
            <main>{children}</main>
          </div>
        ) : (
          <>
            <ConditionalNavbar />
            <main>{children}</main>
          </>
        )}
        <Toaster />
      </ThemeProvider>
      <Analytics />
    </ClerkProvider>
  );
}
