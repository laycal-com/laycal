# Laycal — Landing Page Redesign Brief

## The product

**Laycal** (laycal.com) is an AI voice cold-calling platform for B2B sales teams. Users upload a lead list (CSV or Google Form), configure an AI voice agent, and the platform dials hundreds of prospects simultaneously, qualifies them, handles objections, and books appointments straight into Google Calendar.

**Positioning:** "Enterprise-grade outbound calling at startup prices." Explicitly positioned as the cheaper, simpler alternative to **JustCall** and **Nooks**.

**Audience:** Sales leaders, SDR managers, founders at startups/SMBs, and agencies. People who currently pay for seat-based dialers or hire SDRs.

**Primary conversion goal:** Sign up for the free trial (1 assistant + 5 calls, no credit card).
**Secondary:** Book a demo call (Calendly).

---

## What exists today

One file: `src/app/page.tsx` — **1,672 lines**, a single client component. Everything is inline: nav, all 14 sections, all copy, all data arrays. No section components exist (`src/components/landing/` is an empty directory).

### Current design system

| Token | Value |
|---|---|
| Primary blue (dark) | `#1e40af` |
| Primary blue (bright) | `#3b82f6` |
| Success green | `#10b981` |
| Orange accent | `#f97316` |
| Purple accent | `#8b5cf6` |
| Red / danger | `#ef4444`, `#dc2626` |
| Yellow CTA | `yellow-400 → yellow-500` |
| Heading text | `#1f2937` |
| Body text | `#64748b` |
| Borders | `#e2e8f0` |
| Surfaces | `#ffffff`, `#f8fafc` |

**Type:** default system/Geist stack, no custom typeface. H1 `text-5xl lg:text-6xl font-bold`, H2 `text-4xl font-bold` and almost always centered + `text-[#1e40af]`. Body `text-xl text-[#64748b]`.

**Layout:** every section is `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` with `py-24`. Cards are `rounded-2xl p-6/p-8 shadow-lg border-2 border-[#e2e8f0]`.

**Motion:** Framer Motion via `LazyMotion`. Near-universal pattern — every element fades in from `y: 50` on scroll into view, cards lift on hover (`y: -10, scale: 1.02`), buttons have a skewed white gradient "shine" sweep.

### Section-by-section inventory (in order)

1. **Nav** — Solid `#1e40af` blue bar, 80px tall, white logo. Links: Features, Pricing, Why Laycal?, How It Works, Results, FAQ (all smooth-scroll anchors). Right side: Login + Sign Up (Clerk). Switches from `relative` to `fixed` after 50px of scroll.

2. **Hero** — Two columns on a `white → blue-50/30 → white` gradient.
   - H1: "Scale Your Sales Calls to **500+ Simultaneous** Conversations"
   - Eyebrow: "The #1 JustCall & Nooks Alternative"
   - Sub: "Transform your lead list into a 24/7 AI-powered calling machine. Enterprise-grade features at startup prices — no more overpriced alternatives."
   - A green "LIVE:" ticker box with a pinging dot: "Currently making 1,247 calls across 15 countries"
   - CTAs: gradient blue "Start Free Trial - 1 Assistant + 5 Calls Free" + outlined "Schedule a Demo Call"
   - Right: a **hand-built fake dashboard mockup** — white card, three pinging traffic-light dots, a 2×3 grid of "Call #1–6" tiles, a summary panel.

3. **Social proof bar** — Four grayscale client logos at 60% opacity, plus two animated counters: "847 calls completed today" and "99.9% uptime guaranteed".

4. **Problem / Solution** — H2 "From One Call at a Time to Hundreds Simultaneously". Two 256×256 photos side by side: a stressed caller (red callout: "1 caller × 8 hours = 80 calls max") vs. a relaxed person (green callout: "500 simultaneous calls × 24/7 = 12,000 calls/day").

5. **ROI Calculator** — "Calculate Your Savings". Interactive component (`src/components/ui/roi-calculator.tsx`) with sliders.

6. **How It Works** — 3 cards: Upload Leads & Create AI Caller (📄) → Launch Call Campaign (📞) → Monitor Results & Scale (📊).

