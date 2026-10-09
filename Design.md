# Laycal Design Plan

Status: plan only. No code has been written or changed for this document.
Written 2026-10-09. Scope: all public pages, auth pages, and the user portal. The admin area (`/admin/*`) is out of scope.

Items marked **[confirm]** are things to verify at implementation time (licences, exact install names) rather than facts checked while writing this plan.

---

## 0. Where we are starting from

Measured in the repo today:

| Area | Current state |
|---|---|
| Landing `/` | Dark editorial theme (`page.tsx` 1,073 lines, `landing.css`, `components/landing/*`), GSAP reveals, two canvas visuals. 145 inline `style={{}}` blocks. |
| Other public pages | Old light design, 9 pages, heavy multi-hue gradients (`speed-to-lead` 18, `instant-lead-follow-up` 16, `nooks-alternative` 9). Most still carry self-serve signup CTAs. |
| Auth | Bare `<SignIn />` / `<SignUp />` centred on `bg-gray-50`. No theming at all. |
| Portal | Fixed white top navbar built with inline styles; pages use raw Tailwind hues. |
| Colour usage | 509 `blue-*`, 203 `green-*`, 119 `red-*`, 113 `purple-*`, 93 `yellow-*`, 37 `orange-*` utility classes, plus three different "brand blues" in hex (`#3b82f6` ×107, `#1e40af` ×44, `#2563eb` ×21, `#2d6aff` on the landing). |
| Theming | shadcn tokens exist in `globals.css` (neutral base, light and dark) but are bypassed: `ThemeProvider` is `forcedTheme="light"`, and `globals.css` forces `body` white with `!important`. |
| Motion libraries | `framer-motion` 12, `gsap`, `three`. Six legacy 3D/GSAP components are imported only by `/sdr`. |
| Charts | Hand-rolled SVG in `components/dashboard/charts.tsx` (543 lines). |
| Fonts | Geist Sans and Geist Mono via `next/font`. |

The core problem is not a lack of effects. It is that there is no single system: three blues, six accent hues, two themes fighting through `!important`, and three animation libraries. This plan fixes the system first and then adds motion on top of it.

---

## 1. Design principles

1. **Monochrome first, one accent.** Every surface is black, white, or a neutral grey. Laycal blue is the only hue, and it marks exactly one thing per view: the primary action or the live data.
2. **Depth from light, not from colour.** Premium comes from hairline borders, soft inner highlights, grain, masks and glow, not from coloured fills.
3. **Motion has a job.** Each animation either reveals structure (scroll), confirms an action (press, hover), or shows that the system is live (calls in flight). Nothing loops purely for decoration in the portal.
4. **One signature moment per screenful.** A page may have several Aceternity set pieces, but never two competing in the same viewport.
5. **The product is the hero.** Marketing visuals are real product screens, not stock illustrations or abstract 3D.
6. **Marketing performs, the portal works.** Public pages are expressive. The portal uses the same tokens and feel but motion is short, quiet and never blocks a task.
7. **Lead with value.** Copy states what Laycal does. Competitor names stay confined to the FAQ, footer compare links, the comparison table, and the two `-alternative` pages.
8. **Invite-only stays intact.** Every acquisition CTA goes to `DEMO_URL` (`src/lib/links.ts`). `/sign-up` is never linked publicly but stays mounted and styled, because Clerk invitations land there.

---

## 2. Colour system

### 2.1 Neutral scale

Pure neutral, no blue or slate tint. This matches the shadcn `neutral` base already configured in `components.json`.

| Token | Hex | Dark-theme role | Light-theme role |
|---|---|---|---|
| `neutral-0` | `#FFFFFF` | Primary text on accent | Page background |
| `neutral-50` | `#FAFAFA` | Headline text | Subtle surface |
| `neutral-100` | `#F5F5F5` | — | Muted surface |
| `neutral-200` | `#E5E5E5` | Body text (strong) | Border |
| `neutral-300` | `#D4D4D4` | Body text | Strong border |
| `neutral-400` | `#A3A3A3` | Secondary text | Placeholder |
| `neutral-500` | `#737373` | Tertiary text, captions | Secondary text |
| `neutral-600` | `#525252` | Disabled text | Body text |
| `neutral-700` | `#404040` | Strong border | — |
| `neutral-800` | `#262626` | Border | Body text (strong) |
| `neutral-900` | `#171717` | Raised surface | Headline text |
| `neutral-925` | `#111111` | Card surface | — |
| `neutral-950` | `#0A0A0A` | Sunken surface | — |
| `neutral-1000` | `#000000` | Page background | Primary button |

On dark, borders are written as white alpha so they sit correctly over any surface: `white/8` default, `white/12` hover, `white/16` strong.

### 2.2 Accent

One brand blue replaces the four currently in use.

