# Work timeline

A shared log of what was done in this repo, when and why. It is for the owner
and for agents working here at the same time, so nobody undoes or repeats
someone else's work.

## How to use it

- **Read the latest entries before you start.** Another agent may have just changed what you are about to touch.
- **Add an entry after every piece of work**, in the same change: code, content, config, data, docs, skills. Include work you tried and removed, so nobody tries it again.
- **Add to the bottom.** Never edit or reorder someone else's entry; if one is wrong, add a correction below it.
- **Keep it brief.** A few lines: what, why, where. Detail belongs in the commit or in `CLAUDE.md`.
- **Say whether it is committed.** Other agents need to know what is still only in the working tree.

Entry format:

```
### YYYY-MM-DD HH:MM · <who: dev / seo / gtm / owner> · <short title>
- **What:** what changed, with the main paths.
- **Why:** the reason, in a sentence.
- **Status:** committed (hash) / uncommitted / removed. Anything the next person must know.
```

Times are the machine's local time (`date '+%Y-%m-%d %H:%M'`).

---

## 2026-10-09

### 2026-10-09 · dev · Redesign: landing page, portal, auth pages
- **What:** rebuilt the landing page from a kit in `src/components/landing/`, the portal shell and dashboard (`src/components/portal/`, `src/components/dashboard/`), all portal pages, and the sign-in / sign-up screens. `Design.md` holds the plan.
- **Why:** the owner found the old site basic and the portal's gradients cheap; the direction is black and white with one blue accent (`#2D6AFF`), using shadcn and Aceternity components.
- **Status:** committed (`9806286`).

### 2026-10-09 · dev · Repositioned to speed to lead
- **What:** rewrote landing copy for businesses that must call new leads within a minute; removed the JustCall / Nooks comparison and unverified results from the landing page; deleted `/features`, `/pricing`, `/about`, `/case-studies`, `/sdr` (redirected in `next.config.ts`); added `/lead-reactivation`.
- **Why:** the owner defined the buyer as any business where the first call wins, not cold-calling teams.
- **Status:** committed (`9806286`, `6cd3191`).

## 2026-10-10

### 2026-10-10 · dev · Account model and pay-as-you-go billing
- **What:** replaced plan-based users with `Account`, `Membership` and `CreditLedger`; tenancy through `getAccountAuth()` in `src/lib/account.ts`; all money through `src/lib/billing.ts`; per-account per-minute rate; first assistant free, then $10; onboarding form; driver.js setup guide; admin Accounts screen. Removed subscription models, routes and components.
- **Why:** the owner said identifying users by plan was wrong; the business should own the data and pay only for usage.
- **Status:** committed (`6cd3191`). Local database was reset; production is a separate database and was not touched.

### 2026-10-10 · dev · Assistant fixes
- **What:** replaced retired Vapi voices (`AssistantForm.tsx`, `RETIRED_VAPI_VOICES` in `tenantVapi.ts`); added an "Other" trade to the wizard; blocked "New assistant" with an explanation when the account cannot pay for another; fixed duplicate accounts created on first sign-in.
- **Why:** assistant creation failed with a Vapi 400, the wizard only covered home services, and a sign-in race created empty accounts.
- **Status:** committed (`6cd3191`).

### 2026-10-10 · dev · Logo, favicon, contact page
- **What:** `LogoMark` from `public/assets/logo.png` used everywhere; favicon and app icons generated from it; `/contact` rebuilt with a details column, form and tilted mini map.
- **Why:** owner supplied the logo and asked for the Aceternity-style contact layout.
- **Status:** committed (`6cd3191`). The map pin (Casablanca) is a guess and unconfirmed.

### 2026-10-10 · dev · Google Forms script
- **What:** rewrote the Apps Script generated in `src/components/SpeedToLeadIntegration.tsx` to work whether it is attached to the form or the response sheet, and to install its own trigger.
- **Why:** the owner's form did not start calls; the script had no trigger and read a field that a form-attached script never receives. The intake endpoint itself was fine.
- **Status:** committed by the owner (`4f41617`).

### 2026-10-10 · dev · Cursor glow on the landing page — tried and removed
- **What:** added a React Bits cursor glow to the landing page, toned it down three times, then deleted it.
- **Why:** it explained nothing about the product and only felt right when nearly invisible. Do not add it back.
- **Status:** removed; nothing left in the tree.

## 2026-10-11

