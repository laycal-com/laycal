import DottedMap from 'dotted-map';

import { cn } from '@/lib/utils';

/**
 * A small dotted world map, tilted back in perspective, with an optional pin.
 *
 * The dots are a static SVG (scripts/generate-world-map.mjs). The library is
 * only used here, on the server, to project the pin's latitude and longitude
 * onto that image, so none of it ships to the browser.
 */

// Must match scripts/generate-world-map.mjs, which prints both when it runs.
const MAP_WIDTH = 87;
const MAP_HEIGHT = 44;
const map = new DottedMap({ height: MAP_HEIGHT, grid: 'diagonal' });

export interface MapPin {
  label: string;
  lat: number;
  lng: number;
}

export function MiniMap({ pin, className }: { pin?: MapPin | null; className?: string }) {
  const point = pin ? map.getPin({ lat: pin.lat, lng: pin.lng }) : null;
  const left = point ? (point.x / MAP_WIDTH) * 100 : 0;
  const top = point ? (point.y / MAP_HEIGHT) * 100 : 0;

  return (
    <div aria-hidden="true" className={cn('relative [perspective:520px]', className)}>
      {/* Tipped well back, so the far edge narrows and fades and the map reads as a surface receding from the viewer. */}
      <div
        className="relative origin-bottom [transform-style:preserve-3d] [transform:rotateX(56deg)]"
        style={{ aspectRatio: `${MAP_WIDTH} / ${MAP_HEIGHT}` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/landing/world-map.svg"
          alt=""
          className="absolute inset-0 size-full opacity-55 [mask-image:linear-gradient(to_bottom,transparent_0%,black_38%,black_100%)]"
          loading="lazy"
        />

        {point && pin && (
          <div className="absolute [transform-style:preserve-3d]" style={{ left: `${left}%`, top: `${top}%` }}>
            {/* Ripples lie flat on the map, so the tilt turns them into ellipses. */}
            <span className="absolute -left-5 -top-5 size-10 animate-ping rounded-full border border-primary/70 [animation-duration:2.4s]" />
            <span className="absolute -left-3 -top-3 size-6 rounded-full bg-primary/25 blur-[2px]" />
            <span className="absolute -left-1 -top-1 size-2 rounded-full bg-primary shadow-[0_0_14px_3px_rgba(45,106,255,0.9)]" />
            {/* The beam and label stand upright out of the map, anchored on the pin. */}
            <div className="absolute bottom-0 left-0 origin-bottom [transform:translateX(-50%)_rotateX(-56deg)]">
              <div className="flex flex-col items-center">
                <span className="whitespace-nowrap rounded-full border border-white/15 bg-neutral-900 px-3 py-1 text-xs font-medium text-neutral-100 shadow-[0_0_24px_-4px_rgba(45,106,255,0.7)]">
                  {pin.label}
                </span>
                <span className="h-16 w-px bg-gradient-to-b from-primary via-primary/70 to-transparent" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
