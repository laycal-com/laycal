'use client';

import { usePathname } from "next/navigation";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import ConditionalNavbar from "@/components/ConditionalNavbar";
import { Analytics } from "@vercel/analytics/next";

interface ClientLayoutWrapperProps {
  children: React.ReactNode;
  geistSans: string;
  geistMono: string;
}

export default function ClientLayoutWrapper({ 
  children, 
  geistSans, 
  geistMono 
}: ClientLayoutWrapperProps) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');

  if (isAdminRoute) {
    return (
      <body className={`${geistSans} ${geistMono} antialiased`}>
        {children}
        <Analytics />
      </body>
    );
  }

  return (
    <ClerkProvider>
      <body className={`${geistSans} ${geistMono} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          enableSystem={false}
          storageKey="saas-theme"
        >
          <ConditionalNavbar />
          <main>{children}</main>
          <Toaster />
        </ThemeProvider>
        <Analytics />
      </body>
    </ClerkProvider>
  );
}