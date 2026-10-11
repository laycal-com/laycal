# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Keep this file current

This file must describe the code as it is. **When a change makes any line here
wrong or incomplete, update this file in the same change** — a new or deleted
model, route, page or core module; a changed rule about tenancy, billing,
calls or design; a new command or environment variable. Do the same for the
`laycal-dev` skill (`~/.claude/skills/laycal-dev/`) when the change touches
what it covers. Do not log completed work here; record only what a future
session needs to know. Last reviewed: 2026-10-11.

## Log your work in `work-timeline.md`

Several agents work in this repo at the same time. **Read the latest entries in
`work-timeline.md` before starting, and add an entry at the bottom after every
piece of work**, in the same change: what you did, when and why, in a few
lines, and whether it is committed. Include things you tried and removed. The
format is at the top of that file. Never edit another agent's entry.

## What this is

The repo is named `saas-template` but it is **Laycal** (laycal.com, GitHub
`laycal-com/laycal`): an AI voice agent that phones a new lead within a minute
of a form being submitted, qualifies them and books the meeting on the
business's calendar.

**Core flow:** lead source posts to the intake webhook → the assistant calls
within seconds → it qualifies, handles objections and books a real open slot in
Google Calendar during the call → the business gets the outcome, recording and
summary.

**Secondary use:** lead reactivation — upload a CSV of existing leads and the
assistant calls each one.

For detailed rules and the traps already met, load the `laycal-dev` skill; for
search work, `laycal-seo`.

## Product rules

- **Buyer:** any business where the first call wins the customer (home
  services, e-commerce, B2B). Not SDR teams or bulk cold calling.
- **Copy:** lead with "called within a minute". No "cheap", no competitor
  framing outside the dedicated comparison pages, no invented statistics,
  logos or testimonials.
- **Invite-only:** no public sign-up. Acquisition buttons link to `DEMO_URL`
  (`src/lib/links.ts`). `/sign-up` is never linked publicly but must stay
  mounted and public, because Clerk invitation emails land there.
- **Pay as you go:** no plans, tiers, trials or subscriptions. A per-minute
  rate set per account; first assistant free, each further one a one-time fee.
- **Appointments are bookings:** booked live on the call. No pending or
  confirmation queue.

## Stack

- Next.js 15 (App Router, React 19, Turbopack), TypeScript
- Tailwind CSS 4, shadcn/ui (new-york), Aceternity components, `motion`
- MongoDB with Mongoose
- Clerk for customer auth; a separate JWT + bcrypt admin login
- Vapi for calls; Twilio, Plivo and Vonage as per-account phone providers
- Google Calendar; PayPal for credit top-ups; OpenRouter for prompt generation
- driver.js (setup guide), recharts via shadcn chart, three-globe (landing)
- Sentry, Vercel Analytics, Google Tag Manager

## Where things are

### Models (`src/models/`)
- `Account.ts` — the business: balance, per-minute rate, onboarding answers, status
- `Membership.ts` — Clerk user → account
- `CreditLedger.ts` — every movement of money, with a unique `ref`
- `PendingTransaction.ts` — PayPal orders awaiting capture
- `Assistant.ts` — assistant config, `serviceConfig`, Vapi id
- `Lead.ts`, `CallSummary.ts`, `Appointment.ts`
- `PhoneProvider.ts` (encrypted credentials), `CalendarConnection.ts`
- `Admin.ts`, `SystemSettings.ts`, `SupportTicket.ts`, `ContactSubmission.ts`

### Core modules (`src/lib/`)
- `account.ts` — `getAccountAuth()`: the only place the tenant is resolved; provisions on first sign-in
- `billing.ts` — the only place a balance changes (`applyMovement`, `chargeCall`, `chargeAssistant`, `canPlaceCall`, `getRate`)
- `tenantVapi.ts` — the Vapi service to use (`vapi.ts` is the older, simpler one)
- `speedToLead/` — `verticals.ts`, `promptGenerator.ts`, `tools.ts`, `vapiToolBridge.ts`, `callVariables.ts`
- `calendar/` — calendar providers; `formatAppointment.ts` renders times in the business's zone
- `links.ts` (`DEMO_URL`), `seo.ts`, `clerkAppearance.ts`, `logger.ts`, `mongodb.ts`, `csvProcessor.ts`, `adminAuth.ts`
- `usageValidator.ts` — thin leftover shim; new logic goes in `billing.ts`

