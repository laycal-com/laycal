'use client';

import { useState } from 'react';
import { SignedIn, SignedOut } from '@clerk/nextjs';

import {
  MobileNav,
  MobileNavHeader,
  MobileNavMenu,
  MobileNavToggle,
  NavBody,
  NavItems,
  Navbar,
  NavbarButton,
  NavbarLogo,
} from '@/components/ui/resizable-navbar';
import { DEMO_URL } from '@/lib/links';

const ITEMS = [
  { name: 'How it works', link: '/#how' },
  { name: 'Features', link: '/#features' },
  { name: 'Pricing', link: '/#pricing' },
  { name: 'FAQ', link: '/#faq' },
];

/* Access is invite-only: sign-in stays reachable, sign-up is never linked. */
function Actions({ stacked = false, onNavigate }: { stacked?: boolean; onNavigate?: () => void }) {
  const full = stacked ? 'w-full' : undefined;
  return (
    <>
      <SignedOut>
        <NavbarButton href="/sign-in" variant="secondary" className={full} onClick={onNavigate}>
          Log in
        </NavbarButton>
        <NavbarButton
          href={DEMO_URL}
          target="_blank"
          rel="noopener noreferrer"
          variant="brand"
          className={full}
          onClick={onNavigate}
        >
          Book a demo
        </NavbarButton>
      </SignedOut>
      <SignedIn>
        <NavbarButton href="/dashboard" variant="primary" className={full} onClick={onNavigate}>
          Go to dashboard
        </NavbarButton>
      </SignedIn>
    </>
  );
}

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Navbar>
      <NavBody>
        <NavbarLogo />
        <NavItems items={ITEMS} />
        <div className="relative z-20 flex items-center gap-2">
          <Actions />
        </div>
      </NavBody>

      <MobileNav>
        <MobileNavHeader className="px-2">
          <NavbarLogo />
          <MobileNavToggle isOpen={open} onClick={() => setOpen((v) => !v)} />
        </MobileNavHeader>
        <MobileNavMenu isOpen={open} onClose={close}>
          {ITEMS.map((item) => (
            <a
              key={item.link}
              href={item.link}
              onClick={close}
              className="w-full rounded-lg px-2 py-2 text-base text-neutral-300 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              {item.name}
            </a>
          ))}
          <div className="mt-2 flex w-full flex-col gap-3 border-t border-white/10 pt-5">
            <Actions stacked onNavigate={close} />
          </div>
        </MobileNavMenu>
      </MobileNav>
    </Navbar>
  );
}
