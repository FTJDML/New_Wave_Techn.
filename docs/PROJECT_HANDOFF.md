# Action Architecture Workbench — project handoff

This document is written so a **fresh Claude Code session with no prior context** can read it
once and pick up this project exactly where it stands. It explains what the tool is, why it was
built the way it was, how it actually works end to end, and where to look for anything not
covered here. Read this alongside `docs/DATA_MODEL.md` (the data schema in detail) before making
any change.

If you were handed a zip of this repo plus this file: unzip it, `npm install`, `npm run dev`, and
you have the exact same app this document describes — no external service required for anything
except the two Supabase-gated pages (`/stakeholders`, `/admin`), which the app runs perfectly well
without.

---

## 1. What this is

Action (the Benelux/European variety retailer) wanted an internal, visual map of its IT vendor
landscape — every confirmed system, every confirmed supplier relationship, and every place the
picture is still genuinely unknown — built entirely from **public evidence** (job postings, vendor
case studies, cookie statements, technical scans of Action's own web/app properties) rather than
from any privileged internal source. This app is that map: a click-through, evidence-linked
architecture diagram plus a set of catalogue pages (systems, suppliers, evidence, gaps) behind it.

It is **not** a generic diagramming tool and **not** an auto-layout graph visualizer. Every pixel
of every diagram is hand-placed by a human (or an AI agent acting as one) who has looked at the
evidence and decided where a box belongs and which lines should connect it to what. That
constraint — no auto-layout, ever — is the single most important design decision in this codebase
and explains a large fraction of the code you'll find (see §3.2).

## 2. Why it was built this way — the guiding principles

These principles were established at the start of the project and have held for every phase and
every later patch since. If you're extending this app, follow them; if a request conflicts with
one of them, that conflict is worth surfacing rather than silently resolving.

1. **Evidence over assumption, always.** Nothing gets marked "Current" on the strength of a guess.
   Every node on every canvas either cites a real, checkable source (a URL, ideally) or is
   explicitly rendered as a `TO FIND` gap. There is no third option — no node is ever "probably
   fine, didn't check."
2. **Never conflate confidence levels.** A system that appears in a five-year-old vendor case study
   is `historical`, not `current`. A system visible only in a screenshot is `visually_confirmed`,
   not `current`. A capability whose existence is confirmed but whose vendor is not is
   `capability_confirmed`, never attributed to a guessed vendor. This distinction is load-bearing
   throughout the whole app — see the `DeploymentStatus` union in `src/types/architecture.ts` and
   the legend in `AppHeader.tsx`.
3. **Unknowns are first-class, not hidden.** A gap in knowledge (which vendor supplies the
   in-store payment terminals? what replaces the legacy POS?) is rendered as a real `TO FIND` card
   with a priority (P0–P3), not omitted because "we don't know yet." Hiding an unknown to make the
   diagram look more complete is treated as a correctness bug, not a cosmetic choice.
4. **No fabricated vendors, ever.** When a capability is confirmed but the specific supplier isn't,
   every prompt and every patch in this project's history has carried an explicit guardrail
   against guessing a plausible-sounding vendor name to fill the gap. This shows up throughout the
   commit history as "do not assign vendor X without direct evidence" instructions, and the app's
   data model supports a component having no `vendor_id` at all for exactly this reason.
5. **Hand-curated layout, not auto-layout.** Diagramming libraries that auto-place nodes produce
   readable-looking graphs that lie about structure (an auto-layout algorithm doesn't know that
   "Payment terminal hardware" belongs conceptually next to "Adyen" even though there's no
   confirmed edge yet). Every view in this app is a **hand-authored coordinate system** — see §3.2.
6. **Read-only research trail with a promotion workflow.** Early phases treat the catalogue as
   read-only build data; Phase 4 added a local (`localStorage`-backed) editing workflow so a
   researcher can log new evidence, promote a "technically observed" signal to a confirmed claim,
   and track gap-resolution tasks — but every edit is still evidence-gated (a promotion requires a
   citing claim + a note, not just a status flip). See §3.6.
7. **Privacy by construction.** Real people's names (stakeholders, CGI/consulting contacts) are
   never rendered in the public-facing UI — they're modelled in the data (for internal ownership
   tracking) but gated behind Supabase auth on `/stakeholders` and `/admin`, and there's a
   dedicated Playwright test suite (`tests/e2e/privacy.spec.ts`) whose entire job is asserting that
   no name ever leaks into the unauthenticated UI.
