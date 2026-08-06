# Phase 5 review report — persistence, authentication, row-level security

Deliverable for Phase 5 ("database and security" — `04_DATA_MODEL_SCHEMA_AND_RESEARCH_PROTOCOL.md`'s
supplied SQL schema, seeding, authentication, RLS, private/internal/public policies, audit logs,
backup and export) per `CLAUDE.md` and the build-sequence document, built after the user
explicitly approved starting Phase 5 ("phase 5").

## 1. Scoping decisions made before writing any code

No Supabase project, credentials, or MCP connector existed in this session, and none could be
provisioned from here (confirmed via `ListConnectors` — only Figma and Vercel, no
Supabase/Postgres connector; confirmed via environment inspection — no `SUPABASE_*`/`DATABASE_URL`
vars set). Rather than silently skip Phase 5 or silently fabricate a working deployment, this was
flagged to the user with three explicit choices, all confirmed before writing code:

1. **"Write the code now, no live DB yet."** Every migration, seed script, mapper, auth
   integration and page in this phase is real, reviewable, type-checked, and unit/e2e-tested —
   but nothing in this session has run against an actual Postgres/Supabase instance. §7 below is
   an explicit account of what that does and doesn't cover.
2. **Email + password** as the sole sign-in method (Supabase's built-in auth, no OAuth/magic
   link/SSO in this phase).
3. **"Any authenticated user"** may read every classification tier, including
   `private`/`restricted` stakeholder and ownership data — the simplest correct RLS policy, not
   a permanent design. `supabase/migrations/0002_rls.sql`'s header documents the role-tiered
   policy (e.g. only `researcher`/`admin` roles read `restricted` rows) as the next step if
   finer-grained access is ever needed.

## 2. A privacy finding surfaced while building this phase

While designing the `/stakeholders` page, an existing, unrelated-to-Phase-5 issue became
impossible to ignore: **`src/data/action-architecture-data.json` is imported wholesale by
`src/data/rawBundle.ts` and `src/data/fullCatalogue.ts` as a single default-imported JS module.**
Because of that, every field in the file — including `fullResearchCatalogue.stakeholders`,
`ownership_links`, and the highly sensitive `cgi_relationships` (named CGI colleagues, personal
relationship-warmth notes about specific Action executives) — ships inside the client JS bundle
served to *every* visitor, signed in or not. This was true since Phase 0; Phase 4's "masking"
(§1 of `docs/PHASE4_REVIEW_REPORT.md`) only ever guaranteed the data wasn't *rendered*, not that
it wasn't *shipped*. Verified directly:

```
$ npm run build && grep -c "Frank Huiskes\|cgi_relationship_id" dist/assets/*.js
1
```

