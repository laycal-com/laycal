'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { driver, type Driver } from 'driver.js';
import 'driver.js/dist/driver.css';

import { useAccount } from './account-context';

/**
 * Guided setup for a new account: create an assistant, add credits, connect
 * Google Calendar. One spotlight at a time, always skippable.
 *
 * Progress is read from the account itself (does an assistant exist, is there
 * a balance, is a calendar connected), so the guide advances because the thing
 * was actually done and never asks anyone to tick a box.
 */

type StepKey = 'assistant' | 'credits' | 'calendar';

const STEPS: Record<
  StepKey,
  { n: number; page: string; target: string; title: string; here: string; elsewhere: string; go: string }
> = {
  assistant: {
    n: 1,
    page: '/assistants',
    target: '[data-tour="new-assistant"]',
    title: 'Create your first assistant',
    here: 'This is the AI agent that calls your leads. Your first one is free.',
    elsewhere: 'Start by creating the AI agent that will call your leads. Your first one is free.',
    go: 'Go to Assistants',
  },
  credits: {
    n: 2,
    page: '/dashboard',
    target: '#credits',
    title: 'Add credits',
    here: 'Calls are paid from this balance, per second of talk time. Add credits here whenever you need to.',
    elsewhere: 'Your assistant needs credits before it can place calls.',
    go: 'Go to credits',
  },
  calendar: {
    n: 3,
    page: '/integrations',
    target: '[data-tour="tab-google-calendar"]',
    title: 'Connect Google Calendar',
    here: 'Open this tab and connect your calendar so the agent can offer real open slots and book them.',
    elsewhere: 'Connect your calendar so the agent can book meetings while the lead is still on the phone.',
    go: 'Go to Integrations',
  },
};

const ORDER: StepKey[] = ['assistant', 'credits', 'calendar'];

/** Waits briefly for an element that may still be loading. */
function whenPresent(selector: string, timeoutMs = 4000): Promise<Element | null> {
  return new Promise((resolve) => {
    const started = Date.now();
    const look = () => {
      const el = document.querySelector(selector);
      if (el) return resolve(el);
      if (Date.now() - started > timeoutMs) return resolve(null);
      setTimeout(look, 200);
    };
    look();
  });
}

export function SetupGuide() {
  const pathname = usePathname();
  const router = useRouter();
  const { status, data, refresh } = useAccount();
  const active = useRef<Driver | null>(null);

  // Something may have been completed on the page just left.
  useEffect(() => {
    if (status === 'ready') refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const setup = data?.setup;
  const next = setup && !setup.dismissed ? ORDER.find((k) => !setup[k]) : undefined;

  useEffect(() => {
    active.current?.destroy();
    active.current = null;
    if (!next || !data?.account.onboarded) return;

    const step = STEPS[next];
    const onPage = pathname === step.page;
    // Shown once per step and place in a session, so it guides without nagging on every click.
    const seenKey = `laycal-setup-${next}-${onPage ? 'here' : 'nav'}`;
    try {
      if (sessionStorage.getItem(seenKey)) return;
    } catch {
      /* storage unavailable: show it */
    }

    let cancelled = false;
    const selector = onPage ? step.target : `aside a[href="${step.page}"]`;

    whenPresent(selector).then((el) => {
      if (cancelled || !el) return;

      const tour = driver({
        allowClose: true,
        overlayOpacity: 0.65,
        stagePadding: 6,
        stageRadius: 10,
        popoverClass: 'laycal-tour',
        onDestroyed: () => {
          try {
            sessionStorage.setItem(seenKey, '1');
          } catch {
            /* ignore */
          }
        },
      });
      active.current = tour;

      tour.highlight({
        element: el,
        popover: {
          title: step.title,
          description: `<span class="laycal-tour-step">Step ${step.n} of 3</span>${onPage ? step.here : step.elsewhere}<button type="button" class="laycal-tour-skip">Skip setup guide</button>`,
          side: onPage ? 'bottom' : 'right',
          align: 'start',
          showButtons: onPage ? ['close'] : ['next', 'close'],
          nextBtnText: step.go,
          onNextClick: () => {
            tour.destroy();
            router.push(step.page);
          },
          onPopoverRender: (popover) => {
            popover.wrapper.querySelector('.laycal-tour-skip')?.addEventListener('click', async () => {
              tour.destroy();
              await fetch('/api/account', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dismissTour: true }),
              }).catch(() => {});
              refresh();
            });
          },
        },
      });
    });

    return () => {
      cancelled = true;
      active.current?.destroy();
      active.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [next, pathname, data?.account.onboarded]);

  return null;
}
