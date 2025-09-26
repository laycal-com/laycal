import { Geist, Geist_Mono } from "next/font/google";
import ClientLayoutWrapper from "@/components/ClientLayoutWrapper";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Laycal - AI Voice Agent for Automated Sales Calls | Increase Sales Efficiency",
  description: "Boost sales efficiency with AI powered phone calls. Our AI appointment setter handles automated sales calls, AI outbound calls, and AI lead generation. Advanced AI voice agent and AI sales assistant for cold calling automation.",
  keywords: "increase sales efficiency, ai powered phone calls, ai appointment setter, ai outbound calls, automated sales calls, ai lead generation, ai for cold calling, ai voice agent, ai sales assistant, automated calling system, JustCall alternative, Nooks alternative",
  authors: [{ name: "Laycal" }],
  creator: "Laycal",
  publisher: "Laycal",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://laycal.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Laycal - AI Voice Agent for Automated Sales Calls | Increase Sales Efficiency",
    description: "Boost sales efficiency with AI powered phone calls. Our AI appointment setter handles automated sales calls, AI outbound calls, and AI lead generation. Advanced AI voice agent and AI sales assistant for cold calling automation.",
    url: "https://laycal.com",
    siteName: "Laycal",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Laycal - AI Voice Agent for Automated Sales Calls | Increase Sales Efficiency",
    description: "Boost sales efficiency with AI powered phone calls. Our AI appointment setter handles automated sales calls, AI outbound calls, and AI lead generation.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <ClientLayoutWrapper 
        geistSans={geistSans.variable}
        geistMono={geistMono.variable}
      >
        {children}
      </ClientLayoutWrapper>
    </html>
  );
}
