'use client';

import { useId, useState } from 'react';

export type FaqItem = { q: string; a: string };

export function Faq({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0);
  const base = useId();

  return (
    <div data-reveal style={{ borderTop: '1px solid rgba(255,255,255,0.09)' }}>
      {items.map((item, i) => {
        const isOpen = open === i;
        const panelId = `${base}-panel-${i}`;
        const btnId = `${base}-btn-${i}`;
        return (
          <div key={item.q} className="lc-faq-row">
            <button
              id={btnId}
              type="button"
              className="lc-faq-q"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpen(isOpen ? null : i)}
            >
              {item.q}
              <span className="lc-faq-sign" aria-hidden="true">
                +
              </span>
            </button>
            <div id={panelId} role="region" aria-labelledby={btnId} className="lc-faq-a" data-open={isOpen}>
              <div>
                <p style={{ margin: '0 0 24px', fontSize: 15, lineHeight: 1.65, color: '#8E99AC', maxWidth: '62ch' }}>
                  {item.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