7. **Live Call Monitoring** — Full-bleed solid `#1e40af`. "Command Center: Watch Your AI Army in Action". Left: glassmorphic panel with a monospace scrolling ticker (`CONNECTED: Lead #1247 • DIALING: Lead #1248 …`) and a static world-map image. Right: 6 green-checkmark bullets.

8. **Metrics** — 4 cards: "500 calls in minutes" (Volume 🚀), "Perfect script every time" (Consistency 🎯), "All time zones simultaneously" (Coverage 🌍), "$0.07/minute total cost" (Cost 💰).

9. **Features** — 6 cards in a 3-col grid: Bulk Call Launcher 🚀, Real-Time Dashboard 📊, Call Recording Hub 🎙️, Performance Analytics 📈, Multi-Provider Setup 🌐, AI Voice Customization 🤖.

10. **Results** — 3 stat cards: Real Estate "2,000 leads → 340 qualified" (+340%), Insurance "85% answer rate" (+270%), B2B Sales "$47/lead cost" (83% cost reduction).

11. **Comparison** — The visual centerpiece. Blue gradient background with three blurred pulsing white orbs. "⚡ Laycal vs JustCall vs Nooks" at `text-5xl`. A large white/95 backdrop-blur table, 8 rows (Massive Call Power, Pricing That Makes Sense, Prompt Builder Control, Ease of Use, Google Calendar Integration, Reliability, Customer Support, Value for Money), Laycal column highlighted. Below: a "🔥 Bottom Line:" glass panel with 3 sub-cards, then a **yellow** CTA button carrying a pulsing red "1,247 users online" pill.

12. **SEO block** — Two gray boxes ("🚀 Best JustCall Alternative" / "💎 Best Nooks Alternative") with ✅ bullet lists, then a blue box with keyword pills. Written for crawlers, reads like it.

13. **Pricing** — 3 cards: Free Trial (Free / 30 days), **Pay-as-you-go ($25 initial — "Most Popular", green border)**, Enterprise (Custom). Prices are fetched live from `/api/pricing` with hardcoded fallbacks. Below: a "How It Works" 3-step billing explainer.

14. **Trust** — 3 emoji items: 🛡️ SOC 2 Compliant, ⚡ 99.9% Uptime, 🔒 Data Encryption.

15. **FAQ** — 6 accordion items, `+`/`−` toggle.

16. **Final CTA** — Blue gradient + blurred orbs. "Ready to Make 1,000 Calls Before Lunch?" Two buttons.

17. **Footer** — Dark. Product / Resources / Company columns, Facebook + LinkedIn + YouTube icons, "© 2026 Laycal".

---

## What's wrong with it (the redesign target)

The page converts on *argument* — the comparison table and pricing are genuinely strong. It fails on *credibility signalling*. It reads like a high-effort template, not a product a company would trust with its outbound pipeline.

Specific problems, roughly in order of damage:

1. **Emoji are the entire icon system.** 🚀📊🎙️📈🌐🤖🛡️⚡🔒💰🌍🎯 appear in headings, cards, table cells, and buttons. Single biggest thing making the page read as cheap. Needs a real icon set (lucide-react is already installed) or custom line icons.

2. **Rainbow accents.** Blue, green, orange, purple, red, and yellow all carry semantic weight simultaneously. No hierarchy — everything shouts. Premium products use one accent and a lot of restraint.

3. **Uniform card soup.** Sections 6, 8, 9, 10, 13, 14 are all the same thing: centered H2 → grid of white rounded cards with a border, an icon, a bold title, gray body. Six times in a row. No rhythm, no variation in density or scale.

4. **Heavy borders + heavy shadows everywhere.** `border-2` plus `shadow-lg` on every card creates visual noise. Premium reads as: hairline borders, subtle elevation, generous whitespace.

5. **Motion is monotonous.** Literally everything does the same fade-up-50px. It should be quieter and more selective — and honestly, less of it.

6. **The hero mockup is hand-drawn divs.** Six fake "Call #N" tiles. It doesn't look like the real product, which is a wasted opportunity — the actual dashboard is the proof.

7. **Placeholder assets are shipping.** The four "client logos" are literally `0x0.png`, `images.png`, `images (1).png`, `images (2).png`. `public/assets/` still contains files named "Founder Story Image Placeholder", "Performance Dashboard Placeholder", etc.

