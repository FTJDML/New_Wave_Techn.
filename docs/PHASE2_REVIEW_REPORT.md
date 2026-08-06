# Phase 2 review report — information access

Deliverable for Phase 2 ("information access") per `docs/06_BUILD_SEQUENCE.md`, built after the user approved the Phase 1 Total Architecture visual gate.

## 1. What was built

- **Router and shell** (`src/App.tsx`, `src/components/shell/AppShell.tsx`): a dark top navigation bar with links to Architecture / Systems / Suppliers / Evidence / TO FIND, plus a global search entry point. Introduced `react-router-dom` — justified now that Phase 2 genuinely needs multiple routes (Phase 1 deliberately stayed single-route).
- **Full-catalogue data layer** (`src/types/catalogue.ts`, `src/data/fullCatalogue.ts`): typed, indexed accessors over `fullResearchCatalogue` — domains, capabilities, vendors, components, component-capabilities, architecture edges, commercial relationships, programmes, evidence sources, claims, technical observations, research gaps, research tasks. Deliberately excludes `stakeholders`, `ownership_links` and `cgi_relationships` — see §4.
- **Complete detail drawers**: `SystemDetailDrawer` (vendor logo, architecture role, capability/business process, deployment/lifecycle, modernity/hosting, geography/user groups, first known year, relationship start+precision+duration, directness, modules, linked systems via architecture edges, programmes, related gaps, evidence & claims, open questions), `SupplierDetailDrawer`, `EvidenceSourceDrawer`, `GapDetailDrawer` — all read-only, all reachable by URL.
- **`/systems`**: searchable/filterable table of all 155 catalogue components (domain, role, deployment/evidence status filters), row click or direct URL (`/systems/:componentId`) opens the full drawer.
- **`/suppliers`**: all 52 vendors with their commercial relationships and system counts; `/suppliers/:vendorId` deep link.
- **`/evidence`**: three tabs — 36 evidence sources, 194 claims, 34 technical observations — each filterable; `/evidence/:sourceId` deep link shows a source plus every claim that cites it.
- **`/to-find`**: kanban (Open/Researching/Validating/Resolved/Parked) and table views over all 64 research gaps, with a table-view toggle; `/to-find/:gapId` deep link.
- **Search palette** (⌘K / Ctrl+K or the header button): fuzzy-ish substring search across systems, vendors, capabilities, gaps and evidence sources, keyboard-navigable, routes to the right page on selection.
- **Filter panel**: a shared, collapsed-by-default component (`FilterPanel`) reused on every catalogue page — never a permanently expanded rail, matching the Phase 1 visual rule extended to Phase 2.
- **URL deep links**: every drawer's open/closed state and every catalogue page's filters live in the URL (`useSearchParams`), including the Total Architecture's own node drawer (`/architecture?node=<id>`) — shareable and back/forward-safe.
- **PNG export**: a new toolbar button on the Total Architecture canvas rasterizes the full 1920×1080 poster at 2× pixel density via `html-to-image`, independent of the current pan/zoom camera, and triggers a browser download.

## 2. Bugs found and fixed while building this phase

- **Edge labels exported at full opacity.** `EdgeLayer`'s hover-only label visibility was toggled via a CSS module class; `html-to-image`'s DOM clone didn't reliably preserve that class-based rule, so exported PNGs showed every label simultaneously (illegible clutter). Fixed by driving the opacity from an inline `style` attribute instead, which survives cloning. Also removed the now-dead `.labelVisible` CSS rule.
- **Zoom/export controls became unreachable whenever the Architecture drawer was open.** The drawer's full-viewport "click outside to close" overlay (`z-index: 19/29`) sat above the zoom controls (`z-index: 5`) in the same stacking context, intercepting every click over them. Fixed by raising the zoom controls' `z-index` to 35 and moving them to the bottom-left (both top-right and bottom-left are explicitly allowed positions per the visual spec), so pan/zoom/export/reset stay usable while inspecting a node.
- **Search-button keyboard hint text was 10.5px** — below the project's 11px floor. Caught by the existing Phase 1 automated font-size test, which now also runs against the new shell. Fixed to 11px.
- **Gap drawer showed a confusing self-link.** `research_gaps.linked_component_ids` includes the gap's own placeholder component (to mark "which architecture object this gap concerns"), which rendered as a "linked system" pointing at itself. Filtered out the gap's own `gap_component_id` before rendering that list.