| Token | Hex | Use |
|---|---|---|
| `accent` | `#2D6AFF` | Primary button fill, active nav indicator, focus ring, chart series 1, links |
| `accent-hover` | `#4A80FF` | Hover state of accent fills |
| `accent-text` | `#6FA8FF` | Accent-coloured *text* on black (the base accent is only about 4.6:1 on black) |
| `accent-subtle` | `#2D6AFF` at 12% | Selected row, active nav background, badge fill |
| `accent-glow` | `#2D6AFF` at 25–40% | Blurred glow behind one focal element |

`#2D6AFF` is the value the current landing page uses and is the most recent deliberate choice. If the intended brand colour is the older `#3B82F6`, only this table changes. White text on `#2D6AFF` is about 4.5:1, right at the AA threshold, so button labels use weight 500+ and at least 14px; verify with a contrast checker when tokens land.

### 2.3 Status colours

Status is information, not brand, so it is the one exception to "single accent". Each appears only as a small dot, a text label, or a 12%-alpha badge. Never as a card fill, a gradient or an illustration colour.

| Meaning | Hex | Examples |
|---|---|---|
| Success | `#22C55E` | Booked, answered, connected |
| Warning | `#F59E0B` | Low balance, reconnect calendar |
| Danger | `#EF4444` | Failed call, destructive action |

"Calling / in progress" uses the accent, not a fourth colour.

### 2.4 Gradient rules

Allowed:
- **Neutral fades**: black to transparent, used as masks and edge feathering.
- **Single-hue accent glow**: accent to transparent, blurred, one per viewport.
- **Text sheen**: white to `neutral-400` vertical gradient on large display headlines only.
- **Hairline highlights**: a 1px white-alpha gradient on the top edge of a card.

Banned:
- Any gradient between two hues (blue to purple, yellow to orange, and so on).
- Gradient fills on buttons, cards, badges, stat tiles or icons.
- Coloured section backgrounds. Sections separate by spacing, a hairline, or a change of neutral step.

Aceternity components ship with colourful defaults (indigo/purple beams, cyan/violet waves, multi-colour globe arcs). Every adopted component is recoloured to white plus accent before it is considered done.

### 2.5 Themes

- **Public and auth pages**: dark only.
- **Portal**: theme-aware through the existing `next-themes` setup, dark by default, light available from the user menu. Both token sets already exist in `globals.css`; they need the values above, not new plumbing.

Implementation notes for later: remove `forcedTheme="light"`, remove the `body:not(:has(.lc))` and `.dark` `!important` rules, and map everything through the shadcn semantic tokens (`background`, `card`, `border`, `muted-foreground`, `primary` = accent, `chart-1…5`). Raw hue utilities (`blue-600`, `gray-200`) are not used in new code.

---

## 3. Typography, spacing, radius, borders, shadows

### 3.1 Type

Geist Sans for everything, Geist Mono for numerals in data contexts, eyebrow labels and code. No third typeface.

| Style | Size / line height | Weight | Tracking | Use |
|---|---|---|---|---|
| Display XL | 72 / 76 (clamp from 40) | 600 | -0.04em | Landing hero |
| Display | 56 / 60 (clamp from 34) | 600 | -0.035em | Page heroes |
| H2 | 40 / 46 (clamp from 28) | 600 | -0.03em | Section titles |
| H3 | 24 / 32 | 600 | -0.02em | Card titles |
| H4 | 18 / 26 | 500 | -0.01em | Panel titles |
| Body L | 18 / 30 | 400 | 0 | Marketing paragraphs |
| Body | 15 / 24 | 400 | 0 | Portal default |
| Small | 13 / 20 | 400 | 0 | Table cells, helper text |
| Eyebrow | 12 / 16, uppercase, mono | 500 | +0.08em | Section labels |
| Metric | 32 / 36, mono, tabular-nums | 500 | -0.02em | KPI values |

Rules: headlines are left-aligned or centred but never coloured blue; marketing paragraphs cap at about 65 characters; numbers in tables and KPIs always use `tabular-nums`.

### 3.2 Spacing

4px base. Scale: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128, 160.

| Context | Value |
|---|---|
| Marketing section padding (vertical) | 128 desktop, 96 tablet, 64 mobile |
| Marketing content width | 1200 max, 24 gutter (16 on mobile) |
| Portal content width | 1440 max, 32 padding (16 on mobile) |
| Card padding | 24 (20 for dense panels) |
| Grid gap | 24 marketing, 16 portal |

### 3.3 Radius

| Token | Value | Use |
|---|---|---|
| `sm` | 6 | Badges, inputs inside dense tables |
| `md` | 10 | Buttons, inputs |
| `lg` | 14 | Cards, panels |
| `xl` | 20 | Marketing feature cards, modals |
| `2xl` | 28 | Hero frames, device mock-ups |
| `full` | — | Pills, the scrolled navbar, avatars |

### 3.4 Borders and elevation

On dark, elevation is a lighter surface plus a hairline, not a drop shadow.

