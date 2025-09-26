import type { Metadata } from 'next';
import ContactPageClient from './ContactPageClient';

export const metadata: Metadata = {
  title: "Contact AI Voice Agent Support | Get Help with Automated Calling System - Laycal",
  description: "Contact our AI voice agent and automated calling system support team. Get help with AI powered phone calls, AI appointment setter, and AI sales assistant. Increase sales efficiency with expert support.",
  keywords: "contact support, ai voice agent support, automated calling system help, ai powered phone calls support, ai appointment setter help, ai sales assistant support, increase sales efficiency support",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact AI Voice Agent Support | Get Help with Automated Calling System - Laycal",
    description: "Contact our AI voice agent and automated calling system support team. Get help with AI powered phone calls, AI appointment setter, and AI sales assistant.",
    url: "https://laycal.com/contact",
  },
};

export default function ContactPage() {
  return <ContactPageClient />;
}