## 3. Tests and validation

```
$ npx tsc -b --noEmit    → clean
$ npx eslint .           → clean
$ npm run build          → clean (pre-existing chunk-size advisory only)
$ npx tsx scripts/validate-layout.ts → 0 failures (unchanged Total Architecture)
$ npx vitest run         → 5 files, 64 tests passed
$ npx playwright test    → 72 tests passed (36 checks × 2 viewports)
```

New Vitest coverage: referential integrity across the entire full research catalogue (every component's domain/vendor resolves, every architecture edge's endpoints resolve, every commercial relationship/programme/research-gap/research-task's foreign keys resolve), the new accessor functions, and the `humanize`/`formatDuration` formatting helpers.

New Playwright coverage: shell navigation, redirect-on-unknown-route, every catalogue page's row counts/search/filters/deep-links, the search palette (open, filter, select, Escape), the Architecture page's `?node=` deep link, zoom-controls-usable-with-drawer-open, and PNG export producing a real download.

## 4. Privacy scope decision (important — read before extending this phase)

`stakeholders` (27 records, `data_classification: INTERNAL_CONFIDENTIAL`), `ownership_links` (96 records) and `cgi_relationships` (7 records, `data_classification: RESTRICTED`, includes warm-introduction routes) are **not surfaced anywhere in the UI**. This was a deliberate scope decision, not an oversight:

- `docs/06_BUILD_SEQUENCE.md`'s Phase 2 list is complete detail drawer, search, systems catalogue, suppliers, evidence, TO FIND, filter panel, deep links, export — it does not include a Stakeholders screen.
- `CLAUDE.md`'s privacy guardrails require authentication and RLS before private/CGI data is exposed; no authentication exists before Phase 5.
- Beyond the dedicated `stakeholders` table, `research_gaps.target_stakeholders_or_sources` also embeds real personal names as free text (e.g. "Matthias Matthé; Elma Vader; Pan Oston owner"). `GapDetailDrawer` deliberately does not render that field, while still showing every other gap field (why essential, research question, hypothesis, route, evidence needed, next action).
- This is enforced by an automated regression test, not just a code-review convention: `tests/e2e/privacy.spec.ts` reads every stakeholder full name and CGI contact name directly from the data bundle and asserts none of them ever appear in the rendered DOM of any page or drawer (72-test Playwright run above includes 8 of these checks, all passing), and asserts no navigation entry point named "stakeholder" or "CGI" exists.

Any future phase that adds a Stakeholders screen must add authentication/RLS first, per `CLAUDE.md`.

## 5. Deviations / known limitations

- PNG export ships; PDF export (also mentioned in `docs/06_BUILD_SEQUENCE.md`) was not implemented in this phase — a single-page PDF wrapping the same rasterized PNG is straightforward to add later but wasn't built now to keep this phase's scope matched to what was explicitly requested.
- The search palette's matching is a simple case-insensitive substring match (title + meta fields), not a fuzzy/ranked search — sufficient for the current catalogue size (155 components, 52 vendors, 49 capabilities, 64 gaps, 36 evidence sources) but would benefit from a real fuzzy-match library if the catalogue grows substantially.
- Domain deep-dive views (`/architecture/store`, `/architecture/digital`, etc.) remain out of scope — those are Phase 3 by design ("hand-curated domain deep dives with their own positions and routes").

## 6. Statement on later phases

Phase 3 (domain deep dives), Phase 4 (research/editing workflow — creating/updating sources, claims, gap status transitions, CSV import), and Phase 5 (Postgres/Supabase persistence, authentication, RLS) remain **deliberately not built**. Everything in this repository is still local-JSON-backed and read-only; no editing, no accounts, no database exists yet.
