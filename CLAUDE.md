# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Keep this file current

This file must describe the code as it is. **When a change makes any line here
wrong or incomplete, update this file in the same change** — a new or deleted
model, route, page or core module; a changed rule about tenancy, billing,
calls or design; a new command or environment variable. Do the same for the
`laycal-dev` skill (`~/.claude/skills/laycal-dev/`) when the change touches
what it covers. Do not log completed work here; record only what a future
session needs to know. Last reviewed: 2026-10-12.

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
- nodemailer (notification emails); cron-job.org (the every-minute wake-up)
- driver.js (setup guide), recharts via shadcn chart, three-globe (landing)
- Sentry, Vercel Analytics, Google Tag Manager

## Where things are

### Models (`src/models/`)
- `Account.ts` — the business: balance, per-minute rate, onboarding answers, status, `notifications` (address and four switches)
- `Membership.ts` — Clerk user → account
- `CreditLedger.ts` — every movement of money, with a unique `ref`
- `PendingTransaction.ts` — PayPal orders awaiting capture
- `Assistant.ts` — assistant config, `serviceConfig`, Vapi id, `callingRules` (retry, calls in total, hold outside calling hours)
- `Lead.ts` — also `source` (form / upload), `outcome` (why it was not reached), `tries`, `attempts` (one per call) and `nextCallAt` (set while waiting for a call)
- `CallSummary.ts`, `Appointment.ts`
- `NotificationLog.ts` (one row per email, unique key), `IntakeGuard.ts` (stops double submissions), `Heartbeat.ts` (last run of the wake-up)
- `PhoneProvider.ts` (encrypted credentials), `CalendarConnection.ts`
- `Admin.ts`, `SystemSettings.ts`, `SupportTicket.ts`, `ContactSubmission.ts`

### Core modules (`src/lib/`)
- `account.ts` — `getAccountAuth()`: the only place the tenant is resolved; provisions on first sign-in
- `billing.ts` — the only place a balance changes (`applyMovement`, `chargeCall`, `chargeAssistant`, `canPlaceCall`, `getRate`)
- `tenantVapi.ts` — the Vapi service to use (`vapi.ts` is the older, simpler one)
- `leadCalls.ts` — the one way a call to a lead starts (`startLeadCall`, `callOrHold`, `queueLead`) and the one place that decides what happens when it ends (`recordCallEnded`: done, or another try later); also `runDueCalls` and `reconcileStuckCalls` for the wake-up
- `callingRules.ts` — an assistant's calling rules with defaults, calling-hours and time-zone maths, retry timing
- `notifications.ts` + `mail.ts` — the four emails to the business (booked, unreached, calls stopped, balance low), sent through the owner's mailbox
- `cron.ts` — the cron secret check and the wake-up heartbeat
- `leadStatus.ts` — the wording for a lead's state, shared by the Leads page and the lead's page
- `speedToLead/` — `verticals.ts`, `promptGenerator.ts`, `tools.ts`, `vapiToolBridge.ts`, `callVariables.ts`
- `calendar/` — calendar providers; `formatAppointment.ts` renders times in the business's zone
- `links.ts` (`DEMO_URL`), `seo.ts`, `clerkAppearance.ts`, `logger.ts`, `mongodb.ts`, `csvProcessor.ts`, `adminAuth.ts`
- `usageValidator.ts` — thin leftover shim; new logic goes in `billing.ts`

### API routes (`src/app/api/`)
- `account` — account summary, onboarding, tour dismissal; `account/notifications` — email settings
- `credits`, `paypal/create-order`, `paypal/capture-order`
- `assistants` (+ `generate-prompt`, `[id]/test`, `[id]/resync`, `[id]/calling-rules`)
- `leads` (+ `[id]`, `[id]/retry` for Retry and Call now, `[id]/stop`), `call-summaries` (+ `[id]/recording`), `appointments`
- `cron/tick` — the wake-up, called every minute by cron-job.org with the cron secret; `cron/watchdog` — Vercel's daily job (`vercel.json`) that raises an error if the wake-up has stopped
- `webhooks/vapi` — call status, charging, summaries
- `webhooks/lead-intake/[assistantId]` — starts a call for a new lead
- `webhooks/clerk`, `vapi/calendar/...` (in-call availability and booking tools)
- `calendar`, `phone-providers`, `contact`, `support`
- `admin/accounts` (+ `[id]`), `admin/dashboard/stats`

### Pages (`src/app/`)
- Public: `/` (landing), `/lead-reactivation`, `/speed-to-lead`, `/instant-lead-follow-up`, `/compare`, `/justcall-alternative`, `/nooks-alternative`, `/blogs`, `/contact`, `/privacy`, `/terms`, `/status`
- Auth: `/sign-in`, `/sign-up`, `/onboarding`
- Portal: `/dashboard`, `/assistants`, `/leads`, `/appointments`, `/call-summary`, `/integrations`, `/settings`, `/support`
- Admin: `/admin/...` (`/admin/users` is the Accounts screen)
- `public/llms.txt` — a plain-text summary of Laycal for AI assistants (facts, what it is not, links to the public pages and posts). Update it when a public page or post is added or removed, or when a product fact changes
- Redirected in `next.config.ts`: `/features`, `/pricing`, `/about`, `/case-studies`, `/sdr`, `/blog`, and the six retired `/blogs/*-alternative-2026` posts (to the comparison pages)
- Blog: posts are markdown files in `blogs/`, written for the buyer (lead response time, the first call, after-hours leads), not competitor roundups. The template has no markdown table support. Every post gets its own banner in `public/assets/blogs/`, drawn by `scripts/make-blog-banners.js` (add a motif, run the script); the full steps are in the `laycal-seo` skill under "Publishing a blog post"