8. **Every change ships behind the same gate.** Layout validator (0 failures) → typecheck → lint →
   unit tests → Playwright (both viewport projects) → screenshot review, in that order, before
   anything is called done. This is why the repo has as much test/validation code as product code.

## 3. How it works

### 3.1 Tech stack

Plain, boring, deliberately low-dependency:

- **React 19 + TypeScript (strict) + Vite 8** — SPA, `react-router-dom` v7 for routing
  (`BrowserRouter`), no server-side rendering.
- **No UI framework, no CSS framework.** Every component has a hand-written CSS Module
  (`*.module.css`) next to it. No Tailwind, no MUI — a deliberate choice to keep the visual
  language exactly as specified rather than inheriting a framework's defaults.
- **No canvas/diagramming library** (no React Flow, no D3-force, no Cytoscape). The "canvas" is a
  plain absolutely-positioned `<div>` tree for nodes/groups plus a single SVG overlay for edges,
  driven entirely by numbers already sitting in the data (see §3.2). This was a deliberate
  build-vs-buy call: every off-the-shelf graph library assumes either auto-layout or a much looser
  visual contract than "this exact box goes at these exact pixels."
- **Supabase** (Postgres + Auth + PostgREST), entirely optional, for the one part of the app that
  needs real persistence and access control: stakeholder names and ownership hypotheses (Phase 5).
  The app runs 100% functionally without it — see `src/auth/gate.ts` for the "is Supabase
  configured" check that every gated page uses to fall back to a "not configured" panel instead of
  crashing.
- **Vitest** (unit) + **Playwright** (E2E, two viewport projects: `desktop-1440` and
  `desktop-1920`) + a **hand-written deterministic layout validator**
  (`scripts/validate-layout.ts` + `scripts/layoutRules.ts`) that is arguably the most important
  test in the repo — see §3.5.

### 3.2 The rendering model — hand-curated coordinates, not auto-layout

This is the part most likely to surprise someone used to typical graph-visualization apps, so
read it carefully before touching any view.

An **`ArchitectureView`** (`src/types/architecture.ts`) is a plain, static, literal object:

```ts
{
  id: 'store-checkout',
  title: 'Store & Checkout',
  canvas: { width: 1560, height: 940, initialScale: 0.75, minScale: 0.4, maxScale: 1.8, ... },
  rules: { autoLayout: false, draggableNodes: false, maxVisibleTopLevelCards: 17, ... },
  groups: [ { id: 'sc-core', label: '...', x: 40, y: 30, w: 1480, h: 480 }, ... ],
  nodes: [ { id: 'sc-adyen', kind: 'satellite', groupId: 'sc-core', x: 800, y: 80, w: 180, h: 120, ... }, ... ],
  edges: [ { id: 'sc-e01', source: 'sc-ctac-xv', target: 'sc-target-pos', points: [[200,80],[200,65],[1350,65],[1350,80]], ... }, ... ],
}
```

