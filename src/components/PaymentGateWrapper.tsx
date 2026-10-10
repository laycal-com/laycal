'use client';

/**
 * Formerly decided access by plan. Access is now decided per account in the
 * portal shell (onboarding, suspension), so this only renders its children.
 * Kept so the pages that wrap themselves in it need no edits.
 */
export function PaymentGateWrapper({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
