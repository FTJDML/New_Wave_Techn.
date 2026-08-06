# Action Architecture Workbench

An enterprise-architecture visualization tool for Action, built as a phased, gate-approved
project. Each phase in this history was reviewed and explicitly approved before the next began
(see `docs/PHASE1_REVIEW_REPORT.md` through `docs/PHASE4_REVIEW_REPORT.md` and
`docs/PHASE5_REVIEW_REPORT.md`).

## Getting started

```bash
npm install
npm run dev
```

The app runs fully in **local-JSON mode** with no further setup — every page except
`/stakeholders` and `/admin` reads from the bundled `src/data/action-architecture-data.json` and
needs no database or credentials. This is the mode every clone of this repo starts in.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Typecheck (`tsc -b`) then production-build |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc -b --noEmit` |
| `npm test` | Vitest unit tests |
| `npm run test:e2e` | Playwright end-to-end tests (builds first — see below) |
| `npm run validate:layout` | Deterministic layout validator for every curated architecture view |
| `npm run seed` | Idempotent Supabase seed script — no-ops with a clear message if Supabase isn't configured |

## Setting up Supabase (Phase 5 — persistence, auth, RLS)

Stakeholder names, ownership hypotheses and the `/admin` backup export require a real Supabase
project. Everything else in the app works without one.

1. **Create a project** at [supabase.com](https://supabase.com) (or point at a self-hosted
   instance — anything speaking the Supabase Postgres/Auth/PostgREST APIs works).
2. **Apply the schema**, in order, via the Supabase SQL editor or `psql`:
   ```
   supabase/migrations/0001_schema.sql   -- tables + indexes
   supabase/migrations/0002_rls.sql      -- row-level security policies
   ```
3. **Create at least one user** under Authentication → Users (email + password) — this is the
   only supported sign-in method (`src/auth/AuthContext.tsx`). The RLS policies in
   `0002_rls.sql` grant *any* authenticated user full read access, including
   `private`/`restricted` rows — see that file's header comment for why, and for the
   role-tiered policy that's the documented next step if finer-grained access is ever needed.
4. **Seed the data**: from your project's Settings → API page, copy the **Project URL** and the
   **service_role** key (not the anon key — the seed script needs to bypass RLS to write), then:
   ```bash
   SUPABASE_URL=https://<your-project>.supabase.co \
   SUPABASE_SERVICE_ROLE_KEY=<service-role-key> \
   npm run seed
   ```
   This is safe to re-run — every table is seeded via upsert on its primary key, so running it
   again converges rather than duplicating rows. It does **not** seed `architecture_views`,
   `architecture_view_groups/nodes/edges`, or `cgi_relationships` — see
   `docs/PHASE5_REVIEW_REPORT.md` §5 for why.
5. **Point the app at it**: copy `.env.example` to `.env.local` and fill in the **Project URL**
   and **anon (public)** key (not the service-role key — that one must never reach the browser):
   ```
   VITE_SUPABASE_URL=https://<your-project>.supabase.co
   VITE_SUPABASE_ANON_KEY=<anon-key>
   ```
   Restart `npm run dev`. The nav bar will now show a "Sign in" control, and `/stakeholders` /
   `/admin` will load real data instead of the "Persistence is not configured" panel.

### What has and hasn't been run against a live database

This phase's SQL, seed script and mapping logic were written and unit-tested (162 Vitest cases
covering every row mapper, the auth-gating decision logic, and the backup payload shaping) plus
exercised end-to-end in Playwright against a build with a *fake, network-mocked* Supabase project
(`tests/e2e/auth-configured.spec.ts`) — but never against a real Supabase project, since none was
provisioned for this work. See `docs/PHASE5_REVIEW_REPORT.md` for the full account of what's
verified versus what a real deployment should double-check first.

## Testing

```bash
npm test              # unit tests (Vitest)
npm run test:e2e       # end-to-end tests (Playwright — builds two static bundles first,
                        # one without Supabase configured and one with a fake project, so both
                        # the unconfigured and configured auth paths get real browser coverage)
npm run validate:layout
```