### 2026-10-11 · dev · Pitch-deck brief
- **What:** rewrote `app-description.md` as a positioning brief for a customer demo deck.
- **Why:** the old file described the previous product (bulk cold calling, plans), which would have misled the design agent.
- **Status:** committed (`d2fa1f2`). The per-minute rate is left blank on purpose.

### 2026-10-11 · dev · `laycal-dev` skill
- **What:** created `~/.claude/skills/laycal-dev/` (rules, architecture, design, workflow, a type-check helper).
- **Why:** so any session working on the code starts with the rules and traps already known.
- **Status:** installed; lives outside the repo. Not formally tested.

### 2026-10-11 13:05 · dev · `CLAUDE.md` rewritten
- **What:** replaced `CLAUDE.md` with a description of the current code, plus a rule to keep it accurate in the same change as any work that alters it.
- **Why:** it still described plans, the old wizard, a pending-appointment queue and `userId` tenancy.
- **Status:** uncommitted.

### 2026-10-11 13:10 · dev · Noted that the rebuilt search pages are intentional
- **What:** recorded in the `laycal-dev` skill that `/speed-to-lead`, `/instant-lead-follow-up` and `/compare` are meant to exist.
- **Why:** the SEO agent brought them back after checking Google Search Console (`17ef376`, `d2fa1f2`); the owner confirmed. Do not delete or redirect them.
- **Status:** no repo change.

### 2026-10-11 13:15 · dev · Started this timeline
- **What:** created `work-timeline.md` with entries for earlier work, and added the rule to use it to `CLAUDE.md` and the `laycal-dev` skill.
- **Why:** the owner asked for one place where every agent records what it did, when and why.
- **Status:** uncommitted. Entries before today carry dates only; times were not recorded.

### 2026-10-11 12:30 · seo · Technical SEO fixes (review of Kimi's audit and changes)
- **What:** canonical host is `www.laycal.com` everywhere with a canonical per page; title template with already-branded titles opted out (`title.absolute`); default social image on every page (`src/lib/seo.ts`); server-rendered structured data (`src/components/landing/structured-data.tsx`); sitemap dates from git and no dead URLs (`src/app/sitemap.ts`); `/sitemap-debug` deleted; `/sign-in`, `/sign-up`, `/support`, `/status` noindex; links to the never-built `/industries/hvac` removed; `/compare` added but kept out of the main nav; comparison pages cleared of "try today", "plans" and "live in days".
- **Why:** every page told Google its real URL was one that redirects, several pages shared the homepage's title and canonical, and Kimi's first pass linked to a page that did not exist and contradicted invite-only pricing.
- **Status:** committed (`d2fa1f2`), pushed, live. Kimi's original uncommitted version is in the stash labelled `kimi-seo-original-2026-10-11` and can be dropped. `.kimi-code/skills/laycal-seo/SKILL.md` still says the audience is home services only; that is wrong.

