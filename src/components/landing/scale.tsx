'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useInView, useReducedMotion } from 'motion/react';

import type { GlobeConfig } from '@/components/ui/globe';
import { useRate } from './providers';
import { Eyebrow, Reveal, Shell } from './primitives';

/* three.js and the country geometry only download once this section is near. */
const World = dynamic(() => import('@/components/ui/globe').then((m) => m.World), { ssr: false });

const BRAND = '#2d6aff';
const WHITE = '#ffffff';

const GLOBE_CONFIG: GlobeConfig = {
  pointSize: 0.9,
  globeColor: '#111111',
  showAtmosphere: true,
  atmosphereColor: '#ffffff',
  atmosphereAltitude: 0.12,
  emissive: '#111111',
  emissiveIntensity: 0.35,
  shininess: 0.9,
  polygonColor: 'rgba(255,255,255,0.75)',
  ambientLight: '#ffffff',
  directionalLeftLight: '#ffffff',
  directionalTopLight: '#ffffff',
  pointLight: '#ffffff',
  arcTime: 1400,
  arcLength: 0.9,
  rings: 1,
  maxRings: 3,
  initialPosition: { lat: 18, lng: -70 },
  autoRotate: true,
  autoRotateSpeed: 0.5,
};

/* [order, from lat, from lng, to lat, to lng, altitude] */
const ROUTES: [number, number, number, number, number, number][] = [
  [1, 39.74, -104.99, 30.27, -97.74, 0.1],
  [1, 40.71, -74.01, 51.51, -0.13, 0.3],
  [1, 34.05, -118.24, 35.68, 139.69, 0.4],
  [2, 41.88, -87.63, 25.76, -80.19, 0.15],
  [2, 51.51, -0.13, 38.72, -9.14, 0.1],
  [2, 47.61, -122.33, 43.65, -79.38, 0.2],
  [3, 40.71, -74.01, -23.55, -46.63, 0.35],
  [3, 52.52, 13.41, 25.2, 55.27, 0.25],
  [3, 37.77, -122.42, 19.43, -99.13, 0.2],
  [4, 1.35, 103.82, -33.87, 151.21, 0.3],
  [4, 48.86, 2.35, 40.42, -3.7, 0.1],
  [4, 33.75, -84.39, 39.95, -75.17, 0.1],
  [5, 28.61, 77.21, 1.35, 103.82, 0.25],
  [5, 43.65, -79.38, 53.35, -6.26, 0.3],
  [5, 29.76, -95.37, 33.45, -112.07, 0.12],
  [6, 51.51, -0.13, 6.52, 3.38, 0.3],
  [6, 35.68, 139.69, 37.57, 126.98, 0.1],
  [6, 45.5, -73.57, 42.36, -71.06, 0.08],
];

const ARCS = ROUTES.map(([order, startLat, startLng, endLat, endLng, arcAlt], i) => ({
  order,
  startLat,
  startLng,
  endLat,
  endLng,
  arcAlt,
  color: i % 3 === 0 ? WHITE : BRAND,
}));

function GlobeStage() {
  const ref = useRef<HTMLDivElement>(null);
  const near = useInView(ref, { once: true, margin: '400px' });
  const visible = useInView(ref);
  const reduce = useReducedMotion();
  const [desktop, setDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const sync = () => setDesktop(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  return (
    <div ref={ref} aria-hidden="true" className="relative mx-auto hidden aspect-square w-full max-w-[40rem] lg:block">
      <div className="absolute inset-[12%] rounded-full bg-primary/20 blur-[90px]" />
      {desktop && near && (
        <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,black_70%,transparent)]">
          <World data={ARCS} globeConfig={{ ...GLOBE_CONFIG, autoRotate: !reduce }} paused={!visible} />
        </div>
      )}
    </div>
  );
}

export function Scale() {
  const { rateLabel } = useRate();
  const stats: [string, string][] = [
    ['500', 'calls at the same time'],
    [rateLabel, 'per minute of calling'],
    ['24/7', 'nights, weekends and holidays'],
    ['0', 'per-seat licences to buy'],
  ];

  return (
    <section className="relative overflow-hidden py-12 md:py-16">
      <Shell className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div>
          <Reveal>
            <Eyebrow>Scale</Eyebrow>
            <h2 className="mt-4 text-balance text-3xl font-semibold leading-[1.1] tracking-[-0.03em] text-neutral-50 md:text-[2.5rem]">
              Every lead called, even when fifty arrive at once.
            </h2>
            <p className="mt-5 max-w-[46ch] text-pretty text-base leading-7 text-neutral-400 md:text-lg md:leading-[1.7]">
              A campaign launch, an ad spike, a form filled in at 3am: each lead gets its own call straight away. Up
              to 500 calls can run at the same time, so nobody waits behind anyone else.
            </p>
          </Reveal>

          <Reveal delay={0.1} className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.08]">
            {stats.map(([big, small]) => (
              <div key={small} className="bg-black p-5 md:p-6">
                <div className="font-mono text-3xl font-medium tabular-nums tracking-[-0.02em] text-neutral-50">{big}</div>
                <div className="mt-2 text-sm leading-5 text-neutral-500">{small}</div>
              </div>
            ))}
          </Reveal>
        </div>

        <GlobeStage />
      </Shell>
    </section>
  );
}
