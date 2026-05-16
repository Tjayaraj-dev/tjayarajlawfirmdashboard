<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# T. Jayaraj Law Dashboard — Legal Operations Digitalization

Internal ERP for **T. Jayaraj & Company**, a Malaysian law firm.
Built by **Aurexis Solution** (Sanjay Gunabalan, founder).

## Commercials & constraints

- **Build:** RM 5,000 fixed (30% deposit / 30% phase 2 / 40% handover)
- **Retainer:** RM 300/mo — 24/7 monitoring, backups, security patches, WhatsApp support, 1hr/mo minor edits
- **Timeline:** 3 weeks, 3 sprints
- **Scope creep:** RM 150/hour, billed separately

**Margin math (per month):**
```
RM 300 retainer
- RM 115  Supabase Pro
- RM   1  Cloudflare R2 (backup)
- RM   0  Vercel / Resend / UptimeRobot (free tiers)
= RM 184  gross profit (~61% margin)
```

**Implication for design decisions:** don't suggest paid services that erode this margin. Free tiers are intentional. If a third-party tool is needed, it must be genuinely required, not "nice to have."

## Stack — locked

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 16 (App Router) + React 19 + TypeScript** | Server Actions, RSC, React Compiler enabled by default |
| Styling | **Tailwind v4** | CSS-first config (no `tailwind.config.ts` — uses `@theme` in CSS) |
| UI | **shadcn/ui** | Ship fast, professional default look |
| Tables | **TanStack Table v8** | Case/document grids with sort/filter |
| DB + Auth + Storage | **Supabase Pro** ($25/mo, Singapore region) | Pro non-negotiable: auto-pause on free kills production; PITR enables real "triple-redundant" claim |
| Hosting | **Vercel** (free tier) | One-click deploys, preview envs |
| Email | **Resend** (free 3k/mo) | Notifications, password reset |
| Off-vendor backup | **Cloudflare R2** | Nightly `pg_dump`, third backup layer |
| Monitoring | **UptimeRobot** (free) | Delivers the "24/7 monitoring" retainer claim |
| MFA | **Supabase TOTP** | Required for admin role |

**Note:** Tailwind v4 has a fundamentally different config story than v3 — there is NO `tailwind.config.ts` file. Theme tokens go in `src/app/globals.css` via `@theme { ... }`. Don't reach for v3 patterns.

## Schema plan (Module 1 — Client Vault)

```
profiles              auth.users join — role (admin|staff), full_name, email
clients               id, name, ic_or_company_no, contact, address, type, created_by, deleted_at
matters               id, client_id, file_ref, title, case_type_id, status, opened_at,
                      next_hearing_at, opposing_counsel, judge_court, assigned_to, deleted_at,
                      custom_fields (jsonb)  -- absorbs client-specific extras
case_types            id, name, slug                    -- editable lookup
document_categories   id, name, slug                    -- editable, seeded with the 6 defaults
documents             id, matter_id, category_id, filename, storage_path, version,
                      mime_type, file_size, uploaded_by, deleted_at
case_events           id, matter_id, event_type, notes, occurred_at, created_by
audit_log             id, actor_id, action, resource_type, resource_id, payload (jsonb), at
firm_settings         singleton — name, bar_council_no, logo_url, primary_hex, sender_email, retention_years
```

**Defaults seeded into `document_categories`:** Pleadings, Affidavits, Correspondence, KYC, Evidence, Invoices.

**`case_types` and `practice_areas`** start empty — populated via admin UI once client returns onboarding doc.

## Security & compliance — non-negotiables

1. **RLS fail-closed.** Default deny on every table. Grants are explicit per role. Test policies with `set role authenticated; set request.jwt.claim.sub = '...'` in SQL editor before considering them done.
2. **Soft-delete only.** Never hard-delete. `deleted_at` column on all client/matter/document tables. RLS hides soft-deleted from staff; admin can see + restore.
3. **Audit log is append-only.** Every read of client data, every mutation, logged via Supabase Postgres trigger or server action wrapper. Lawyers get audited by Bar Council — they need to answer "who saw this file."
4. **MFA mandatory for admin role.** TOTP enabled at Supabase Auth level. Staff role optional but encouraged.
5. **File versioning** — replacing a contract without retaining the prior version is a malpractice risk. New upload of same filename = new row with incremented `version`, old row preserved.
6. **Retention: 7 years post-matter-closure** (Bar Council Malaysia default). Stored in `firm_settings.retention_years` — configurable.
7. **Signed URLs only** for document downloads. Never expose Supabase Storage public URLs.
8. **PDPA Malaysia:** firm is the data controller, Aurexis is the processor. Proposal disclaims breach liability for compromised partner passwords / staff negligence — design supports this (audit log + MFA + per-user accounts).

