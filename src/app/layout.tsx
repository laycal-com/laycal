import { Geist, Geist_Mono } from "next/font/google";
import ClientLayoutWrapper from "@/components/ClientLayoutWrapper";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Laycal - AI-Powered Sales Calling Platform",
  description: "Scale your sales calls with AI agents that work 24/7. Get 15-30% higher contact rates at $0.07/minute with automated lead calling, real-time analytics, and seamless CRM integration.",
  keywords: "AI calling, sales automation, lead generation, outbound calling, AI voice agents, sales calls, CRM integration, automated calling",
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
    title: "Laycal - AI-Powered Sales Calling Platform",
    description: "Scale your sales calls with AI agents that work 24/7. Get 15-30% higher contact rates at $0.07/minute.",
    url: "https://laycal.com",
    siteName: "Laycal",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Laycal - AI-Powered Sales Calling Platform",
    description: "Scale your sales calls with AI agents that work 24/7. Get 15-30% higher contact rates at $0.07/minute.",
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
  verification: {
    google: "your-google-verification-code",
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
