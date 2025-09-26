import type { Metadata } from 'next';
import PrivacyPageClient from './PrivacyPageClient';

export const metadata: Metadata = {
  title: "Privacy Policy - Laycal AI Voice Agent & Automated Calling System",
  description: "Privacy policy for Laycal's AI voice agent and automated calling system. Learn how we protect your data when using AI powered phone calls and AI appointment setter services.",
  keywords: "privacy policy, ai voice agent privacy, automated calling system privacy, ai powered phone calls privacy, data protection",
  alternates: {
    canonical: "/privacy",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyPolicyPage() {
  return <PrivacyPageClient />;
}