'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { MotionConfig } from 'motion/react';

import { DEFAULT_ASSISTANT_FEE, DEFAULT_RATE } from './rate';

const RateContext = createContext({ rate: DEFAULT_RATE, assistantFee: DEFAULT_ASSISTANT_FEE });

/** Per-minute rate from /api/pricing, falling back to the default until it loads. */
export function useRate() {
  const { rate, assistantFee } = useContext(RateContext);
  return { rate, rateLabel: `$${rate.toFixed(2)}`, assistantFee };
}

export function LandingProviders({ children }: { children: React.ReactNode }) {
  const [rate, setRate] = useState(DEFAULT_RATE);
  const [assistantFee, setAssistantFee] = useState(DEFAULT_ASSISTANT_FEE);

  useEffect(() => {
    let alive = true;
    fetch('/api/pricing')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!alive || !d) return;
        if (d.cost_per_minute_payg) setRate(Number(d.cost_per_minute_payg));
        if (d.assistant_base_cost) setAssistantFee(Number(d.assistant_base_cost));
      })
      .catch(() => {
        /* keep the default rate */
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <RateContext.Provider value={{ rate, assistantFee }}>{children}</RateContext.Provider>
    </MotionConfig>
  );
}