| Level | Dark | Light |
|---|---|---|
| 0 Page | `#000` | `#FFF` |
| 1 Card | `#0A0A0A` + `white/8` border + 1px top inner highlight `white/6` | `#FFF` + `neutral-200` border + `0 1px 2px black/4` |
| 2 Raised (popover, dropdown) | `#111` + `white/12` border + `0 16px 48px black/60` | `#FFF` + border + `0 12px 32px black/10` |
| 3 Modal | `#111` + `white/12` border + backdrop `black/70` with 8px blur | same, backdrop `black/40` |

Other surface details:
- **Grain**: one 3–4% opacity noise layer on marketing page backgrounds to stop black from banding.
- **Grid / dot backdrop**: faint `white/5` grid behind hero and CTA sections, masked with a radial fade.
- **Focus**: 2px accent ring with 2px offset, on every interactive element, in both themes.

---

## 4. Motion and animation

### 4.1 Library

Standardise on **Motion** (`motion/react`, the renamed Framer Motion, which is what Aceternity components import). GSAP is retired once the current landing page is replaced; the six legacy Three/GSAP components go with it.

### 4.2 Timing and easing

| Token | Value | Use |
|---|---|---|
| `instant` | 100ms | Press feedback, toggles |
| `fast` | 180ms | Hover, tooltip, focus ring |
| `base` | 280ms | Dropdowns, tabs, sidebar expand |
| `slow` | 500ms | Modals, page-level reveals |
| `reveal` | 700ms | Marketing scroll reveals |
| `ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Anything entering |
| `ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | Anything moving between two states |
| `spring-ui` | stiffness 300, damping 30 | Sidebar, navbar resize, layout shifts |
| `spring-scroll` | stiffness 100, damping 30 | Smoothing scroll-linked values |

Exits run at about 70% of the entry duration.

### 4.3 What animates

| Pattern | Where | Spec |
|---|---|---|
| Scroll reveal | Marketing sections | Opacity 0→1, y 16→0, `reveal`, once only, stagger 60ms, max 6 children staggered |
| Scroll-linked set pieces | Hero Parallax, Container Scroll, MacBook Scroll | Driven by `useScroll`, smoothed with `spring-scroll` |
| Ambient loops | Beams, waves, globe arcs | Slow, low contrast, paused when off-screen |
| Hover | Cards, buttons, nav links | Border brightens `white/8`→`white/16`, optional 1.01 scale on marketing cards only, `fast` |
| Press | Buttons | Scale 0.98, `instant` |
| Number count-up | KPI values | 600ms, once on first view, not on every refetch |
| Chart draw | Area and bar charts | 500ms on first mount only |
| Layout | Sidebar, navbar, tabs underline | Shared-layout animation with `spring-ui` |
| Skeleton | Portal loading | Shimmer of `white/4`→`white/8`, 1.4s |

### 4.4 Restraint rules

1. Animate only `transform` and `opacity`. No animated `width`, `height`, `top`, `box-shadow` or `filter: blur` on large elements.
2. Reveals fire once. Nothing re-animates when scrolled back into view.
3. One scroll-linked set piece and at most one ambient canvas in the viewport at a time.
4. Maximum three heavy set pieces per page, one WebGL canvas per page.
5. No blanket `will-change`. The current landing page already proved that around 40 promoted layers make Chrome drop paints on lower sections.
6. In the portal: no scroll-linked animation, no ambient loops, nothing over 300ms except first-mount chart draws.
7. Every canvas and loop pauses through IntersectionObserver when off-screen and when the tab is hidden.
8. Motion never delays content. Text is readable at the first frame; reveals start from at least 0 opacity only for below-the-fold content.

### 4.5 Reduced motion

Wrap the app in `MotionConfig reducedMotion="user"`. Additionally, under `prefers-reduced-motion: reduce`:
- Scroll-linked set pieces render their end state as a static layout (Hero Parallax becomes a static three-row grid; Container Scroll shows the flat frame; MacBook Scroll shows the open laptop).
- Canvases render one static frame.
- Count-ups show the final number.

---

## 5. Public pages

### 5.1 Shared shell

A marketing layout (route group) replaces the per-page navbars and the pathname list in `ConditionalNavbar`.

| Part | Reference | Notes |
|---|---|---|
| Navbar | **Resizable Navbar** | Full width at top; shrinks into a floating blurred pill after ~100px. Links: How it works, Features, Pricing, Blog. Right side: "Log in" (text, `/sign-in`) and "Book a demo" (accent, `DEMO_URL`). Mobile: sheet menu. |
| Footer | **Footers** block | Four columns: Product, Solutions, Compare (`/justcall-alternative`, `/nooks-alternative`), Company and legal. Large low-contrast wordmark at the bottom. |
| Page background | Custom | Black, grain layer, optional masked grid. |

### 5.2 Landing page `/`