A real CGI staff name (present in the source JSON's private relationship-intelligence records)
is confirmed present in the production bundle today, reachable by anyone who fetches the JS
asset — with or without ever signing in.

**What this means for this phase's decisions:**

- Stakeholder full names and ownership hypotheses are still worth moving to Supabase-behind-RLS
  (which this phase does) — that's the *correct* channel, and matches the user's explicit choice
  to expose this data to any authenticated user. That the *old* JSON-bundle channel still leaks
  the same facts is a separate, pre-existing condition this phase did not introduce, but does not
  yet fix either (fixing it means splitting the client-bundled JSON from the full research
  bundle, a cross-cutting change to Phases 0–4's data-loading pipeline, out of scope for this
  pass — see §8).
- **CGI-relationship data is deliberately not wired into any page in this phase.** It is
  materially more sensitive than stakeholder records (it names specific CGI colleagues and
  internal warm-introduction notes), the supplied Postgres schema has no table for it (a real
  gap, not invented here), and — critically — rendering it from the local JSON bundle would not
  actually be access-controlled given the finding above. `/stakeholders` renders a clearly
  labelled panel explaining exactly this instead of silently omitting the product spec's
  "CGI-relaties" bullet or rendering it insecurely.
- This is flagged here in the report, in code comments (`StakeholdersPage.tsx`,
  `supabase/seed/mappers.ts`, `supabase/migrations/0001_schema.sql`), and directly to the user —
  not left for a future reviewer to rediscover.

## 3. What was built

- **`supabase/migrations/0001_schema.sql`** — the full schema from
  `04_DATA_MODEL_SCHEMA_AND_RESEARCH_PROTOCOL.md`, transcribed verbatim (25 tables, 9 indexes).
  One documented deviation: no `cgi_relationships` table exists in the supplied schema, and none
  is invented here (§2).
- **`supabase/migrations/0002_rls.sql`** — RLS policies for every table, in three tiers (has its
  own `classification` column / no column but not sensitive / no column and privacy-adjacent),
  implementing the "any authenticated user" posture from §1.
- **`supabase/seed/mappers.ts`** — pure, side-effect-free functions mapping every canonical JSON
  record type (vendors, systems, capabilities, commercial relationships, evidence, claims,
  architecture edges, technical observations, gaps, tasks, programmes, stakeholders, ownership
  links) plus every many-to-many join table to its Postgres row shape. Never reads
  `target_stakeholders_or_sources` or anything from `cgi_relationships` (§2). Fields with no
  column in the supplied schema (`evidence_sources.evidence_scope`, stakeholder
  seniority/mandate/status, task `next_action`) are folded into `notes` rather than silently
  dropped — documented in the file header.
- **`supabase/seed/seed.ts`** — idempotent seed runner (upsert-on-primary-key for every table, in
  FK-safe order). No-ops with a clear message if `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` are
  unset — verified directly (`npm run seed` with no env vars prints the no-op message and exits
  0, touching nothing).
- **`src/lib/supabaseClient.ts`** — the browser client (anon key), with `isSupabaseConfigured`
  as the single source of truth every consumer checks; `supabase` is `null` when unconfigured.
- **`src/auth/`** — `AuthContext.tsx` (session state, `signIn`/`signOut`), `gate.ts` (the pure
  `resolveGateOutcome` decision function — not-configured / loading / redirect / allow, in that
  precedence), `ProtectedRoute.tsx` (thin wrapper around `gate.ts`), `SignInPage.tsx`
  (email/password form, redirects to the originally-requested page on success).
- **`src/pages/StakeholdersPage.tsx`** — the first authenticated page: real stakeholder names,
  roles, and ownership hypotheses (resolved against the existing public catalogue for readable
  subject labels), fetched live from Supabase. Gated behind `ProtectedRoute`. Ships a clearly
  labelled "CGI relationships" gap panel per §2.
- **`src/pages/AdminPage.tsx`** — "Export all tables to JSON": fetches every table in
  `BACKUP_TABLES` (`src/lib/backup.ts`) with the signed-in session (so RLS applies exactly as it
  would for any researcher) and downloads one JSON file. Read-only; nothing is written back.
- Nav (`AppShell.tsx`) gained "Stakeholders" and "Admin" links, plus a Sign in/Sign out control
  that only renders when `isConfigured` is true.

## 4. Tests and validation

```
$ npx tsc -b --noEmit                 → clean
$ npx eslint .                        → clean (1 pre-existing-style warning: react-refresh/only-export-components
                                          on AuthContext.tsx exporting both the provider and the hook — informational,
                                          not an error, and not gated by --max-warnings anywhere in this project)
$ npm run build                       → clean (pre-existing chunk-size advisory only)
$ npx tsx scripts/validate-layout.ts  → 7/7 views, 0 failures (unchanged — this phase touches no architecture view)
$ npx vitest run                      → 11 files, 162 tests passed (138 pre-existing + 24 new... see breakdown below)
$ npx playwright test                 → 184 tests passed (92 checks × 2 viewports)
```

New Vitest coverage:

- **`tests/unit/seedMappers.test.ts`** (50 tests) — every mapper's field translation, the
  classification-mapping tiers, and — asserted with the most care — that `mapSystem` and `mapGap`
  never surface stakeholder-name content even when fed a record containing
  `target_stakeholders_or_sources`.
- **`tests/unit/stakeholderView.test.ts`** (8 tests) — the pure Supabase-row → display-model
  transform: sorting, per-stakeholder ownership-link filtering, subject-label resolution against
  the real public catalogue (domains and systems), and the unresolved/unrecognized fallbacks.
- **`tests/unit/backup.test.ts`** (8 tests) — `BACKUP_TABLES` matches the schema exactly with no
  duplicates and FK-safe ordering; `buildBackupPayload`'s success/error routing; filename
  sanitization.
- **`tests/unit/authGate.test.ts`** (4 tests) — all four branches of `resolveGateOutcome`.
- **`tests/unit/authContext.test.tsx`** (4 tests) — `AuthContext` against the *real* unconfigured
  state of this environment (no mocking needed, since `VITE_SUPABASE_URL`/`ANON_KEY` are
  genuinely unset here): reports `isConfigured=false`, `signIn` resolves a clear error instead of
  throwing, `signOut` no-ops safely, and `useAuth` throws outside a provider.

New Playwright coverage:

- **`tests/e2e/auth-unconfigured.spec.ts`** — against the primary build (no Supabase env vars,
  i.e. today's actual deployment state): `/stakeholders`, `/admin` and `/sign-in` all show the
  "not configured" panel; the nav shows no sign-in control; no stakeholder/CGI name ever renders
  on those routes; visiting `/stakeholders` makes zero network calls to any `supabase.co` host.
- **`tests/e2e/auth-configured.spec.ts`** — against a *second* build
  (`playwright.config.ts`'s second `webServer`, compiled with a fake `VITE_SUPABASE_URL`/
  `ANON_KEY` that is never actually contacted): visiting `/stakeholders` or `/admin` signed-out
  redirects to `/sign-in`; every Supabase HTTP call (`POST /auth/v1/token`,
  `GET /rest/v1/stakeholders`, `GET /rest/v1/ownership_links`) is intercepted via
  `page.route()` and fulfilled with fixtures matching Supabase's real, documented response
  shapes (verified against `@supabase/auth-js`'s source — `hasSession()` requires
  `access_token`/`refresh_token`/`expires_in`; error messages come from `error_description`);
  signing in redirects to `/stakeholders` and renders the mocked stakeholder and its resolved
  ownership-link subject label; a failed sign-in surfaces the mocked error message and stays on
  `/sign-in`.
- **`tests/e2e/privacy.spec.ts`** updated: the old blanket "no navigation link named
  'stakeholder' may exist" assertion is now obsolete by design (Phase 5 adds exactly that link,
  correctly gated — covered by the two files above) and was narrowed to what's still actually
  forbidden: no "CGI" navigation entry point exists anywhere.

## 5. Deviations / known limitations

- **No `cgi_relationships` table** in the supplied Postgres schema, and none invented. CGI
  relationship data is not rendered anywhere in this phase (§2).
- **The client-bundled-JSON exposure described in §2 is not fixed in this phase.** Stakeholder
  names and ownership hypotheses are *also* still present in the shipped JS bundle via the
  untouched `rawBundle.ts`/`fullCatalogue.ts` import path, even though `/stakeholders` correctly
  reads them from the RLS-protected Supabase channel. A real fix (splitting the source JSON into
  a client-safe file and a server/seed-only file) is a cross-cutting change to how Phases 0–4
  load data and was not made without explicit sign-off — flagged here and to the user rather than
  silently patched or silently ignored. **This must be resolved before any public or shared
  deployment of this app**, not just before Phase 5's own acceptance.
- **`architecture_views`/`architecture_view_groups`/`architecture_view_nodes`/
  `architecture_view_edges`** are in the schema and migrated, but the seed script does not
  populate them — the app still renders every curated diagram from the local JSON bundle.
  Migrating view rendering to Supabase is a larger change with no acceptance-test basis in
  `06_BUILD_SEQUENCE.md`'s Phase 5 bullet list and was left out.
- **`audit_events`** has a migration and RLS policy but nothing seeds it — it's an append-only
  log that starts empty by design.
- Everything in this phase is **written and tested but never run against a real Supabase
  project** (§1, §7) — no live database exists in this session.

## 6. Bugs found and fixed while building this phase

- **`mapVendor`/`mapCapability`/`mapSystemCapability` had narrower, ad-hoc parameter types**
  than every other mapper (which take `Record<string, unknown>`), which forced an `as never` cast
  at the one real call site (`supabase/seed/seed.ts`) to compile. Widened all three to
  `Record<string, unknown>` for consistency and removed the casts — caught by `tsc -b` once
  `supabase/**/*.ts` was added to `tsconfig.node.json`'s `include` (it wasn't type-checked by any
  config before this phase).
