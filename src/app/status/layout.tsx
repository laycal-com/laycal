import type { Metadata } from 'next';

// The page still renders placeholder figures, so it stays out of the index
// and the sitemap until it is wired to real monitoring.
export const metadata: Metadata = {
  title: 'System Status',
  robots: { index: false, follow: false },
};

export default function StatusLayout({ children }: { children: React.ReactNode }) {
  return children;
}
