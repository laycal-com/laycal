// Draws the blog post banners as SVG and writes 1200x630 PNGs into
// public/assets/blogs/. Banners carry no text: the post template lays the
// title over the image. To add one, write a motif function, add it to
// `banners`, then run:  node scripts/make-blog-banners.js
const path = require('path');
const sharp = require('sharp');
const out = path.join(__dirname, '..', 'public', 'assets', 'blogs');

const W = 1200;
const H = 630;
const BRAND = '#2D6AFF';
const SOFT = '#6fa8ff';

// Shared backdrop: near-black, faint grid fading out, one blue glow behind the motif.
function frame(motif, glowX = 800, glowY = 300) {
  let grid = '';
  for (let x = 0; x <= W; x += 60) grid += `<line x1="${x}" y1="0" x2="${x}" y2="${H}"/>`;
  for (let y = 0; y <= H; y += 60) grid += `<line x1="0" y1="${y}" x2="${W}" y2="${y}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${BRAND}" stop-opacity="0.42"/>
      <stop offset="55%" stop-color="${BRAND}" stop-opacity="0.10"/>
      <stop offset="100%" stop-color="${BRAND}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="fade" cx="${(glowX / W) * 100}%" cy="${(glowY / H) * 100}%" r="75%">
      <stop offset="0%" stop-color="#fff" stop-opacity="1"/>
      <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
    <mask id="gridmask"><rect width="${W}" height="${H}" fill="url(#fade)"/></mask>
    <linearGradient id="card" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#151515"/>
      <stop offset="100%" stop-color="#0a0a0a"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="#050505"/>
  <g stroke="#ffffff" stroke-opacity="0.07" stroke-width="1" mask="url(#gridmask)">${grid}</g>
  <ellipse cx="${glowX}" cy="${glowY}" rx="520" ry="400" fill="url(#glow)"/>
  ${motif}
</svg>`;
}

const cardStyle = 'fill="url(#card)" stroke="#ffffff" stroke-opacity="0.12" stroke-width="1.5"';
const bar = (x, y, w, o = 0.22, h = 12) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="#ffffff" fill-opacity="${o}"/>`;

/* 1. Response time: a stopwatch with the first minute marked in blue. */
function stopwatch() {
  const cx = 800, cy = 330, r = 170;
  let ticks = '';
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2 - Math.PI / 2;
    const long = i % 5 === 0;
    const r1 = r - (long ? 30 : 20), r2 = r - 12;
    ticks += `<line x1="${cx + Math.cos(a) * r1}" y1="${cy + Math.sin(a) * r1}" x2="${cx + Math.cos(a) * r2}" y2="${cy + Math.sin(a) * r2}" stroke="#ffffff" stroke-opacity="${long ? 0.5 : 0.2}" stroke-width="${long ? 3 : 2}" stroke-linecap="round"/>`;
  }
  // arc from 12 o'clock to roughly ten past
  const end = (10 / 60) * Math.PI * 2 - Math.PI / 2;
  const ex = cx + Math.cos(end) * r, ey = cy + Math.sin(end) * r;
  const hx = cx + Math.cos(end) * (r - 52), hy = cy + Math.sin(end) * (r - 52);
  return `
  <rect x="${cx - 22}" y="${cy - r - 46}" width="44" height="30" rx="8" ${cardStyle}/>
  <rect x="${cx - 8}" y="${cy - r - 20}" width="16" height="22" fill="#1a1a1a"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#card)" stroke="#ffffff" stroke-opacity="0.16" stroke-width="10"/>
  ${ticks}
  <path d="M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${ex} ${ey}" fill="none" stroke="${BRAND}" stroke-width="10" stroke-linecap="round"/>
  <line x1="${cx}" y1="${cy}" x2="${hx}" y2="${hy}" stroke="${SOFT}" stroke-width="6" stroke-linecap="round"/>
  <circle cx="${cx}" cy="${cy}" r="12" fill="${BRAND}"/>
  <circle cx="${cx}" cy="${cy}" r="4" fill="#050505"/>`;
}

/* 2. The first call: a short exchange, ending in a booked slot. */
function conversation() {
  const bubble = (x, y, w, h, mine) => `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="22" ${mine
    ? `fill="${BRAND}" fill-opacity="0.16" stroke="${BRAND}" stroke-opacity="0.55" stroke-width="1.5"`
    : cardStyle}/>`;
  return `
  ${bubble(590, 120, 360, 96, false)}
  ${bar(618, 150, 250)}${bar(618, 176, 170, 0.14)}
  ${bubble(720, 240, 340, 96, true)}
  ${bar(748, 270, 230, 0.4)}${bar(748, 296, 150, 0.25)}
  ${bubble(590, 360, 300, 74, false)}
  ${bar(618, 391, 190)}
  <rect x="720" y="458" width="340" height="74" rx="22" ${cardStyle}/>
  <circle cx="762" cy="495" r="17" fill="${BRAND}"/>
  <path d="M 754 495 l 6 6 l 11 -12" fill="none" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
  ${bar(796, 480, 150, 0.45)}${bar(796, 502, 100, 0.2)}`;
}

/* 3. After hours: a form arriving at night, under a crescent moon. */
function afterHours() {
  const stars = [[610, 130, 3], [690, 210, 2], [980, 110, 2.5], [1060, 230, 2], [930, 190, 1.5], [1100, 400, 2], [560, 300, 2]]
    .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#ffffff" fill-opacity="0.55"/>`).join('');
  return `
  ${stars}
  <defs><mask id="moon"><rect width="${W}" height="${H}" fill="#000"/><circle cx="820" cy="190" r="92" fill="#fff"/><circle cx="860" cy="160" r="82" fill="#000"/></mask></defs>
  <rect width="${W}" height="${H}" fill="${SOFT}" mask="url(#moon)"/>
  <rect x="640" y="330" width="380" height="200" rx="24" ${cardStyle}/>
  <circle cx="676" cy="368" r="7" fill="${BRAND}"/>
  ${bar(696, 362, 120, 0.4)}
  <rect x="930" y="356" width="62" height="24" rx="12" fill="${BRAND}" fill-opacity="0.18" stroke="${BRAND}" stroke-opacity="0.5"/>
  <line x1="640" y1="402" x2="1020" y2="402" stroke="#ffffff" stroke-opacity="0.08"/>
  ${bar(668, 428, 250)}${bar(668, 456, 320, 0.14)}${bar(668, 484, 190, 0.14)}`;
}

