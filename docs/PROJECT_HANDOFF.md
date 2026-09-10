# Project Handoff / Running Log

**Read this first, before AGENTS.md's phase checklist.** This file is git-tracked so it
survives a machine reset — the Claude memory system under `~/.claude/projects/.../memory/`
does NOT survive a reset (it's local to the machine), so treat this file as the source of
truth for "what's actually going on" and update it each session.

Last updated: **2026-09-10**, by Claude (Sonnet 5) working with Sanjay.

---

## Reality check vs. AGENTS.md

AGENTS.md was written during the proposal/scaffold stage and stayed stale for months while
the app was actually built out. As of this writing:

- **The app is live in production** at `tjayaraj.com`, deployed via Vercel, with real firm
  data (real clients, real matters with `TJR/...` / `TJC/...` file refs, real hearings).
- Jayaraj's team is actively using and testing it. A colleague (handle "Faez" on WhatsApp)
  has been testing the calendar feature specifically and reporting bugs directly to Sanjay,
  who relays them here.
- This is **active maintenance/iteration on a live product**, not pre-launch build-out.
  Treat bug reports from testing as real production issues — real client data is at stake,
  be careful with anything destructive.

## Git remotes — important, easy to get wrong

This repo has **two** remotes:

- `tjayaraj-dev` → `https://github.com/Tjayaraj-dev/tjayarajlawfirmdashboard.git` —
  **this is the real one.** Confirmed via the Vercel dashboard (Deployments tab) that
  Production deploys are built from commits pushed here, on `main`. Local `main` tracks
  this remote by default.
- `origin` → `https://github.com/tjayarajds-web/lawfirmdashboard.git` — purpose unclear,
  never pushed to during this session. **Don't push here without asking Sanjay first** —
  it might be an old/abandoned fork, or it might matter for something not yet explained.

When in doubt: `git push` with no args pushes to whatever `main` tracks (`tjayaraj-dev`),
which is correct. Don't `git push origin main` without checking first.

## Deploy pipeline

- Push to `tjayaraj-dev/main` → Vercel auto-deploys to Production. Deploys typically go
  "Ready" within about a minute. Check `vercel.com/tj-ayaraj-lawfirm/tjayarajlawfirmdashboard/deployments`
  (Sanjay has access) to confirm a push actually built successfully before assuming a fix
  is live — a couple of times this session a fix "should have worked" per code review but
  needed the actual deployment confirmed before telling the user it's fixed.

## What got built this session (2026-09-06 to 2026-09-10)

Chronological, each already committed and pushed to `tjayaraj-dev/main`:

1. **`35d7b31`** — Calendar overhaul + daily digest + searchable pickers (the big one):
   - Calendar: Month/Week/Day view toggle, click an empty day to quick-schedule a hearing,
     click an event chip for a detail popover (instead of navigating away immediately),
     drag-and-drop to reschedule, urgency color coding (red within 3 days, amber within 7,
     distinct "overdue" treatment for past-due).
   - Daily email digest: `/api/cron/digest`, Resend-based, `CRON_SECRET`-gated, runs once
     daily via Vercel Cron (`vercel.json`, `0 23 * * *` UTC ≈ 7am Malaysia time). Admin gets
     a firm-wide digest; staff get only matters assigned to them. Skips recipients with
     nothing in their window (no "nothing today" spam).
   - New `src/lib/supabase/admin.ts` — service-role client, needed because the cron route
     has no user session and must read across all profiles/matters regardless of RLS.
   - Extracted `src/lib/case-events/upcoming.ts` (`getUpcoming()`) — shared by both the
     dashboard's "Upcoming Hearings" widget and the digest, replacing duplicated inline
     query/merge logic that used to live only in `dashboard/page.tsx`.
   - New dependency-free `src/components/ui/combobox.tsx` — searchable client/matter
     pickers, built on the existing `@base-ui/react`-backed `Popover` (not cmdk, not
     Radix — this codebase has never used either, stayed consistent).

2. **`b5a38ff`** — Added a "Remove" action to the calendar popover after a tester reported
   there was no way to delete a wrongly-scheduled hearing. Also fixed `softDeleteCaseEvent`
   missing a `/calendar` revalidation (archived events kept showing on the calendar).

3. **`2e70a2e`** — **Real bug, not a deploy issue**: clicking a calendar event chip did
   nothing at all. Root cause: `@dnd-kit`'s `DndContext` had no activation constraint, so
   the tiny, unavoidable pointer movement in a normal mouse click was being interpreted as
   the start of a drag, which swallowed the click before it ever reached the popover. Fixed
   with `useSensor(PointerSensor, { activationConstraint: { distance: 8 } })` — a drag now
   needs 8px of real movement before it starts, so plain clicks pass through. **If any other
   click-inside-a-draggable-element bug shows up anywhere else in the app, this is the first
   thing to check.**

4. **`52d7c80`** — Full event editing. Previously the app could only *create* or *archive*
   a logged event (court attendance, prison visit, Zoom session, etc.) — there was no way
   to edit one's fields anywhere in the app. Added `updateCaseEvent()` (mirrors
   `createCaseEvent`, keeps the event's `type` fixed since fields are type-specific) and
   extended `EventLogDialog` with an `editingEvent` mode that pre-fills every field. Wired
   into both the calendar popover ("Edit" button) and the matter page's event timeline
   (previously only had Archive/Delete in its dropdown). For a bare `next_hearing_at`
   marker with no logged event behind it, "Edit" is just a date/time picker — there's
   nothing else to edit for those.

## Environment gotchas — read before touching local dev

- **`npm run dev` points at LOCAL Supabase**, not production. `.env.local` has
  `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321` — standard, non-secret local demo keys
  (the comment in that file explains this). Production credentials (like
  `admin@tjayaraj.com`) will NOT work against local dev — they only exist in the real
  Supabase project. Don't be confused when a real login fails locally with
  `ECONNREFUSED 127.0.0.1:54321` — that just means local Supabase isn't running.
- **To run local Supabase**: `supabase start` (Supabase CLI). This needs Docker. As of this
  session, **this machine had no container runtime at all** — no Docker Desktop, no Colima,
  just the bare `docker` CLI with nothing backing it. Fixed by `brew install colima &&
  colima start`, which works but takes a few minutes and downloads a VM image.
- **Disk space warning**: this machine hit **177MB free (99% full)** during that Colima
  setup, which caused `supabase start`'s image pulls to fail with cryptic
  `input/output error` messages inside the VM. If Docker/Colima acts up again, run `df -h /`
  *first* before debugging containers — it's very likely disk space, not a Docker problem.
  Freeing the broken VM disk (`colima delete -f`) recovered ~7.6GB.
- **Never test mutating actions (drag-reschedule, create/delete) against production data.**
  Use local Supabase with a throwaway seeded user for anything that writes data.
- **Playwright MCP here needs a manual fix to work**: there's no real Google Chrome
  installed and no sudo access to install one. The fix used this session: download a
  Chrome-for-Testing binary via `npx playwright install chromium` (despite the name, this
  actually fetches a full Chrome-for-Testing.app, not just headless shell), then repoint the
  Playwright MCP server at it:
  `claude mcp add playwright -s user -- npx -y @playwright/mcp@latest --executable-path
  "<path to the downloaded Google Chrome for Testing binary>"`.
  **This requires restarting the Claude session/MCP connection to take effect** — it won't
  work in the same session you ran the `claude mcp add` command in. As a fallback within a
  single session, a standalone Node script using the `playwright-core` npm package (pointed
  at the same downloaded browser) works without needing the MCP server at all — see the
  approach used this session if that's needed again (a small script in a scratch npm
  project calling `chromium.launch({ executablePath: ... })`).

## Open threads / what to check next session

- Live-testing feedback loop is ongoing via WhatsApp with "Faez" — **ask Sanjay for the
  latest feedback before assuming the calendar is fully stable.** Two real bugs were found
  and fixed just from a few rounds of manual testing (click-swallowing, missing revalidate),
  so more may surface.
- AGENTS.md's "What might still be open from the original onboarding doc" section is
  genuinely unconfirmed — the app already has real branding, real firm data, and a real
  domain, which suggests most onboarding items got resolved through some channel (informal
  conversation with Jayaraj, not necessarily the formal onboarding doc). Worth a direct
  question to Sanjay rather than assuming either way.
- No automated test suite exists (Playwright E2E mentioned in AGENTS.md's Phase D was never
  actually set up). All verification this session was manual build/lint/typecheck plus
  live-user testing feedback. If Sanjay wants real E2E coverage, that's still fully open.
- The two-remote situation (`tjayaraj-dev` vs `origin`) was never explained — flagged to
  Sanjay once, never got a direct answer on what `origin` is for. Worth resolving so it
  doesn't cause a wrong-repo push mistake later.