### Components (`src/components/`)
- `landing/` — the public page kit: `primitives.tsx` (`Shell`, `Section`, `SectionHeader`, `Reveal`, `DemoCta`), `site-nav.tsx`, `hero.tsx`, `sections.tsx`, `features.tsx`, `roi.tsx`, `pricing.tsx`, `cta.tsx`, `reactivation.tsx`, `solution.tsx` (`SOLUTIONS`: content for `/speed-to-lead` and `/instant-lead-follow-up`), `comparison.tsx` (`COMPARISONS`: content for `/justcall-alternative`, `/nooks-alternative` and the `/compare` index), `product-tiles.tsx` (`HERO_TILES`), `providers.tsx` (`useRate()`)
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
3. **Calls:** every call to a lead starts through `startLeadCall` in `src/lib/leadCalls.ts` (or `callOrHold` / `queueLead` for a new lead). It claims the lead atomically, checks credit, uses the lead's own assistant and records the try. Do not call `initiateCall` for a lead directly; only the assistant's test call does. Calls are charged per second, keyed on each call's own id.
4. **Vapi updates:** `analysisPlan` and `model` are replaced, not merged. Always send the full analysis plan and the tools.
5. **Lead status:** `pending → calling → completed/failed`. For calls placed through `leadCalls`, `recordCallEnded` owns the status (it may put the lead back to `pending` with `nextCallAt` for another try); the Vapi webhook must not set it. A lead with `status: 'pending'` and `nextCallAt` is waiting for the wake-up. Do not set `calling` by hand.
6. **Appointments:** count bookings from the `appointments` collection; cancelling sets `status: 'cancelled'` and never deletes.
7. **Prompts:** the wizard's LLM never writes tool names or `{{ }}` template syntax; those lines are appended in code.
8. **Credentials:** `PhoneProvider` encrypts sensitive fields; read them through its getters.
9. **Phone numbers:** E.164 (`+1234567890`).
10. **Emails:** send through `src/lib/notifications.ts` only. Each email has a unique key in `NotificationLog`, written before the send, so one event sends one email; a mail failure is recorded there and never reaches the caller.
11. **Later calls depend on the wake-up.** Anything scheduled (a next try, a held lead, a queued upload) is placed by `/api/cron/tick`. Leaving a lead waiting must go through `leadCalls`, which also checks the wake-up is alive.
12. **API routes:** auth check, `connectToDatabase()`, structured logging with an operation code and `accountId` in the context.

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

# Redraw the blog post banners into public/assets/blogs/
node scripts/make-blog-banners.js

# Run the wake-up once by hand (what cron-job.org does every minute)
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3100/api/cron/tick

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
credentials, `CRON_SECRET` (the wake-up and watchdog; must also be the
`Authorization: Bearer` header on the cron-job.org job), `CONTACT_EMAIL`,
`CONTACT_EMAIL_PASS`, `SMTP_SERVER`, `SMTP_PORT` (notification emails; without
them emails are skipped, not failed), `RETRY_DELAYS_SECONDS` and
`VAPI_BASE_URL` (testing only), `NEXT_PUBLIC_PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`,
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
8. The `blogs/` directory at the repo root holds blog posts as markdown. The loaders return an empty list if it is empty or missing.
9. Console statements are removed in production builds.
10. After changing a Mongoose schema, restart the dev server: the compiled model is cached and new fields are silently dropped until then.
11. Vercel's free plan only schedules daily, so the every-minute wake-up comes from cron-job.org. If it stops, waiting leads are not called; `WAKEUP_STOPPED` is logged, sent to Sentry and emailed to `CONTACT_EMAIL`.
12. To exercise call flows without ringing a phone, run a second dev server with `VAPI_BASE_URL` pointing at a stand-in that answers `POST /call` and `GET /call/:id`, and post end-of-call reports to `/api/webhooks/vapi` by hand.

## When adding features

1. Read a neighbouring route or page and match it.
2. Tenant data: add `accountId`, index it, resolve it with `getAccountAuth()`.
3. Anything billable: add a movement type in `billing.ts` with a unique `ref`.
4. Call data: extend `CallSummary` and the extraction in `webhooks/vapi`.
5. Public pages: build from `components/landing/`, add the route to `MARKETING_ROUTES` in `ClientLayoutWrapper.tsx`, and add it to the sitemap.
6. Portal pages: add to the nav in `portal-shell.tsx` and use `PortalPage`.
7. Update this file if the change alters anything it describes.
8. Add an entry to `work-timeline.md`.
