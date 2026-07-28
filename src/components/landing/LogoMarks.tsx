/**
 * PLACEHOLDER customer wordmarks.
 *
 * These are invented brand marks, not real customers. Authored as inline SVG
 * rather than raster art so they stay crisp at 112x26 and weigh nothing.
 * Swap each one for a real logo (with that customer's written permission)
 * before treating this strip as social proof.
 */

const MARK = {
  fill: 'currentColor',
} as const;

function Northbeam() {
  return (
    <svg viewBox="0 0 112 26" width="112" height="26" role="img" aria-label="Northbeam (placeholder)">
      <path d="M4 20V6l10 9V6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round" />
      <text x="22" y="19" {...MARK} fontFamily="var(--font-geist-sans), sans-serif" fontSize="13" fontWeight="600" letterSpacing="-0.02em">
        Northbeam
      </text>
    </svg>
  );
}

function Cadence() {
  return (
    <svg viewBox="0 0 112 26" width="112" height="26" role="img" aria-label="Cadence (placeholder)">
      <circle cx="10" cy="13" r="6.5" stroke="currentColor" strokeWidth="2" fill="none" />
      <circle cx="10" cy="13" r="2" {...MARK} />
      <text x="24" y="19" {...MARK} fontFamily="var(--font-geist-sans), sans-serif" fontSize="13" fontWeight="600" letterSpacing="-0.02em">
        Cadence
      </text>
    </svg>
  );
}

function Halcyon() {
  return (
    <svg viewBox="0 0 112 26" width="112" height="26" role="img" aria-label="Halcyon (placeholder)">
      <rect x="4" y="7" width="12" height="12" rx="3.5" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M8 13h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <text x="23" y="19" {...MARK} fontFamily="var(--font-geist-sans), sans-serif" fontSize="13" fontWeight="600" letterSpacing="-0.02em">
        Halcyon
      </text>
    </svg>
  );
}

function Ridgeline() {
  return (
    <svg viewBox="0 0 112 26" width="112" height="26" role="img" aria-label="Ridgeline (placeholder)">
      <path d="M3 19l6-9 4 5 3-4 5 8z" {...MARK} />
      <text x="25" y="19" {...MARK} fontFamily="var(--font-geist-sans), sans-serif" fontSize="12.5" fontWeight="600" letterSpacing="-0.02em">
        Ridgeline
      </text>
    </svg>
  );
}

export const LOGO_MARKS = [Northbeam, Cadence, Halcyon, Ridgeline];