### API routes (`src/app/api/`)
- `account` — account summary, onboarding, tour dismissal
- `credits`, `paypal/create-order`, `paypal/capture-order`
- `assistants` (+ `generate-prompt`, `[id]/test`, `[id]/resync`)
- `leads`, `call-summaries` (+ `[id]/recording`), `appointments`
- `webhooks/vapi` — call status, charging, summaries
- `webhooks/lead-intake/[assistantId]` — starts a call for a new lead
- `webhooks/clerk`, `vapi/calendar/...` (in-call availability and booking tools)
- `calendar`, `phone-providers`, `contact`, `support`
- `admin/accounts` (+ `[id]`), `admin/dashboard/stats`

### Pages (`src/app/`)
- Public: `/` (landing), `/lead-reactivation`, `/speed-to-lead`, `/instant-lead-follow-up`, `/compare`, `/justcall-alternative`, `/nooks-alternative`, `/contact`, `/privacy`, `/terms`, `/status`
- Auth: `/sign-in`, `/sign-up`, `/onboarding`
- Portal: `/dashboard`, `/assistants`, `/leads`, `/appointments`, `/call-summary`, `/integrations`, `/settings`, `/support`
- Admin: `/admin/...` (`/admin/users` is the Accounts screen)
- Redirected in `next.config.ts`: `/features`, `/pricing`, `/about`, `/case-studies`, `/sdr`, the six retired `/blogs/*-alternative-2026` posts (to the comparison pages), and `/blogs` and `/blog` (temporarily, to `/`, while the blog has no posts)
- Blog: the `/blogs` routes and template still exist. To bring the blog back, add markdown posts to `blogs/`, remove the two temporary redirects, and restore the nav, footer and sitemap entries

### Components (`src/components/`)
- `landing/` — the public page kit: `primitives.tsx` (`Shell`, `Section`, `SectionHeader`, `Reveal`, `DemoCta`), `site-nav.tsx`, `hero.tsx`, `sections.tsx`, `features.tsx`, `roi.tsx`, `pricing.tsx`, `cta.tsx`, `reactivation.tsx`, `solution.tsx` (`SOLUTIONS`: content for `/speed-to-lead` and `/instant-lead-follow-up`), `product-tiles.tsx` (`HERO_TILES`), `providers.tsx` (`useRate()`)
- `portal/` — `portal-shell.tsx` (sidebar, account gate, `PORTAL_ROUTES`, `DARK_ROUTES`), `account-context.tsx` (`useAccount()`), `setup-guide.tsx`, `page.tsx` (`PortalPage`, `PageHeader`)
- `dashboard/` — panels, account cards, charts
- `auth/auth-shell.tsx`, `brand/logo-mark.tsx`
- `SpeedToLeadWizard.tsx` (assistant creation), `SpeedToLeadIntegration.tsx` (intake snippets, including the Google Forms script), `AssistantForm.tsx`, `AssistantWebTest.tsx`
- `ClientLayoutWrapper.tsx` — picks the frame by pathname (portal shell, dark marketing root, or plain)
- `ui/` — shadcn and Aceternity components

Leftovers that are not used and should not be built on: `PromptWizard.tsx`,
`src/lib/promptWizard/`, the capitalised files in `components/landing/`
(`CallMap`, `HeroPanel`, `ScrollFx`, …), `src/app/landing.css`,
`src/app/page-broken.tsx`.

## Rules in the code

