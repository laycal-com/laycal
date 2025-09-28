import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
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
      <head>
        {/* Google Tag Manager - Optimized Setup */}
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${process.env.NEXT_PUBLIC_GTM_ID || 'GTM-TXJ2387M'}');
            
            // Initialize dataLayer for custom events
            window.dataLayer = window.dataLayer || [];
            
            // SaaS-specific tracking helper
            window.trackSaaSEvent = function(eventName, properties = {}) {
              window.dataLayer.push({
                event: eventName,
                ...properties,
                timestamp: new Date().toISOString(),
                page_url: window.location.href,
                user_agent: navigator.userAgent
              });
            };
          `}
        </Script>
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <noscript>
          <iframe 
            src={`https://www.googletagmanager.com/ns.html?id=${process.env.NEXT_PUBLIC_GTM_ID || 'GTM-TXJ2387M'}`}
            height="0" 
            width="0" 
            style={{display:'none',visibility:'hidden'}}
          />
        </noscript>
        <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
      </body>
    </html>
  );
}