Every `x`/`y`/`w`/`h` and every edge `points` polyline is a **literal number chosen by hand**
(originally by a human architect, and in every later patch by an AI agent reasoning about
geometry the same way a human would: "this box is 220px wide, the neighbouring box starts at
x=340, so there's a 20px gap — safe"). `rules.autoLayout` is a `false` literal in the type itself —
there is no code path that computes a layout. `ArchitectureCanvas.tsx` and its children
(`GroupLayer`, `NodeLayer`, `EdgeLayer`) are pure renderers: they read the numbers and paint boxes
and SVG polylines at those exact coordinates, apply pan/zoom (`useCamera.ts`) on top, and do
nothing else layout-related.

**The 7 curated views** live in two files:
- `src/data/curatedView.ts` — the "Total Architecture" overview (all domains, one screen).
- `src/data/deepDiveViews.ts` — the 6 per-domain deep dives: Store & Checkout, Digital Experience
  & Online Commerce, ERP/Planning & Supply Execution, Data & Customer Intelligence, People &
  Service Management, Integration/Cloud & Security Foundation.

Each node's `catalogRefs: string[]` points back into the real research catalogue (see §3.3) — the
canvas node is a *presentation* of one or more catalogue components, never a duplicate data
source. When you click a node, the drawer resolves those refs and shows the full catalogue record.

**Why hand-placement instead of a graph library:** an auto-layout algorithm optimizes for edge
crossings and node spacing with no idea which relationships are *confirmed* versus *investigative*
versus *entirely absent* — it will happily draw a straight, confident-looking line between two
boxes that have no evidenced relationship at all, or bury a `TO FIND P0` gap in a visually
unremarkable corner because the algorithm had no reason to foreground it. Every layout decision in
this app — which nodes sit in the same visual row, which edge crosses which, how a
`capability_confirmed` node is styled differently from a `current` one — is itself part of the
research finding being communicated, not an incidental rendering detail. That's worth the
significant extra hand-authoring cost, and it's why "hand-place it, then run the validator" is the
workflow for every patch, however small.

### 3.3 The data layer — two catalogues, one file

Everything (except stakeholders/ownership, which live only in Supabase once configured) is one
JSON file: **`src/data/action-architecture-data.json`**. It has two independent catalogues inside
it — read `docs/DATA_MODEL.md` for the full field-by-field schema, but the short version:

- **`coreSystemCatalogue`** — the *original*, smaller, hand-authored catalogue that seeded the
  Total Architecture view early in the project (26 vendors, 69 systems). Largely superseded by the
  one below; kept for history/traceability, not actively extended.
- **`fullResearchCatalogue`** — the **real, actively-maintained catalogue** that every deep-dive
  view, every catalogue page (`/systems`, `/suppliers`, `/evidence`, `/to-find`), and the detail
  drawer all read from (`src/data/fullCatalogue.ts` is the sole reader). This is where you add a
  vendor, a component, an evidence source, a claim, a commercial relationship, or a research gap.
  It also contains `architecture_views`/`architecture_groups`/`view_nodes`/`view_edges` arrays —
  **these are dead weight for rendering**: they exist only because the Supabase schema
  (`supabase/migrations/0001_schema.sql`) has matching tables for a possible future
  server-persisted view editor, but the seed script deliberately does **not** seed them (see
  `docs/PHASE5_REVIEW_REPORT.md` §5) and the live app never reads them — the real view geometry is
  the hand-authored TypeScript in `curatedView.ts`/`deepDiveViews.ts` described in §3.2.

`src/data/rawBundle.ts` just imports the JSON with a type cast; `curatedView.ts` and
`fullCatalogue.ts` are the two "typed API" layers on top of it that the rest of the app imports
from — never import the raw JSON directly outside those two files.

### 3.4 Status taxonomy — the vocabulary that carries the actual research finding

`DeploymentStatus` (`src/types/architecture.ts`) is intentionally small and has grown by exactly
one or two values at a time, each time a genuinely new evidentiary situation came up that the
existing vocabulary couldn't honestly describe:

| Status | Means | Renders as |
|---|---|---|
| `current` | Confirmed, in production today | Green |
| `likely_current` | Strong but not first-party evidence | Green (lighter semantics via evidence badge) |
| `transition` | Actively being replaced | Orange |
| `target` | The confirmed *replacement*, not yet live | Blue |
| `legacy` / `historical` | Was true, current 2026 scope not confirmed | Grey |
| `suspected` | Inferred, not confirmed | Amber |
| `visually_confirmed` | Seen in a photo/screenshot only — model/fleet scope unknown | Amber |
| `capability_confirmed` | The *capability* is confirmed; the *vendor* is not | Amber |
| `unknown` | No evidence at all — this is what `TO FIND` gap cards use | (no badge — see below) |

Two important asymmetries to know about:
- A `kind: 'gap'` node (`GapNode.tsx`) **never renders a `StatusBadge`** on the canvas — it only
  shows "TO FIND" + a priority chip. Its `status` field is still set and still meaningful (e.g. a
  gap that's mid-transition carries `status: 'transition'`), but that nuance only surfaces in the
  drawer/catalogue table, not on the canvas card. This is intentional, not a bug — don't "fix" it
  by adding a badge to `GapNode` without checking whether that changes the visual contract every
  existing gap card relies on.
- `EvidenceStatus` is a *second*, independent axis (how strong is the proof) layered on top of
  `DeploymentStatus` (what is the finding). A node can be `current` + `confirmed_first_party`
  (rock solid) or `current` + `technically_observed` (weaker, should probably not actually be
  `current`) — the combination is what a careful reviewer checks, not either field alone.

### 3.5 The layout validator — why it exists and what it actually checks

`scripts/validate-layout.ts` (using rules in `scripts/layoutRules.ts`) is a **deterministic,
non-visual** check that every hand-placed coordinate is geometrically sane, run via
`npm run validate:layout`. Because there is no auto-layout to fall back on, a hand-edited
coordinate can silently produce an unreadable diagram (two boxes overlapping, an edge slicing
through an unrelated node, a group's own label text buried under a card) — this script is what
catches that before a human ever has to eyeball a screenshot. It checks, per view:

- Unique IDs across nodes/groups/edges; every `groupId`/`source`/`target`/`catalogRefs` reference
  actually resolves.
- Every node fits inside its own canvas bounds and inside its own group's rectangle.
- No two nodes overlap; no two groups overlap.
- `maxVisibleTopLevelCards` / `maxVisibleGaps` per-view caps aren't exceeded (this is a **content**
  cap — it counts every node including gaps — not just a visual density limit, and is deliberately
  low so a view can't quietly become an unreadable wall of boxes).
- No edge polyline crosses through an unrelated node's rectangle, or through a group's label text
  zone.
- No two *unrelated* edges cross each other (edges that share a source or target node are exempt
  from this check against each other — a fan of edges radiating from the same box is expected and
  fine). Crossing detection uses strict inequalities, so two edges that share a collinear boundary
  line, or that touch at exactly a shared endpoint, are correctly not flagged — this is relied on
  throughout `deepDiveViews.ts` as a legitimate routing technique, not an accident.
- Every node with a `vendorId` resolves to a real entry in the logo registry.

**Every one of these is a real failure mode this app has actually hit** during development — this
isn't defensive boilerplate, it's the accumulated list of ways a hand-placed diagram silently goes
wrong. When you add or move a node, run this script *before* running Playwright — it's much faster
and gives you the exact geometric reason something's wrong (e.g. "Edge sc-e14 and sc-e16 cross"),
where a screenshot only shows you the symptom.

### 3.6 The research/editing workflow (Phase 4)

The catalogue is build-time JSON, but a researcher still needs to log new findings without a code
deploy for every single edit. `src/research/store.ts` implements a small `localStorage`-backed
overlay: new evidence sources, claims, and research-task updates are stored as a local diff on top
of the JSON catalogue (`mergedSources()`/`mergedClaims()` in `src/research/store.ts` merge the two
at read time), with an audit log of every change. Key guardrails baked into this layer, not just
suggested by convention:
- Promoting a "technically observed" signal to a real claim (`PromoteObservationForm.tsx`) is
  blocked in code unless the researcher supplies both a citing source and a note — you cannot
  promote on a bare click.
- A `TO FIND` gap's status machine (`GapStatusControl.tsx`) only offers the *valid next*
  transitions for its current state, and resolving a gap requires a written resolution summary.
- CSV import (`src/lib/csv.ts` + `ResearchPage.tsx`) previews rows before committing and silently
  drops (with a visible count, never silently) anything that fails validation
  (`src/research/validation.ts`).

This is genuinely local-only (nothing here writes to Supabase) — it's a researcher's personal
scratch layer for logging findings ahead of the next data-file patch, not a shared multi-user
system. Multi-user shared editing was explicitly out of scope for this phase.

### 3.7 Route map

| Route | Page | Notes |
|---|---|---|
| `/architecture` | Total Architecture | `curatedView.ts` |
| `/architecture/store`, `/digital`, `/erp-supply`, `/data`, `/people-service`, `/foundation` | The 6 deep dives | `deepDiveViews.ts`, one `ArchitectureViewPage`/`DomainDeepDivePage` per view, shared canvas |
| `/architecture/providers` | Providers & Partners | Plain card grid, not a canvas — `src/lib/providersView.ts` + `ProvidersPage.tsx` |
| `/systems`, `/suppliers`, `/evidence`, `/to-find` | Read-only catalogue tables | `fullCatalogue.ts` + `DataTable`/`FilterPanel` |
| `/research` | Phase 4 editing workflow | Evidence forms, gap status, CSV import, audit history |
| `/stakeholders`, `/admin` | Supabase-gated | Real names; "not configured" fallback panel when Supabase isn't set up |
| `/sign-in` | Supabase-gated | Only shown when Supabase *is* configured |

Every architecture route supports `?node=<id>` deep-linking straight into a node's drawer, and the
Total Architecture view supports PNG export (`html-to-image`).

## 4. Build history (why the codebase looks incrementally layered)

The project was explicitly built as **gate-approved phases** — every phase reviewed and signed off
before the next began (`docs/PHASE1_REVIEW_REPORT.md` … `PHASE5_REVIEW_REPORT.md`), followed by
several **content patches** once the base app existed. If you're trying to understand why a
particular file exists or looks the way it does, this order explains most of it:

1. **Phase 0–1**: scaffold, data layer, the canvas renderer, the layout validator, the first
   curated Total Architecture view.
2. **Phase 2**: the read-only catalogue (`/systems`, `/suppliers`, `/evidence`, `/to-find`), search
   palette, PNG export, deep-linking.
3. **Phase 3**: the 6 domain deep-dive views (this is where `deepDiveViews.ts` was born) and the
   shared-canvas generalization that made `ArchitectureCanvas` accept any `ArchitectureView`.
4. **Phase 4**: the local research-editing workflow described in §3.6.
5. **Phase 5**: Supabase — schema, RLS, auth, the two gated pages, backup/export. Never run against
   a real Supabase project (only unit-tested and E2E-tested against a network-mocked fake one) — a
   real deployment should double-check this first, see `docs/PHASE5_REVIEW_REPORT.md`.
6. **"Content and Provider Patch v2.2"** and later ad-hoc patches: added previously-missing but
   already-knowable vendors (Mendix/STEP MDM, and later a large batch of ~12 more), built the
   Providers & Partners page and the provider-overlay toggle, and did several rounds of "here's a
   new evidence-gated finding, place it correctly, don't duplicate what already exists." These
   patches are the bulk of `docs/*changelog*.md` and are worth reading for concrete examples of the
   "always check whether it's already modelled before adding a new node" discipline described in
   §5 below.

## 5. The single most important lesson for whoever picks this up next

**Before adding anything, check whether it already exists.** More than once in this project's
history, a request arrived describing a vendor/system as "new" when it was in fact already fully
modelled elsewhere in the catalogue — sometimes in more evidentiary detail than the request itself
assumed, sometimes in a different view than the request specified. The correct move every time was
not to follow the request literally (which would have created a duplicate or a contradiction) but
to grep the catalogue and the views first, and — if a genuine conflict turned up — either resolve
it conservatively in the direction of "don't duplicate, don't restructure something that already
works" or flag it explicitly in the changelog rather than silently picking a side. `git log` and
the `docs/*changelog*.md` files have several worked examples of exactly this reasoning.

## 6. Where to look next

- `docs/DATA_MODEL.md` — full schema reference for `action-architecture-data.json`.
- `docs/IMPLEMENTATION_AUDIT.md` — the original repo audit that kicked off this project.
- `docs/PHASE1_REVIEW_REPORT.md` … `PHASE5_REVIEW_REPORT.md` — what was built and verified, phase
  by phase.
- `docs/content-provider-patch-changelog.md`, `docs/store-checkout-refinement-changelog.md`,
  `docs/verified-suppliers-changelog.md` — worked examples of later content patches, including the
  "this was already modelled, here's why I didn't duplicate it" reasoning from §5.
- `README.md` — day-one setup, scripts, and the Supabase walkthrough.
