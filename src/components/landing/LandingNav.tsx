'use client';

import Link from 'next/link';
import { SignedIn, SignedOut } from '@clerk/nextjs';
import { DEMO_URL } from '@/lib/links';

const LINKS = [
  ['Features', '#features'],
  ['How it works', '#how'],
  ['Comparison', '#compare'],
  ['Results', '#results'],
  ['Pricing', '#pricing'],
  ['FAQ', '#faq'],
] as const;

export function LandingNav() {
  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 72,
        zIndex: 50,
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        background: 'rgba(7,9,14,0.72)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div
        className="lc-shell"
        style={{ height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32 }}
      >
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }} aria-label="Laycal home">
          <span
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              background: 'linear-gradient(140deg,#2D6AFF,#8FBBFF)',
              boxShadow: '0 0 18px rgba(45,106,255,0.65)',
            }}
          />
          <span style={{ fontSize: 19, fontWeight: 600, letterSpacing: '-0.02em' }}>Laycal</span>
        </Link>

        <nav className="lc-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 28, fontSize: 14 }}>
          {LINKS.map(([label, href]) => (
            <a key={href} href={href} className="lc-navlink">
              {label}
            </a>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <SignedOut>
            {/* Access is invite-only: sign-in stays reachable, sign-up is never linked. */}
            <Link href="/sign-in" className="lc-textlink" style={{ fontSize: 14, padding: '9px 14px' }}>
              Log in
            </Link>
            <a href={DEMO_URL} target="_blank" rel="noopener noreferrer" className="lc-btn-light">
              Request a demo
            </a>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard" className="lc-btn-light">
              Go to dashboard
            </Link>
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