1. **Tenancy:** resolve the tenant with `getAccountAuth()` and query by `accountId`. Never query customer data by Clerk `userId`.
2. **Money:** change a balance only through `src/lib/billing.ts`. It writes a ledger row with a unique `ref` (`call:<id>`, `order:<id>`) and then an atomic increment, which makes retries harmless.
3. **Calls:** start every call through `TenantVapiService.initiateCall` with `buildCallVariables()`. It refuses to dial at zero balance. Calls are charged per second.
4. **Vapi updates:** `analysisPlan` and `model` are replaced, not merged. Always send the full analysis plan and the tools.
5. **Lead status:** `pending → calling → completed/failed` is driven by the Vapi webhook. Do not set `calling` by hand.
6. **Appointments:** count bookings from the `appointments` collection; cancelling sets `status: 'cancelled'` and never deletes.
7. **Prompts:** the wizard's LLM never writes tool names or `{{ }}` template syntax; those lines are appended in code.
8. **Credentials:** `PhoneProvider` encrypts sensitive fields; read them through its getters.
9. **Phone numbers:** E.164 (`+1234567890`).
10. **API routes:** auth check, `connectToDatabase()`, structured logging with an operation code and `accountId` in the context.

## Design

- Black, white and greys with one accent, blue `#2D6AFF` (`--brand`). No multi-colour gradients. Green, amber and red only as status dots and labels.
- Tailwind utilities, shadcn/ui and Aceternity only. No new CSS files; colour tokens live in `src/app/globals.css`.
- Dark is opt-in through a `dark` class on a page root. `body:not(:has(.dark))` keeps other pages light; keep that guard.
- Clerk is themed through `src/lib/clerkAppearance.ts`, not CSS rules.
- `Design.md` in the repo root is the full plan.

## Commands

```bash
npm run dev          # dev server (Turbopack)
npm run build        # production build
npm start            # production server
npm run lint         # ESLint
npx tsc --noEmit     # type check (no dedicated script)

# Dev server beside a production build on port 3000
NEXT_DIST_DIR=.next-dev npx next dev --turbopack -p 3100

# Drop customer collections (dry run unless --apply)
node scripts/reset-accounts.mjs
```

There is no test framework; verification is manual (load the page, call the
route, use the assistant's browser test call).

## Environment

Required: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`,
`MONGODB_URI`, `VAPI_API_KEY`, `PHONE_PROVIDER_ENCRYPTION_KEY`,
`NEXT_PUBLIC_APP_URL`.

Also used: `NEXT_PUBLIC_VAPI_PUBLIC_KEY` (browser test calls),
`VAPI_WEBHOOK_URL`, OpenRouter key (prompt generation), Google OAuth
credentials, `NEXT_PUBLIC_PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`,
`NEXT_PUBLIC_PAYPAL_ENVIRONMENT`, Sentry variables, `NEXT_PUBLIC_GTM_ID`.

`.env.local` is a development config and its database is not production.
Production values live in Vercel.

## Gotchas

1. The build ignores TypeScript and ESLint errors, and the repo has a baseline of old type errors. Judge a change by whether the files it touched are clean.
2. Calls are webhook-driven. Without a working public URL in `VAPI_WEBHOOK_URL`, a local call dials but the lead stays in `calling`.
3. Tool URLs and the server URL are stored on the Vapi assistant when it is saved. After changing the app URL, resync the assistant.
4. Vapi retires voices and then rejects assistant creation. Voice ids in `AssistantForm.tsx` must be current; `RETIRED_VAPI_VOICES` in `tenantVapi.ts` maps old ones.
5. Google Calendar booking and availability need different scopes; older connections must reconnect once.
6. Stored recording URLs expire. Fetch a fresh one at view time through `api/call-summaries/[id]/recording`.
7. Radix components that render in a portal (Select, Sheet, Tooltip, Dialog) sit outside a page's dark root and need the `dark` class passed in.
8. The `blogs/` directory at the repo root holds blog posts as markdown. It is currently empty (kept by a placeholder file); the loaders return an empty list if it is missing.
9. Console statements are removed in production builds.

## When adding features

1. Read a neighbouring route or page and match it.
2. Tenant data: add `accountId`, index it, resolve it with `getAccountAuth()`.
3. Anything billable: add a movement type in `billing.ts` with a unique `ref`.
4. Call data: extend `CallSummary` and the extraction in `webhooks/vapi`.
5. Public pages: build from `components/landing/`, add the route to `MARKETING_ROUTES` in `ClientLayoutWrapper.tsx`, and add it to the sitemap.
6. Portal pages: add to the nav in `portal-shell.tsx` and use `PortalPage`.
7. Update this file if the change alters anything it describes.
8. Add an entry to `work-timeline.md`.
