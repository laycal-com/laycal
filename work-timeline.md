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