| # | Section | Reference component | Plan |
|---|---|---|---|
| 1 | Hero | **Hero Parallax** (top priority) | Eyebrow "Invite-only", display headline, one-line subhead, two CTAs (accent "Book a demo", ghost "See how it works"). Below, three rows of five product tiles that slide in opposite directions and settle from a tilted 3D pose as you scroll. Tiles are real product screens (see 5.5). A black-to-transparent fade sits behind the headline so text never fights the tiles. |
| 2 | Integrations strip | **Logo Clouds** block | "Works with" row: Google Calendar, Twilio, Plivo, Vonage, Google Forms. Monochrome marks at 60% opacity, full white on hover. Integration logos only, no invented customer logos. Reuses the marks in `landing/LogoMarks.tsx`. |
| 3 | Product reveal | **Container Scroll Animation** | Section title, then the dashboard screenshot rotates from tilted to flat as it scrolls into view. Single accent glow beneath the frame. |
| 4 | How it works | Custom (Motion) | Three steps: form submitted, call placed in seconds, visit booked. Sticky left column with step titles; right column swaps a small live-looking panel per step. Collapses to a stacked list on mobile. |
| 5 | Scale | **GitHub Globe** | "500 concurrent calls." Globe on the right with white arcs and accent pulse points, copy and three mono-numeral stats on the left. Replaces the current `CallMap` canvas. Desktop only; mobile gets a static render. |
| 6 | Features | Custom bento grid (Aceternity Bento Grid is a candidate, outside the supplied list) | Six cells of mixed size: trade-specific qualifying, live calendar booking, call summaries and recordings, CSV and form intake, multi-provider numbers, analytics. Each cell holds a small product fragment, not an icon. |
| 7 | ROI calculator | Existing `RoiCalc`, restyled | Sliders in neutral with accent thumb; result in Metric type. Depends on the pricing value in `SystemSettings` being corrected, otherwise it shows the wrong economics. |
| 8 | Results | Custom | One large quote plus three stat tiles. Neutral only. |
| 9 | Pricing | **Background Beams with Collision** behind the section header | Plan cards on Level-1 surfaces; the recommended plan gets the accent border and nothing else. Beams recoloured to white with accent collision sparks, confined to the header band so they do not run behind prices. |
| 10 | Comparison table | Custom table | Kept as evidence. Neutral rows, accent tick for Laycal column only. |
| 11 | FAQ | shadcn Accordion | Two-column on desktop: title left, accordion right. |
| 12 | Closing CTA | **Wavy Background** | Headline, one sentence, "Book a demo". Waves in white at low alpha with one accent strand. Replaces `SignalFlow`. |
| 13 | Footer | **Footers** block | Shared. |

Heavy pieces on this page: Hero Parallax, Container Scroll, Globe (the one WebGL canvas). Beams and waves are light 2D effects and never share a viewport with the others.

### 5.3 Other public pages

Three templates cover every remaining page.

**Template A: solution page.** Used by `/features`, `/speed-to-lead`, `/instant-lead-follow-up`, `/sdr`.

| Section | Reference |
|---|---|
| Hero | **Hero Sections** (free set): centred headline over a masked grid, product frame below |
| Product walkthrough | `/features` only: **MacBook Scroll**, with the dashboard emerging from the laptop screen. The other three pages use a static framed screenshot so MacBook Scroll stays a one-page moment. |
| Benefit grid | Bento cells from the landing page |
| Proof | Stat row or quote |
| CTA | Shared closing CTA band (static grid backdrop, not waves, to keep waves unique to the landing page) |

**Template B: comparison page.** Used by `/justcall-alternative`, `/nooks-alternative`. Simple Hero Sections variant, comparison table, three differentiator cards, FAQ, CTA band. Competitor naming is expected here. These pages earn search traffic, so headings, copy structure and metadata are preserved.

**Template C: content page.** Used by `/blogs`, `/blogs/[slug]`, `/privacy`, `/terms`.
- Blog index: card grid, cover image with neutral overlay, hover brightens border and slides an accent arrow in.
- Article: 680px reading column, Body L, sticky table of contents on desktop (existing `TableOfContents`), prose tokens for headings, code and quotes. No scroll effects besides a top reading-progress hairline.
- Legal: same reading column, no motion.

**Individual pages.**

| Page | Plan |
|---|---|
| `/pricing` | Landing pricing section expanded: plan cards, usage explainer, FAQ, CTA band. Beams with Collision in the header band. |
| `/contact` | **Contact Sections** block: form on the left, **World Map** on the right with arcs between the service regions. This is the World Map's one use. |
| `/about` | Hero Sections variant, short story, values as three plain cards, CTA band. |
| `/case-studies` | Card grid in the blog index style; each card leads with one metric in Metric type. |
| `/status` | Minimal: system list with status dots. No set pieces. |

All of these replace their self-serve signup buttons with `DEMO_URL` as part of the rebuild.

### 5.4 Set-piece allocation

Each signature component has one home, so no effect is seen twice.

| Component | Used on |
|---|---|
| Hero Parallax | `/` hero |
| Container Scroll Animation | `/` product reveal |
| GitHub Globe | `/` scale section |
| Background Beams with Collision | Pricing header (`/` and `/pricing`) |
| Wavy Background | `/` closing CTA |
| MacBook Scroll | `/features` |
| World Map | `/contact` |
| Hero Sections (free) | All secondary page heroes |
| Resizable Navbar, Footers, Logo Clouds | Shared shell |

