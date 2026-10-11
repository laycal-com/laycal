import type { Metadata } from 'next';

// In-app support portal (auth-gated): not a public, indexable page.
export const metadata: Metadata = {
  title: 'Support',
  robots: { index: false, follow: false },
};

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return children;
}
