'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * Mounted once per landing page. Owns every scroll-driven effect:
 *  - reveal-on-enter for any [data-reveal] element in the page
 *  - the fixed background scene crossfade + orb / grid parallax
 *  - the top progress bar
 *  - the hero panel tilt
 *
 * Sections stay plain markup — they only need a `data-reveal` attribute.
 */
export function ScrollFx() {
  const ctxRef = useRef<gsap.Context | null>(null);

  useIsoLayoutEffect(() => {
    if (typeof window === 'undefined') return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      /* ---- reveal ---- */
      const targets = gsap.utils.toArray<HTMLElement>('[data-reveal]');
      targets.forEach((el) => {
        gsap.set(el, { opacity: 0, y: 30 });
        ScrollTrigger.create({
          trigger: el,
          start: 'top 92%',
          once: true,
          onEnter: () =>
            gsap.to(el, {
              opacity: 1,
              y: 0,
              duration: 1,
              ease: 'power3.out',
              delay: 0.05,
              overwrite: 'auto',
            }),
        });
      });

      /* ---- background scenes, orbs, grid, progress bar ---- */
      const bar = document.getElementById('lc-progress');
      const sceneA = document.getElementById('lc-scene-a');
      const sceneB = document.getElementById('lc-scene-b');
      const sceneC = document.getElementById('lc-scene-c');
      const orb1 = document.getElementById('lc-orb-1');
      const orb2 = document.getElementById('lc-orb-2');
      const grid = document.getElementById('lc-grid');

      const setBar = bar ? gsap.quickSetter(bar, 'width', '%') : null;
      const seg = (p: number, a: number, b: number) =>
        Math.min(1, Math.max(0, 1 - Math.abs(p - a) / b));

      ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: (self) => {
          const p = self.progress;
          if (setBar) setBar(p * 100);
          if (sceneA) sceneA.style.opacity = String(Math.max(seg(p, 0, 0.38), p < 0.1 ? 1 : 0));
          if (sceneB) sceneB.style.opacity = String(seg(p, 0.5, 0.34));
          if (sceneC) sceneC.style.opacity = String(seg(p, 1, 0.34));
          if (orb1) orb1.style.translate = `${-p * 220}px ${p * 340}px`;
          if (orb2) orb2.style.translate = `${p * 260}px ${-p * 280}px`;
          if (grid) grid.style.backgroundPosition = `0px ${p * 260}px`;
        },
      });

      /* ---- hero panel tilt ---- */
      const panel = document.querySelector<HTMLElement>('[data-parallax]');
      if (panel) {
        gsap.fromTo(
          panel,
          { rotateX: 5.8, y: 14 },
          {
            rotateX: -0.6,
            y: -14,
            ease: 'none',
            scrollTrigger: { trigger: panel, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
          }
        );
      }
    });

    ctxRef.current = ctx;
    ScrollTrigger.refresh();

    return () => ctx.revert();
  }, []);

  return null;
}