### 5.5 Imagery

Hero Parallax needs about 15 tiles and the scroll set pieces need large screenshots. The current `public/assets` images are placeholders and the current portal is the thing being called cheap, so:

- Tiles and screenshots are captured from the **redesigned** portal in dark theme at 2x, with seeded demo data (no real customer names, numbers or transcripts).
- Until the portal phase is done, the landing page is built against interim captures and re-shot once. This is called out in the phases in section 11.
- Suggested 15 tiles: dashboard overview, trend chart close-up, leads table, lead detail, call summary, recording player, appointments list, appointment detail, assistant wizard (trade step), assistant wizard (calendar step), browser test call, integrations, intake endpoint panel, phone numbers, balance and plan.
- Format AVIF with WebP fallback through `next/image`; tiles about 1200px wide, under 120KB each.

---

## 6. Auth pages

### 6.1 Target

The **Login & Signup Sections** look: split screen. Left, the form on black. Right, a quiet brand panel (masked grid, one accent glow, a product frame and a single quote). On mobile the right panel is dropped.

### 6.2 Clerk feasibility

| Approach | What it gives | Cost and risk | Verdict |
|---|---|---|---|
| **A. Appearance API** on the prebuilt `<SignIn />` / `<SignUp />` | Our own page layout around Clerk's card; full control of colours, fonts, radius, borders, button and input styling through `appearance.variables` and `appearance.elements` (Tailwind classes), dark base theme from `@clerk/themes` | Low. Clerk still owns every flow: invitation tickets, email codes, OAuth, MFA, errors, lockouts. Internal DOM structure of the card cannot be rearranged. | **Recommended** |
| **B. Clerk Elements** (`@clerk/elements`) | Unstyled primitives with our own markup, so the Aceternity block can be matched almost exactly | Medium. It has been a beta package; its status and compatibility with our Clerk version need checking before relying on it. **[confirm]** | Fallback only if A cannot get close enough |
| **C. Fully custom flows** (`useSignIn` / `useSignUp`) | Total control | High. We would re-implement every step and state, including the `__clerk_ticket` invitation flow that the whole invite-only model depends on. A mistake locks invited customers out. | Rejected |

Plan with approach A:
- The page shell (split layout, brand panel, headline above the form, legal links) is ours and follows the Aceternity block.
- Clerk's card is made visually invisible (transparent background, no shadow, no border) so its fields read as part of our layout.
- Inputs, primary button, social buttons, divider, links and error text are mapped to our tokens.
- Clerk's own header is hidden; our headline replaces it ("Welcome back" / "Accept your invitation").
- `/sign-up` shows invitation-specific copy and no link to it exists anywhere public. `/sign-in` shows no "Sign up" footer link (hidden through appearance), since signup is restricted.
- The same appearance object is passed once at `ClerkProvider` so `UserButton` and the profile modal in the portal match automatically.

Expected result: about 90% of the reference look, with no auth logic touched.

---

## 7. User portal

Pages in scope: `/dashboard`, `/leads`, `/assistants`, `/appointments`, `/call-summary/[leadId]`, `/integrations`, `/settings`, `/support`, `/select-plan`.

### 7.1 Shell

An app layout (route group) replaces the fixed top navbar.

| Part | Reference | Plan |
|---|---|---|
| Sidebar | **Aceternity Sidebar** | Collapsed 64px icon rail, expanded 264px with labels. Mobile: full-height overlay opened from a top bar. |
| Top bar | shadcn blocks (`dashboard-01` as the layout reference) | 56px. Left: breadcrumb / page title. Right: credit balance chip, support unread indicator, theme toggle, Clerk `UserButton`. |
| Content | — | 1440 max width, 32 padding, page header (title, one-line description, primary action) then content. |

Sidebar behaviour: Aceternity's default expands on hover, which shifts content every time the pointer crosses it. For a tool used all day, the plan is a **pinned toggle**: the user clicks to expand or collapse, the choice persists, and hover only shows tooltips on the collapsed rail. The expand animation and visual style stay as in the reference.

Navigation groups:

| Group | Items |
|---|---|
| Overview | Dashboard |
| Pipeline | Leads, Appointments |
| Agents | Assistants, Integrations |
| Account | Settings, Support |
| Footer of sidebar | Balance summary (collapsed: icon with warning dot when low), user menu |

Active item: `accent-subtle` background, white text, 2px accent bar on the left that slides between items with a shared-layout animation.

### 7.2 Dashboard layout

Data comes from the existing `/api/dashboard/stats` endpoint (gap-free daily buckets, up to 90 days), so no backend change is implied.

