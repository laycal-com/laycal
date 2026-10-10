// Renders the dotted world map used on the contact page to a static SVG, so the
// ~100KB of dots is a cached file rather than part of the page's HTML.
// Re-run only if MAP_HEIGHT in src/components/landing/mini-map.tsx changes:
//   node scripts/generate-world-map.mjs
import DottedMap from 'dotted-map';
import { writeFile } from 'node:fs/promises';

const MAP_HEIGHT = 44;
const map = new DottedMap({ height: MAP_HEIGHT, grid: 'diagonal' });
const svg = map
  .getSVG({ radius: 0.22, color: '#ffffff', shape: 'circle', backgroundColor: 'transparent' })
  // three decimals is more than enough at this size and trims the file
  .replace(/(\d+\.\d{3})\d+/g, '$1')
  .replace(/\s+/g, ' ');

await writeFile('public/assets/landing/world-map.svg', svg);
console.log(`world-map.svg: ${map.width}x${map.height}, ${(svg.length / 1024).toFixed(0)}KB`);