- **`AdminPage.tsx`'s `runExport` closed over the module-level `supabase` binding inside a
  `.map(async ...)` callback**, which `tsc` correctly refused to narrow past the outer
  `if (!supabase) return` guard (module bindings aren't narrowed across a closure boundary).
  Fixed by capturing it into a local `const client = supabase` before the closure.

## 7. What has and hasn't been verified against a live database

**Verified in this session**, without needing a live Postgres/Supabase instance:

- Every mapping function's field translation and edge cases (162 unit tests).
- The seed script's no-op path when unconfigured, and its table list/order against the actual
  migration file (`BACKUP_TABLES` and the seed's upsert order are asserted to match
  `0001_schema.sql`'s table list exactly).
- The full auth flow's *wiring* — redirect-when-signed-out, the exact HTTP contract
  `signInWithPassword`/PostgREST calls use, and how a successful response flows through
  `buildStakeholderView` into rendered DOM — via network-level mocking of Supabase's public,
  documented HTTP API (not its internal storage format), run in a real browser via Playwright.
- Every SQL statement is syntactically a direct transcription of the supplied schema (no
  hand-written DDL beyond that transcription).

**Not verified, and should be checked by whoever provisions the first real project:**

- That `0001_schema.sql` and `0002_rls.sql` actually apply cleanly to a real Postgres instance
  (constraint syntax, extension requirements, etc.) — never run against a real `psql`/Supabase
  SQL editor in this session.
- That `npm run seed` succeeds end-to-end against a real project (upsert conflict targets,
  actual FK ordering under real constraint checking, real API rate limits for ~1,000+ rows
  across 20 tables).
- That the RLS policies behave as intended under a real `anon` vs `authenticated` JWT (this
  session only mocked the HTTP responses; it never exercised Postgres's actual policy
  evaluation).
- Real email/password sign-up/invite flow (Supabase Auth's actual email delivery, confirmation
  links, etc.) — this phase only wires `signInWithPassword` against pre-existing users created
  manually in the Supabase dashboard (README §"Setting up Supabase" step 3).

## 8. Statement on later phases

The client-bundled-JSON exposure in §2/§5 is the most important open item: it means today's
*actual* privacy posture for stakeholder/CGI data rests entirely on "the UI never renders it,"
not on real access control, for anything not yet migrated to Supabase. Fixing it — splitting
`src/data/action-architecture-data.json` into a client-safe subset (used by
`rawBundle.ts`/`fullCatalogue.ts`) and a full, server/seed-only copy (used by
`supabase/seed/seed.ts`) — is the natural next step and was deliberately not done here without
explicit sign-off, given its cross-cutting effect on Phases 0–4's stable, already-approved data
pipeline.

A `cgi_relationships` Postgres table (with its own RLS tier, likely more restrictive than
"any authenticated user") is the other clear next step if CGI-relationship intelligence is meant
to ever appear in the product — deliberately not decided unilaterally in this phase given how
sensitive that specific dataset is.