8. **Manufactured urgency undermines the premium goal.** The "LIVE: 1,247 calls" counter is `Math.random()` incrementing in a `setInterval`. The "1,247 users online" pill is a hardcoded string. A pulsing red badge on a yellow button is the aesthetic of a Black Friday popup.

9. **Centered everything.** Almost every H2 is centered `text-4xl font-bold text-[#1e40af]`. Consistent, but flat and tiring over 14 sections.

10. **No dark mode / no depth.** Pure white with pale blue-gray gradients. `next-themes` is installed but the landing page ignores it.

> ⚠️ Two claims to review with the redesign, independent of visuals: the page asserts **SOC 2 compliance**, and the JSON-LD embeds an `aggregateRating` of **4.9 from 127 ratings**. If neither is backed by a real audit / real reviews, they're a legal and Google-penalty risk respectively. Worth resolving while you're rewriting the page anyway.

---

## What "premium" should mean here

The buyer is a sales leader deciding whether to trust software with their pipeline. Aim for the confidence of **Linear, Vercel, Attio, Retell AI, or Bland.ai** — not "SaaS landing page template".

Direction to pursue:

- **One accent color**, used sparingly. Consider a dark-first palette (near-black `#0A0A0B` surfaces with a single electric accent) — voice-AI products land well in dark, and it would instantly differentiate from JustCall's corporate blue.
- **A real typeface.** Tight, confident display type for headlines (Inter Tight / Geist / Söhne-adjacent), high contrast against small, calm body copy. Bigger H1, smaller supporting text.
- **Hairline borders, minimal shadow, more whitespace.** Let sections breathe instead of filling every pixel with a bordered card.
- **A real icon system** — consistent stroke weight, monochrome, no emoji anywhere.
- **Vary the section rhythm.** Alternate full-bleed dark sections against light ones; mix a wide hero-scale moment with a dense comparison table and a quiet three-line trust strip. Not six identical card grids.
- **Show the product.** Real screenshots or a short loop of the actual call dashboard beats a div mockup. A live audio waveform / call-transcript animation would sell "voice AI" better than anything currently on the page.
- **Earn credibility instead of faking it.** Named customer logos, one real quoted testimonial, or a concrete verifiable number beats a random-walk counter.
- **Restrained motion.** Slow, subtle, staggered. One or two signature moments (a waveform, a call connecting) rather than 40 fade-ups.

### Sections worth keeping structurally
The **comparison table** and the **ROI calculator** are the strongest conversion assets — keep both, just restyle. The **before/after** contrast is a good idea executed with weak stock photos; keep the concept, replace the execution.

---

## Technical constraints for the redesign

- **Next.js 15** (App Router) + **React 19**, TypeScript.
- **Tailwind CSS 4** + **shadcn/ui** (`src/components/ui/`) — already has button, card, badge, input, select, slider, progress, checkbox, textarea, animated-counter, roi-calculator.
- **Framer Motion 12** via `LazyMotion` + `domAnimation` (keep — it's a perf choice).
- **lucide-react** already installed and available for icons.
- **GSAP + Three.js** are installed and used elsewhere on the site (`Advanced3DScene`, `ThreeBackground`, `ParticleExplosions`) — available if a 3D/particle hero moment is wanted, but they're heavy.
- **Clerk** auth: sign-up CTAs must remain `<SignInButton>` wrappers, and every CTA needs both a `<SignedOut>` and `<SignedIn>` variant.
- **Pricing is dynamic** — fetched from `/api/pricing`, must stay driven by the `pricing` state object, not hardcoded.
- **Nav must stay in `page.tsx`** — the global `ConditionalNavbar` deliberately returns `null` on `/`.
- Preserve the two **JSON-LD** blocks and the heading keyword structure; the site gets meaningful SEO traffic from "JustCall alternative" / "Nooks alternative" queries and there are sibling landing pages (`/justcall-alternative`, `/nooks-alternative`, `/speed-to-lead`, `/sdr`) that should stay visually consistent with whatever you land on.
- **Strongly recommended:** split the 1,672-line page into `src/components/landing/` section components (`Hero.tsx`, `ComparisonTable.tsx`, `PricingCards.tsx`, …). The empty directory is already there.

---

## Deliverable requested

A redesigned landing page — same sections and same messaging, radically elevated visual execution. Prioritize: hero, comparison section, and pricing. Those three carry the conversion.