/* 4. Lead response: a form card on the left sends a call to a phone on the right. */
function formToCall() {
  const cx = 960, cy = 315;
  let dots = '';
  for (let i = 0; i < 6; i++) dots += `<circle cx="${790 + i * 22}" cy="${cy}" r="${i === 5 ? 5 : 4}" fill="${BRAND}" fill-opacity="${0.25 + i * 0.13}"/>`;
  return `
  <rect x="520" y="185" width="250" height="260" rx="24" ${cardStyle}/>
  ${bar(552, 222, 120, 0.4)}
  <rect x="552" y="258" width="186" height="34" rx="10" fill="#ffffff" fill-opacity="0.05" stroke="#ffffff" stroke-opacity="0.1"/>
  <rect x="552" y="306" width="186" height="34" rx="10" fill="#ffffff" fill-opacity="0.05" stroke="#ffffff" stroke-opacity="0.1"/>
  <rect x="552" y="378" width="186" height="38" rx="12" fill="${BRAND}"/>
  ${dots}
  <circle cx="${cx}" cy="${cy}" r="96" fill="${BRAND}" fill-opacity="0.12" stroke="${BRAND}" stroke-opacity="0.45" stroke-width="1.5"/>
  <circle cx="${cx}" cy="${cy}" r="62" fill="url(#card)" stroke="#ffffff" stroke-opacity="0.16" stroke-width="1.5"/>
  <path d="M ${cx - 22} ${cy - 24} q -6 6 0 18 q 14 26 38 38 q 12 6 18 0 l 6 -8 q 2 -4 -2 -7 l -12 -8 q -4 -2 -7 1 l -5 5 q -14 -7 -21 -21 l 5 -5 q 3 -3 1 -7 l -8 -12 q -3 -4 -7 -2 z" fill="${SOFT}"/>`;
}

/* 5. Follow-up: a three-step sequence (call, message, call) ending in a booking. */
function followUpSteps() {
  const x = 700, ys = [150, 260, 370, 480];
  const step = (y, i) => {
    const last = i === ys.length - 1;
    return `
  <circle cx="${x}" cy="${y}" r="20" fill="${last ? BRAND : '#0a0a0a'}" stroke="${last ? BRAND : '#ffffff'}" stroke-opacity="${last ? 1 : 0.3}" stroke-width="2"/>
  ${last ? `<path d="M ${x - 8} ${y} l 6 6 l 11 -12" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>` : `<circle cx="${x}" cy="${y}" r="6" fill="#ffffff" fill-opacity="0.5"/>`}
  <rect x="${x + 44}" y="${y - 34}" width="${last ? 300 : 260}" height="68" rx="18" ${last
    ? `fill="${BRAND}" fill-opacity="0.16" stroke="${BRAND}" stroke-opacity="0.55" stroke-width="1.5"`
    : cardStyle}/>
  ${bar(x + 70, y - 12, last ? 170 : 150, last ? 0.45 : 0.32)}${bar(x + 70, y + 10, last ? 110 : 90, 0.14)}`;
  };
  return `
  <line x1="${x}" y1="${ys[0]}" x2="${x}" y2="${ys[ys.length - 1]}" stroke="#ffffff" stroke-opacity="0.14" stroke-width="2" stroke-dasharray="6 8"/>
  ${ys.map(step).join('')}`;
}

/* 6. Consent: a form with an unmissable ticked checkbox next to its text. */
function consentForm() {
  return `
  <rect x="580" y="130" width="460" height="370" rx="26" ${cardStyle}/>
  ${bar(616, 170, 160, 0.4)}
  <rect x="616" y="208" width="388" height="40" rx="10" fill="#ffffff" fill-opacity="0.05" stroke="#ffffff" stroke-opacity="0.1"/>
  <rect x="616" y="262" width="388" height="40" rx="10" fill="#ffffff" fill-opacity="0.05" stroke="#ffffff" stroke-opacity="0.1"/>
  <rect x="616" y="330" width="34" height="34" rx="8" fill="${BRAND}"/>
  <path d="M 624 347 l 7 7 l 13 -14" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
  ${bar(668, 332, 300, 0.3, 10)}${bar(668, 352, 250, 0.16, 10)}${bar(668, 372, 180, 0.16, 10)}
  <rect x="616" y="420" width="388" height="46" rx="14" fill="${BRAND}" fill-opacity="0.85"/>`;
}

const banners = {
  'lead-response-time.png': frame(stopwatch(), 800, 330),
  'first-call-questions.png': frame(conversation(), 830, 320),
  'after-hours-leads.png': frame(afterHours(), 830, 300),
  'lead-response-guide.png': frame(formToCall(), 820, 315),
  'follow-up-with-leads.png': frame(followUpSteps(), 860, 315),
  'express-written-consent.png': frame(consentForm(), 810, 315),
};

(async () => {
  for (const [name, svg] of Object.entries(banners)) {
    const file = path.join(out, name);
    await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(file);
    console.log('wrote', file);
  }
})();