```
┌───────────────────────────────────────────────────────────────┐
│ Page header: "Dashboard"            [7d | 30d | 90d]  [+ New] │
├───────────────┬───────────────┬───────────────┬───────────────┤
│ Leads         │ Calls placed  │ Answer rate   │ Visits booked │  KPI row
│ value  delta  │ value  delta  │ value  delta  │ value  delta  │  (sparkline in each)
├───────────────┴───────────────┴───────┬───────┴───────────────┤
│ Activity (area chart, 2/3 width)      │ Call outcomes (donut) │
│ leads / calls / booked                │ + legend list         │
├───────────────────────────────────────┼───────────────────────┤
│ Recent calls (table, 2/3 width)       │ Upcoming visits (list)│
├───────────────────────────────────────┼───────────────────────┤
│ Performance by assistant (bar list)   │ Balance and plan      │
└───────────────────────────────────────┴───────────────────────┘
```

Tablet: the right column drops below the left. Mobile: single column, KPI row becomes a 2×2 grid.

A new account with no data sees the getting-started checklist in place of the chart row, not empty charts.

### 7.3 Charts

Adopt **shadcn charts** (Recharts) so charts share tokens with everything else.

| Chart | Reference | Spec |
|---|---|---|
| Activity | **Area Chart, interactive** | Three series maximum. Series 1 accent with a vertical accent-to-transparent fill (the one permitted "gradient", single hue). Series 2 white at 70%, series 3 `neutral-500`; these two are lines with no fill. Monotone curve, 1.5px stroke, horizontal grid lines only at `white/6`, no axis lines, mono tick labels. |
| Call outcomes | shadcn Pie / Donut | Booked accent, answered white, no answer `neutral-500`, failed `neutral-700`. Total in the centre in Metric type. |
| By assistant | shadcn Bar (horizontal) | Neutral track, accent bar for the top row only, white for the rest. |
| KPI sparkline | Keep existing custom `Sparkline` | Too small to justify a chart library instance per card. |
| KPI count-up | Keep existing `CountUp` | — |

Chart colours come from `--chart-1…5`, redefined as accent plus four neutral steps. The current multi-hue chart tokens are removed. Tooltips use the Level-2 surface. Every chart has a text summary for screen readers and an empty state.

`TrendChart`, `DonutChart` and `BarList` in `components/dashboard/charts.tsx` are replaced; `Sparkline` and `CountUp` stay.

### 7.4 Cards, tables, forms

**Cards.** Level-1 surface, 14 radius, 24 padding (20 dense). Header row: H4 title left, optional action right. No coloured or gradient stat tiles. A KPI card is: eyebrow label, Metric value, delta badge (success or danger text with an arrow, neutral when flat), sparkline.

**Tables.** shadcn Table with TanStack Table for `/leads` (sorting, filtering, pagination, row selection).
- Header: Eyebrow style, sticky, `white/4` background.
- Rows: 52px, hairline divider, hover `white/3`, selected `accent-subtle`.
- Status: a dot plus label, never a filled coloured pill.
- Numbers right-aligned, mono, tabular.
- Row actions in a dropdown at the row end; bulk actions appear in a bar above the table when rows are selected.
- Mobile: tables become stacked cards rather than scrolling horizontally, except where column comparison matters.

**Forms.** Inputs 40px high, `white/4` fill, `white/10` border, accent focus ring. Labels above fields, helper text below in Small. Long forms (assistant wizard, settings) use a left-hand step or section list on desktop.

**Buttons.**

| Variant | Style | Use |
|---|---|---|
| Primary | Accent fill, white text | One per view |
| Secondary | White fill, black text (dark theme) | Strong non-primary action |
| Outline | Transparent, `white/12` border | Default action |
| Ghost | No border, hover `white/6` | Toolbars, row actions |
| Destructive | Danger text, danger border; filled only inside a confirm dialog | Delete, cancel booking |

### 7.5 Page notes

| Page | Plan |
|---|---|
| `/leads` | Page header with "Upload CSV" (primary). Filter bar (status, assistant, date, search). Data table. CSV upload moves into a sheet with a drop zone and a validation result list. |
| `/assistants` | Card grid: name, trade, status dot, calls and bookings this period, last used. Creation wizard (`SpeedToLeadWizard`, 6 steps) becomes a full-page flow with a left step rail and a persistent summary. The browser test call panel gets the one piece of portal ambient motion: a live audio-level indicator while a call is active. |
| `/appointments` | Tabs: Upcoming, Past, Cancelled. List grouped by day, times in the business's timezone (existing `formatAppointment`). Cancel is a confirm dialog and marks rather than deletes. |
| `/call-summary/[leadId]` | Two columns: left summary, extracted fields and outcome; right recording player and transcript. Player restyled to a neutral waveform with accent progress. |
| `/integrations` | Cards per integration with a connected / not connected status dot and one action. The intake endpoint panel shows the URL in mono with a copy button. |
| `/settings` | Vertical section tabs: Phone numbers, Calendar, Billing, Profile. The calendar "Reconnect" state uses the warning colour. |
| `/support` | Ticket list left, conversation right. |
| `/select-plan` | Reuses the marketing pricing cards inside the portal shell. |

---

## 8. Component inventory

### 8.1 Adopt from Aceternity

