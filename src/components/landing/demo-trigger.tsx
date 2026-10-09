'use client';

import { DEMO_URL } from '@/lib/links';

/**
 * Wraps an existing button so pressing it opens the demo calendar. Access is
 * invite-only, so buttons that used to start self-serve signup route here.
 */
export function DemoTrigger({ children }: { children: React.ReactNode }) {
  return (
    <span className="contents" onClick={() => window.open(DEMO_URL, '_blank', 'noopener,noreferrer')}>
      {children}
    </span>
  );
}