### 2026-10-11 12:35 · seo · `laycal-seo` skill
- **What:** created `~/.claude/skills/laycal-seo/` (positioning, copy rules, this codebase's metadata conventions) with `scripts/check_pages.sh`, which checks each page's title, canonical, robots, social image, H1 count and internal links.
- **Why:** earlier SEO work assumed the wrong audience and shipped without rendering the pages.
- **Status:** installed; lives outside the repo. The checker was run against production; the skill was not tested with separate agents.

### 2026-10-11 12:45 · seo · Read Google Search Console
- **What:** read the `laycal.com` property (24 Sep 2025 – 8 Oct 2026): 86 clicks and 5,340 impressions in 16 months, 37 clicks on the brand name, 3 sites linking in. Comparison queries sit at positions 35–50 with almost no clicks. The pages earning non-brand traffic were `/speed-to-lead`, `/sdr` and `/instant-lead-follow-up`, which the redesign had redirected to the homepage.
- **Why:** to choose the next SEO work from real data.
- **Status:** no repo change. The sitemap was last read by Google on 13 Oct 2025 and still needs resubmitting by hand in Search Console (`https://www.laycal.com/sitemap.xml`); browser automation could not type into that field.

### 2026-10-11 12:58 · seo · Rebuilt `/speed-to-lead` and `/instant-lead-follow-up`
- **What:** two public pages on the landing kit, content in `src/components/landing/solution.tsx` (`SOLUTIONS`) with thin page files; `/sdr` now redirects to `/instant-lead-follow-up`; footer gained a "Solutions" column (`sections.tsx`); both pages added to the sitemap and `MARKETING_ROUTES`.
- **Why:** those URLs carried the site's only non-brand search traffic, and a topical page redirected to a homepage usually loses its rankings.
- **Status:** committed (`17ef376`), pushed, live; checker passes on production. Not checked at mobile width. `CLAUDE.md`'s `landing/` components line should also list `solution.tsx`.

### 2026-10-11 13:26 · seo · Added the SEO entries to this timeline
- **What:** back-filled the four SEO entries above; added a "log to `work-timeline.md`" step to the `laycal-seo` skill.
- **Why:** the owner asked every agent to record what it did, when and why.
- **Status:** uncommitted (this file). The four entries above are older than the two dev entries before them; they were added late. No code touched in this step.

### 2026-10-11 13:37 · seo · Sitemap resubmitted; directory list and listing copy prepared
- **What:** the owner resubmitted `sitemap.xml` in Search Console. Gave the owner the two URLs to request indexing for (`/speed-to-lead`, `/instant-lead-follow-up`), a shortlist of directories to list Laycal on, and one set of listing copy to paste (tagline, short and long description, categories, pricing line).
- **Why:** Search Console showed only 3 sites linking to Laycal (goodfirms.co, saashub.com, scamadviser.com); links are what limits rankings now.
- **Status:** no repo change. Listings are the owner's to submit; none submitted yet. GTM agent: this overlaps with directory and launch work, check here before duplicating.

### 2026-10-11 15:22 · seo · G2 listing submitted by the owner
- **What:** the owner submitted Laycal to G2 (which they were told also feeds Capterra and sister sites). Not yet visible publicly; G2 blocks automated checks (403), so I could not confirm status. Also advised against buying backlinks on Fiverr.
- **Why:** only 3 sites link to Laycal; directory listings are the first legitimate links.
- **Status:** no repo change. Listing pending; re-check in 24–48 hours. Next listings to do: Crunchbase, LinkedIn company page, AlternativeTo, AI directories.

### 2026-10-11 15:24 · seo · Crunchbase profile live (owner)
- **What:** the owner reports Laycal is now listed on Crunchbase. Not independently checked.
- **Why:** directory listings are the first legitimate links; only 3 sites linked to Laycal on 2026-10-11.
- **Status:** no repo change. G2 still pending. Remaining: LinkedIn company page, AlternativeTo, AI directories, Product Hunt (as a planned launch).

### 2026-10-11 15:40 · seo · Directory list corrected: AI tool directories are mostly paid
- **What:** There's An AI For That turned out to be paid (owner found out at the dashboard); Futurepedia's own submit page lists $247–$497. Both dropped from the list. Revised free shortlist, per third-party sources and not confirmed on each site: AlternativeTo, SourceForge, SaaSworthy, Future Tools, AI Valley, Product Hunt (as a planned launch).
- **Why:** my first list came from memory and was out of date; the owner should not pay for directory listings.
- **Status:** no repo change. Live: Crunchbase. Pending: G2. Do not re-suggest TAAFT or Futurepedia.

### 2026-10-11 15:50 · seo · Rewrote the Nooks blog post (first of six) — awaiting owner review
- **What:** full rewrite of `blogs/nooks-alternative-2026.md`: removed invented claims ("$25 in free credits", "hundreds of sales teams", "99% accuracy", "300-500% increase") and the SDR-replacement pitch; now says what Nooks and Laycal each do, when Laycal is not the answer, and links to `/nooks-alternative`, `/speed-to-lead`, `/instant-lead-follow-up`, `/lead-reactivation`. URL unchanged. Nooks facts checked on nooks.ai today (agent platform for GTM teams; pricing by custom quote only).
- **Why:** the six blog posts still carry the old cold-calling positioning and state things that are not true; they are also where most low-ranking impressions sit.
- **Status:** committed on branch `worktree-seo-blog-rewrite` (`f48905f`), not merged, not live. Checker passes locally. The other five posts (JustCall, Kixie, Ringover, Aloware, Dialpad) have the same problems and are untouched. Found on the way: `/nooks-alternative` and `/compare` still call Nooks only "a parallel dialer", which is narrower than how Nooks now describes itself; the blog template does not render markdown tables (no remark-gfm).

### 2026-10-11 15:55 · dev · Fixed spacing in the "Objection handled" tile on the solution pages
- **What:** the small hero tile slot in `src/components/landing/solution.tsx` went from `h-72` to `h-[21rem]`. Affects the hero of `/instant-lead-follow-up` and `/speed-to-lead` only.
- **Why:** at 288px the tile's content was taller than its box, so the "Stayed on the call" line sat flush against the agent bubble and was clipped at the bottom edge. The tile was designed for the taller slots used on the landing page.
- **Status:** committed and pushed to `main` in the same commit as this entry ("Fix objection tile spacing…"). Checked both pages at desktop width on the dev server; the hero tiles are hidden below `lg`, so mobile is unaffected. Also added `solution.tsx` to the `landing/` line in `CLAUDE.md`, as the SEO entry above asked.

### 2026-10-11 15:57 · dev · Committed `CLAUDE.md` and this timeline
- **What:** the rewritten `CLAUDE.md` and `work-timeline.md` are now in git, in the same commit as the tile fix above. The earlier dev entries that say "uncommitted" for those two files are superseded by this one.
- **Why:** the owner asked to commit and push.
- **Status:** committed and pushed to `main`. The SEO entries marked uncommitted or on a branch are unchanged; `.claude/` is left untracked.

### 2026-10-11 16:06 · seo · Retired the six "alternative" blog posts; blog hidden until it has real posts
- **What:** deleted the six posts in `blogs/` and redirected each URL in `next.config.ts` (JustCall → `/justcall-alternative`, Nooks → `/nooks-alternative`, Kixie / Ringover / Aloware / Dialpad → `/compare`). `/blogs` and `/blog` redirect to `/` temporarily; Blog removed from the nav (`site-nav.tsx`), footer (`sections.tsx`) and sitemap. Blog loaders now return an empty list when `blogs/` is empty or missing. `/nooks-alternative` and `/compare` now describe Nooks as it describes itself (checked on nooks.ai today) and no longer say "per seat". `CLAUDE.md` updated. The owner approved removing the posts.
- **Why:** about 2,100 impressions and 3 clicks in 16 months; the posts targeted dialer buyers, who are not the buyer, and stated things that were not true ("$25 in free credits", "hundreds of sales teams", invented performance figures).
- **Status:** committed (`9fecf03`), pushed. This replaces the Nooks post rewrite from 15:50 (branch `worktree-seo-blog-rewrite`, never merged; can be deleted). The blog routes and template still exist: to bring the blog back, add markdown to `blogs/`, remove the two temporary redirects and restore the nav, footer and sitemap entries. Next: write posts for the real buyer (lead response time, first-call questions, after-hours leads).

### 2026-10-11 16:25 · dev · Rebuilt `/justcall-alternative`, `/nooks-alternative` and `/compare` on the landing kit
- **What:** new `src/components/landing/comparison.tsx` (`COMPARISONS` data, `ComparisonPage`, `ComparisonIndex`); the three page files are now thin, like the solution pages. Uses the kit (`SectionHeader`, `CardGrid`, `ClosingCta`, `SiteNav`, `SiteFooter`), shadcn `Card` and `Table`, and lucide icons. `solution.tsx` now exports `CardGrid`, `surface`, `iconBox`, `Item`. Metadata (titles, descriptions, canonicals) is untouched.
- **Why:** the owner found the pages off-design: a solid blue header band, emoji check marks, default typography and spacing.
- **Status:** approved by the owner; committed and pushed to `main` in the same commit as this entry ("Rebuild comparison pages on the landing kit"). SEO agent, for your checker: the copy is the same apart from these changes — emoji and em dashes removed; the Nooks "pricing transparency" cards are folded into the table's pricing row; the JustCall footnote no longer points to "the calculator on our homepage" but links to `/#pricing`; the `/compare` h1 is now "Compare Laycal with dialers and phone systems." (was "Compare Laycal"). Checked at desktop width on the dev server; mobile width not checked.

### 2026-10-11 16:29 · seo · Blog is back with three posts for the real buyer
- **What:** added `blogs/how-to-measure-lead-response-time.md`, `blogs/what-to-ask-a-new-lead-on-the-first-call.md` and `blogs/what-happens-to-after-hours-leads.md`. Removed the temporary `/blogs` → `/` redirect (`/blog` → `/blogs` is permanent again); Blog restored in the nav (`site-nav.tsx`), footer (`sections.tsx`) and sitemap. Blog index and post titles and descriptions reworded (`src/app/blogs/`). Removed the newsletter popup from the post template (the `EmailPopup` component file is left in place, unused). `CLAUDE.md` updated.
- **Why:** the blog was empty after the six comparison posts were retired; these posts answer what the buyer actually searches for and link into `/speed-to-lead` and `/instant-lead-follow-up`. The popup promised a newsletter that does not exist.
- **Status:** committed (`55173f8`, merged on top of the dev rebuild of the comparison pages), pushed. No statistics, competitor names or customer claims in the posts; the one worked example is labelled as made-up. All three use the default social image as their banner; unique banners are still to do. The template cannot render markdown tables.

### 2026-10-11 17:16 · seo · Unique banners for the three blog posts
- **What:** added `public/assets/blogs/lead-response-time.png`, `first-call-questions.png` and `after-hours-leads.png` (1200x630) and pointed each post's `image:` at its own. They are drawn in code by `scripts/make-blog-banners.js` (SVG rendered with `sharp`): dark background, faint grid, one blue glow, a motif per topic, no text.
- **Why:** all three posts shared the default Laycal image on the blog index and when shared. No text in the banners because the post template lays the title over the image.
- **Status:** committed, pushed. To add a banner for a new post, add a motif function to the script and run `node scripts/make-blog-banners.js`. Not AI-generated; no credits spent.

### 2026-10-11 17:22 · seo · Banner step added to the blog-publishing workflow
- **What:** added a "Publishing a blog post" section to the `laycal-seo` skill (frontmatter, copy rules, banner via `scripts/make-blog-banners.js`, verify, indexing, log). Noted the script in `CLAUDE.md` (Pages and Commands).
- **Why:** the owner wants every new post to get its own banner without having to ask.
- **Status:** committed, pushed (`CLAUDE.md` and this file only; the skill lives outside the repo). No site change.

### 2026-10-11 17:30 · seo · Read Search Console's generative AI report; added `llms.txt` on a branch (not pushed)
- **What:** (1) Read the "Generative AI features" report for `laycal.com` (10 Jul – 9 Oct 2026): 99 impressions in Google's AI features in 3 months. By page: `/` 57 (plus 11 on the non-www address), `/sdr` 28, the Nooks post 5, `/speed-to-lead` 4, then 3 or fewer each. The report gives no queries or clicks. (2) Added `public/llms.txt`, a plain-text summary of Laycal for AI assistants (facts, what it is not, links to the public pages and posts), and a line in `CLAUDE.md` saying to keep it current.
- **Why:** the owner asked whether optimising for AI assistants helps; this gives a starting number and adds the one cheap technical item. There is little evidence the major assistants read `llms.txt`, so expect nothing from it.
- **Status:** `llms.txt` committed (`64b088d`); first held on a branch at the owner's request, then merged and pushed the same day once the owner approved. Checked locally: served as text, all 11 links in it resolve. No changes made in Search Console.

### 2026-10-11 17:57 · seo · `llms.txt` confirmed live; Capterra listing copy written
- **What:** `https://www.laycal.com/llms.txt` returns 200 as plain text and all 11 links in it resolve. The push of `c06e50f` did not trigger the deploy pipeline; the owner retriggered it by hand. Also wrote the owner's Capterra fields: long and short description, target market, AI capabilities, benefits and tagline, using the same wording as the G2 and Crunchbase listings.
- **Why:** closing out the AI-assistant step; matching text across directory profiles helps Google connect them.
- **Status:** no repo change beyond this entry (uncommitted, to go with the next commit). If a push does not deploy within about five minutes, the pipeline may need retriggering. Listings so far: Crunchbase live, G2 pending, Capterra being filled in.

### 2026-10-11 17:58 · seo · Owner: Capterra form done, indexing requested, LinkedIn page created
- **What:** the owner reports the Capterra form is complete, indexing was requested in Search Console for the three blog posts, and the LinkedIn company page exists. Not independently checked. The AI-assistant baseline test (ten buyer questions) is skipped for now at the owner's choice.
- **Why:** building the first legitimate links and company profiles; only 3 sites linked to Laycal on 2026-10-11.
- **Status:** no repo change (entry uncommitted). Listings: Crunchbase and LinkedIn live, G2 and Capterra submitted. Still open: AlternativeTo; adding the profile URLs to the site's Organization data (`sameAs`) once the owner sends them; an About page; re-read Search Console in early November. If the baseline test is run later, use a logged-out or temporary chat so the assistant's memory of the owner's own conversations does not skew it.

### 2026-10-11 18:05 · seo · Directory profiles linked from the site; SEO paused until early November
- **What:** added `sameAs` (Crunchbase, G2, Capterra, GetApp, Software Advice) and a one-line description to the Organization data in `src/components/landing/structured-data.tsx` (`PROFILES` list). The LinkedIn page exists but its URL was not provided, so it is not in the list yet.
- **Why:** tells search engines those profiles belong to Laycal, which helps Google recognise the company. The owner asked why Google says nothing for a "laycal" search.
- **Status:** committed, pushed. The profile sites block automated requests (403), so the URLs are as the owner gave them and were not opened by me. **SEO work is paused at the owner's request until early November 2026.** Then: re-read Search Console against the 2026-10-11 baseline (86 clicks and 5.3k impressions in 16 months; 99 AI-feature impressions in 3 months), check whether `/speed-to-lead` and `/instant-lead-follow-up` rank again, and decide the next content from that. Still open, not urgent: AlternativeTo listing, LinkedIn URL into `PROFILES`, an About page, `/status` placeholder data, mobile check of the pages built today.

### 2026-10-12 11:44 · dev · Hardening brief built (all three parts) — uncommitted, not live
- **What:** product's brief `laycal-product/specs/2026-10-12-hardening-brief.md`. One call starter for every call to a lead (`src/lib/leadCalls.ts`): credit check, the lead's own assistant, no double calls. Double form submissions make one lead. Leads stuck on "calling" get their real result. Empty balance: one attempt, a 402 answer, the lead says why. New lead wording and a "Not reached" filter. Four emails to the business (`src/lib/notifications.ts`, `mail.ts`) with Settings → Notifications. Tries again when nobody answers (10 min, 2 h, up to 3), optional holding outside calling hours, Call now / Stop calling, "Calling rules" on each assistant. A wake-up at `/api/cron/tick` plus a daily watchdog (`vercel.json`). New dependency: `nodemailer`.
- **Why:** the promise that every lead is called and the business sees the outcome broke quietly in several places; fixed before the first customer.
- **Status:** uncommitted. Checked end to end on a local test server against a stand-in phone system and a local mail catcher: no real call was placed and no real email sent. Not done: real-call checks, a real email through the owner's mailbox, and the cron-job.org job (needs the URL and header set by the owner; the browser here was not signed in). Needs `CRON_SECRET` and the four mail variables in Vercel before it works in production.
- **Decided with the owner:** later tries always stay inside calling hours (08:00–21:00), even with holding off.
- **Left alone on the owner's instruction:** the Google Forms script and `/api/webhooks/googleform`. So the brief's "update the note in the Google Forms script" is not done; a client's script log will show the new 402 answer as-is. The old googleform route still trusts an account id sent in the request.
- **Other agents:** the Vapi webhook no longer matches a lead by phone number alone. Product: do not announce the emails until this is live.

### 2026-10-12 11:45 · dev · cron-job.org job created, left switched off
- **What:** created the job "Laycal wake-up (every minute)" on cron-job.org for `https://www.laycal.com/api/cron/tick`, every minute, **inactive**. It has no `Authorization` header yet.
- **Why:** the address does not exist in production until the hardening work is deployed, and the job needs the secret; a job that fails repeatedly gets disabled by the service.
- **Status:** the owner still has to (1) add `CRON_SECRET` and the four mail variables to Vercel, (2) have the work pushed, (3) add the header `Authorization: Bearer <CRON_SECRET>` to the job under Advanced, and (4) switch the job on. I did not type the secret into the site.

### 2026-10-12 11:54 · dev · Hardening work committed and pushed
- **What:** everything in the "Hardening brief built" entry above is committed and pushed to `main` ("Harden lead calling…"). A production build passed locally first.
- **Why:** the owner approved it and reports the Vercel variables and the cron-job.org header are in place.
- **Status:** pushed; live once Vercel finishes deploying. Still to do after the deploy: confirm the cron job is switched on and `/api/cron/tick` answers it, one real Google Form submission, and the brief's real-call checks. The unrelated `.gitignore` change in the working tree was left out.

### 2026-10-12 11:58 · dev · Hardening work is live; wake-up confirmed on production
- **What:** `e5823d6` deployed. On `www.laycal.com`: `/api/cron/tick` answers 401 without the secret and 200 with it; the watchdog reports the wake-up as alive. The first run found 3 production leads stuck on "calling" and resolved them (looked up at the phone system; any that had ended uncharged were charged once).
- **Why:** to confirm the deploy and that `CRON_SECRET` in Vercel matches.
- **Status:** live. Not yet done: one real Google Form submission, the brief's real-call checks, a real email through the owner's mailbox. Whether the cron-job.org job is switched on was not checked from here.