## User model — pushed back on client preference

Client initially asked for shared login. **We refused** because:
- Audit log meaningless with shared credentials
- PI insurance claims void with shared credentials
- RLS is pointless without per-user identity
- Bar Council audit can't be answered

**Agreed model:** 1 admin (Jayaraj) + 2-5 staff (each with own login). Sits within Supabase free Auth tier easily.

## Backup strategy — "triple-redundant" delivered honestly

1. **Layer 1:** Supabase Pro daily auto-backup (7-day retention, included)
2. **Layer 2:** Supabase Pro PITR (point-in-time recovery, 7-day window, included)
3. **Layer 3:** Nightly `pg_dump` → Cloudflare R2 (off-vendor copy, ~RM 1/mo)

All three independent. PITR is what makes this truthful — on free tier we couldn't deliver layer 2.

## Project phases & status

- [x] **Phase 0 — Proposal & onboarding doc sent.** Client onboarding doc issued; client filling.
- [ ] **Phase A — Foundation (no client input needed).** Scaffold, schema, RLS, auth, app shell, deploy pipeline. *In progress.*
- [ ] **Phase B — Generic CRUD.** Clients, matters, documents, audit log, soft-delete UI.
- [ ] **Phase C — Client-specific config.** Practice areas, doc categories, users, branding, dashboard widgets. *Blocked on onboarding doc reply.*
- [ ] **Phase D — Hardening & launch.** Security review, Playwright E2E, training, domain, handover.

## What's blocked on the onboarding doc reply

- Specific case-file custom fields beyond universal ones → `matters.custom_fields` jsonb
- Practice area taxonomy (Civil / Conveyancing / Family / Corporate / etc.)
- Document categories beyond the 6 universal defaults
- User names + emails for invites
- Specific access restrictions beyond admin/staff
- Firm branding (logo, hex codes, fonts)
- Sender email for notifications (e.g. `no-reply@jayarajco.com`)
- Domain choice (top 3 preferences)
- Sample test documents

When their reply lands, slotting in = 1-2 days, not a rebuild.

## Coding conventions

- **No premature abstractions.** Three similar lines is fine. Wait for the fourth before abstracting.
- **No comments unless WHY is non-obvious.** Identifiers do the WHAT job.
- **No feature flags or backwards-compat shims.** Change the code.
- **No error handling for impossible cases.** Trust framework guarantees. Validate at boundaries only.
- **Server Actions over API routes** unless there's a reason.
- **Form state with React Hook Form + Zod** — type-safe end to end.
- **Don't add fancy logging libraries.** Console + Supabase logs are enough. Audit log is the real audit trail.
- **Before writing Next.js-specific code**, check `node_modules/next/dist/docs/` — Next.js 16 has breaking changes vs prior knowledge.

## Files of interest (will populate as we build)

- `src/app/` — Next.js routes (App Router)
- `src/app/(auth)/` — login, signup, password reset
- `src/app/(app)/` — protected admin + staff routes
- `src/lib/supabase/` — server + browser + middleware clients
- `src/lib/auth/` — role types and guards
- `src/middleware.ts` — auth gate
- `supabase/migrations/` — SQL migrations (versioned)
- `supabase/seed.sql` — default doc categories, dev users
- `src/components/ui/` — shadcn primitives
- `src/components/app/` — feature components

## Linked context (memory)

- User profile: `~/.claude/projects/.../memory/user_sanjay.md`
- Project context: `~/.claude/projects/.../memory/project_jayaraj_law_erp.md`
- Proposal PDF: `docs/proposal.pdf` (gitignored)
- Onboarding checklist (outbound to client): `docs/onboarding-checklist.pdf` (gitignored)