| Component | Used for | Changes required |
|---|---|---|
| Hero Parallax | Landing hero | Our copy and CTAs, product tiles, mobile and reduced-motion variants |
| Resizable Navbar | Marketing shell | Our links, lucide icons, `DEMO_URL` CTA |
| Container Scroll Animation | Landing product reveal | Dashboard screenshot, neutral frame |
| MacBook Scroll | `/features` | Screenshot, hide on small screens |
| GitHub Globe | Landing scale section | Recolour to white and accent, lazy load, static fallback |
| World Map | `/contact` | Recolour dots and arcs, our regions |
| Background Beams with Collision | Pricing header | Recolour, confine height |
| Wavy Background | Landing closing CTA | Recolour to white plus one accent strand, pause off-screen |
| Hero Sections (free) | Secondary page heroes | One variant chosen and reused |
| Sidebar | Portal shell | Pinned toggle instead of hover expand, lucide icons, nav groups |
| Logo Clouds, Contact Sections, Footers, Login & Signup Sections (blocks) | Shell, `/contact`, auth | Some Aceternity blocks are part of the paid Pro tier. Check the licence for each before copying; anything not free is rebuilt in the same style from our own tokens. **[confirm]** |

Adopted components are copied into `src/components/aceternity/` and owned by us from then on. Their Tabler icons are swapped for lucide so the project keeps one icon set.

### 8.2 Adopt from shadcn

Already present: button, card, badge, input, label, textarea, select, checkbox, slider, progress, sonner.

To add: chart, table, tabs, dialog, sheet, dropdown-menu, tooltip, popover, accordion, skeleton, separator, avatar, breadcrumb, scroll-area, switch, command (for a later quick-search). The `dashboard-01` block is a layout reference only; its sidebar is not used, since the Aceternity one is.

### 8.3 Build custom

| Component | Why custom |
|---|---|
| How-it-works sticky steps | Specific to the three-step story |
| Bento feature cells with product fragments | Content is product-specific |
| Pricing cards and comparison table | Driven by live pricing data |
| KPI card, delta badge, status dot | Small, token-driven, already half-built in `dashboard/panels.tsx` |
| Section header (eyebrow, title, description) | Used on every marketing section |
| CTA band | Shared across secondary pages |
| Page backdrop (grain, masked grid, glow) | One primitive for all dark pages |
| Recording player | Tied to the on-demand presigned URL flow |
| Empty states and getting-started checklist | Product-specific |

### 8.4 Keep, restyle or retire

| Existing | Decision |
|---|---|
| `RoiCalc`, `Faq`, `LogoMarks`, `HeroPanel` | Keep and restyle (`HeroPanel` becomes a source for hero tiles and bento fragments) |
| `Sparkline`, `CountUp`, `panels.tsx` | Keep, move onto tokens |
| `TrendChart`, `DonutChart`, `BarList` | Replace with shadcn charts |
| `CallMap`, `SignalFlow`, `ScrollFx`, `landing.css` | Retire when the new landing page ships |
| `Navbar`, `PublicNavbar`, `ConditionalNavbar`, `Footer` | Replace with the two shells |
| `Advanced3DScene`, `ThreeBackground`, `ScrollTriggered3D`, `ParticleExplosions`, `ThreeD_Models`, `GSAPAnimations`, `AnimatedTimeline` | Retire (only `/sdr` imports them) |
| `page-broken.tsx` | Delete |

---

## 9. Dependencies

Install names follow Aceternity's and shadcn's documentation as understood today. **[confirm]** each at install time.

| Package | Needed for | Note |
|---|---|---|
| `motion` | All Aceternity components | Same library as the installed `framer-motion` 12 under its current name. Migrate imports to `motion/react` and remove `framer-motion` so only one copy ships. |
| `three-globe`, `@react-three/fiber`, `@react-three/drei` | GitHub Globe | `three` is already installed. Needs the React 19 compatible fiber major. The largest addition by far; loaded lazily on one page only. |
| `dotted-map` | World Map | Small; generates the SVG dot grid. |
| `simplex-noise` | Wavy Background | Small. |
| `recharts` | shadcn charts | Check the version shadcn's chart component currently targets for React 19. |
| `@tanstack/react-table` | Leads data table | — |
| `@clerk/themes` | Auth dark base theme | Pair with the pending Clerk upgrade. |
| Radix primitives | New shadcn components | Pulled in by the shadcn CLI per component. |

Not adding: `@tabler/icons-react` (swap to lucide on adoption), a smooth-scroll library (native scroll plus Motion's scroll hooks is enough).

To remove at the end: `gsap`, `framer-motion` (after the import migration), `@heroicons/react` (after portal pages move to lucide), `tw-animate-css` if nothing still uses it.

---

## 10. Performance and accessibility

### 10.1 Budgets

| Metric | Target |
|---|---|
| LCP, landing, mobile 4G | under 2.5s |
| CLS | under 0.05 |
| INP | under 200ms |
| Marketing first-load JS (before lazy chunks) | under 200KB gzipped |
| Scroll frame rate on a mid-range laptop | 60fps through every set piece |
| Hero tile images | under 120KB each, about 1.5MB total, first row eager and the rest lazy |

### 10.2 Loading strategy

- The hero headline and CTAs are server-rendered text and are the LCP element; nothing animated sits ahead of them.
- Globe, Wavy Background, World Map and MacBook Scroll are dynamically imported with SSR off and mount only when their section approaches the viewport. Each reserves its height to avoid layout shift and shows a static poster until ready.
- The Three.js bundle loads only on `/` and only on desktop-class devices.
- Marketing sections stay server components; only the animated wrappers are client components.
- Portal charts are code-split from the shell so navigation between non-chart pages stays light.

### 10.3 Mobile behaviour

| Component | Below 768px |
|---|---|
| Hero Parallax | Two rows instead of three, reduced travel, no 3D tilt |
| Container Scroll | Smaller rotation, shorter scroll distance |
| MacBook Scroll | Replaced by a static framed screenshot |
| GitHub Globe | Replaced by a static image |
| World Map | Static (no animated arcs) |
| Beams, Waves | Fewer elements, lower frame rate, or static |
| Resizable Navbar | Compact bar with a sheet menu |
| Sidebar | Overlay drawer |
| Tables | Stacked cards |

Hover-only affordances always have a tap or focus equivalent.

### 10.4 Accessibility

- Contrast: body text at least 4.5:1, large text and UI boundaries at least 3:1. `neutral-400` on black is the lightest allowed for body copy; `neutral-500` is for captions of 14px and above only.
- Accent as text on dark uses `accent-text`, not the base accent.
- Status is never conveyed by colour alone: a dot always has a label.
- Full keyboard support: visible focus ring everywhere, sidebar and navbar operable by keyboard, dialogs and sheets trap focus, Escape closes.
- Decorative canvases are `aria-hidden` and take no focus.
- Charts expose a text summary and the underlying figures.
- Reduced motion is handled as in section 4.5 and tested as its own pass.
- Testing note carried over from the last redesign: Chrome pauses animation frames in unfocused or automated tabs, so canvases and reveals look frozen there. Focus the tab before judging an animation broken.

---

## 11. Implementation phases

| Phase | Work | Done when |
|---|---|---|
| **0. Foundations** | Tokens in `globals.css` (neutral scale, accent, status, chart, radius). Remove the `!important` body rules and the forced light theme. Typography scale. Motion tokens and `MotionConfig`. Add the shadcn components listed in 8.2. Marketing, auth and app layout shells as route groups. Page backdrop primitive. | A blank page in each shell renders correctly in dark, and in light for the portal. |
| **1. Landing page** | Resizable Navbar, Hero Parallax, logo strip, Container Scroll, how-it-works, Globe, bento, ROI, results, pricing with beams, comparison, FAQ, wavy CTA, footer. Uses interim screenshots. | Landing page meets the budgets in 10.1 and passes the reduced-motion and mobile passes. |
| **2. Auth** | Split-screen shell, Clerk appearance object at the provider, invitation copy on `/sign-up`. | A real invitation email completes signup end to end in the new design. |
| **3. Portal shell and dashboard** | Sidebar, top bar, dashboard layout, shadcn charts, KPI cards. | Dashboard matches section 7.2 in both themes. |
| **4. Portal pages** | Leads (data table), assistants and wizard, appointments, call summary, integrations, settings, support, select-plan. | No raw hue utilities or inline-style layout remain in portal pages. |
| **5. Secondary public pages** | Templates A, B, C and the individual pages; MacBook Scroll on `/features`, World Map on `/contact`; all CTAs to `DEMO_URL`. | Every public page uses the marketing shell. |
| **6. Reshoot and cleanup** | Capture final product tiles and screenshots from the finished portal and swap them into the landing page. Remove GSAP, legacy 3D components, `landing.css`, old navbars, unused packages. Final performance and accessibility pass. | No retired component from 8.4 remains. |

Why this order: the landing page is the stated priority, so it goes first, at the cost of one planned re-shoot of its imagery in phase 6. If a week's delay on the landing page is acceptable, moving phase 3 ahead of phase 1 removes the re-shoot.

Suggested gate before phase 1: the Next.js and Clerk security upgrades from the codebase audit, since both phases 1 and 2 build directly on those packages.

---

## 12. Open decisions

1. **Accent hex.** `#2D6AFF` (current landing) is assumed. Confirm, or name the intended brand blue.
2. **Portal theme.** Plan assumes dark by default with a light option. Alternative: dark only, which halves the QA surface.
3. **Aceternity Pro.** Whether to buy the Pro tier for the block sets, or rebuild those blocks in-house.
4. **Phase order.** Landing first with a re-shoot, or portal dashboard first.
5. **Globe vs weight.** The globe is the single most expensive visual. If the performance budget is tight after phase 1, the fallback is to move the World Map to the landing page and drop the globe.
