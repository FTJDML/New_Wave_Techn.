# Implementation plan — Phase 1 (visual golden path)

Companion to `docs/IMPLEMENTATION_AUDIT.md`. Describes exactly what will be built, in what order, and how it will be verified. Scope is strictly Phase 1 per `CLAUDE.md` and `02_START_HERE.md`: light app shell + `/architecture` Total Architecture view only. No catalogue, suppliers, evidence, TO FIND management, editing, auth, or Supabase.

## 1. Repository layout

```
/
├── docs/
│   ├── IMPLEMENTATION_AUDIT.md
│   └── IMPLEMENTATION_PLAN_ACTUAL.md
├── src/
│   ├── data/
│   │   ├── action-architecture-data.json   # full bundle, imported as-is (source of truth)
│   │   ├── curatedView.ts                  # typed accessor for curatedArchitecture.view + logoRegistry only
│   │   └── catalogueIndex.ts               # id -> record lookup, used only to resolve catalogRefs for the drawer
│   ├── types/
│   │   └── architecture.ts                 # TypeScript contracts ported from doc 04
│   ├── components/
│   │   ├── shell/          (AppHeader, ViewTitle, ZoomControls)
│   │   ├── canvas/         (ArchitectureCanvas, PanZoomLayer, GroupLayer, NodeLayer, EdgeLayer)
│   │   ├── nodes/           one component per ViewNodeKind (Core, Hub, Satellite, Channel, Signal, Transition, Gap)
│   │   ├── logo/           (VendorLogo — simple-icons svg or wordmark fallback)
│   │   └── drawer/         (DetailDrawer — read only)
│   ├── App.tsx
│   └── main.tsx
├── scripts/
│   └── validate-layout.ts   # deterministic validator, run via `npm run validate:layout`
├── tests/
│   ├── unit/                 (Vitest: validator rules, catalogRef resolution, logo resolution)
│   └── e2e/                  (Playwright: screenshots + DOM gates)
├── docs/screenshots/          (golden images, generated)
├── index.html
├── vite.config.ts
├── tsconfig.json (strict)
├── playwright.config.ts
└── package.json
```

Canonical research data (`coreSystemCatalogue`, `fullResearchCatalogue`) is imported but **only** used by `catalogueIndex.ts` to resolve a `catalogRefs` entry for the drawer's "represents" list — it is never iterated to produce visible cards. This keeps the "never render the full catalogue" rule mechanically true rather than just a convention.

## 2. Data layer (task 4)

- Port the TS contracts from `04_DATA_MODEL_SCHEMA_AND_RESEARCH_PROTOCOL.md` verbatim into `src/types/architecture.ts` (`ArchitectureView`, `ArchitectureViewNode`, `ArchitectureViewEdge`, `ViewNodeKind`, `ViewEdgeType`, `LogoDefinition`, etc.).
- `curatedView.ts` exports the single `view` object and `logoRegistry` object, typed against those contracts, with the two documented overrides from the audit (§4): `VEN-MICROSOFT` and `VEN-SERVICENOW` resolved to `wordmark` at the component level (registry data itself is left untouched — the override lives in `VendorLogo`, so the deviation is visible in one place and easy to revisit if simple-icons adds those marks later).
- The 3 corrected edge `points` arrays from the audit (§3) are applied as a small, explicitly-commented override table keyed by edge id, merged onto the raw `view.edges` at load time — again so the deviation from the raw JSON is a single visible diff, not a silent hand-edit of the data file.

## 3. App shell (task 5)

- Light header: product name/wordmark, current view title ("Action Total Technology Architecture") + subtitle, a legend (status colors — confirmed current / observed-inferred / transition / target / legacy / private / TO FIND, per the target-wireframe legend), zoom-in/zoom-out/reset controls.
- No filter rail, no search, no minimap in Phase 1 (all explicitly out of scope per the acceptance gate).
- Single route: `/architecture` renders `ArchitectureCanvas`. No router library — a trivial path check is enough for one route.

## 4. Canvas renderer (tasks 6–7)

- `ArchitectureCanvas` owns a `{x, y, scale}` camera state and a `<div>` with a CSS `transform: translate(...) scale(...)` wrapping a fixed 1920×1080 logical layer — matches `canvas.initialScale/minScale/maxScale` from the data.
- Pan: pointer drag on empty canvas background. Zoom: wheel/trackpad pinch + the explicit controls. Reset: restores the initial camera exactly (`initialScale`, centered). No node dragging.
- `GroupLayer` renders the 8 domain containers from `view.groups` (light grey `#F4F4F2`, 1px `#B7B7B2` border, uppercase label at top-left, `letter-spacing` tuned to stay clear of the connector gutters identified in the audit).
- `EdgeLayer` is one `<svg>` sized to the logical canvas, absolutely positioned **behind** the node layer (`rules.edgesBehindNodes`), rendering each edge as an orthogonal `<polyline>` from its (possibly overridden) `points`, with arrowheads only where `direction`/type implies one, dash patterns per `type` (`missing-link` red-dashed, `migration`/`migration-and-integration` orange-dashed, `probable-integration` amber-dashed, `physical-integration` a distinct subtle dash, `data-flow` thin blue-grey, everything else a solid 1.25–1.5px dark grey). Edge labels are `opacity: 0` by default and shown on hover/focus/selection of the edge or either endpoint (`rules.hideEdgeLabelsUntilHover`).
- `NodeLayer` renders one typed component per `ViewNodeKind` at its fixed `x/y/w/h`:
  - **channel** — small pill, title + subtitle, top row.
  - **core** — largest card, `VendorLogo` + title prominent, role subtitle, modules rendered as internal capsules inside the same card, small status badge top-right (never a full-card color wash).
  - **hub** (SAP CAR) — mid-size, same visual family as core but smaller.
  - **satellite** — compact card, logo + title + one-line role.
  - **signal** (OpenText VIM) — neutral card with an amber dashed accent border, "Observed"/"Inferred" chip per `evidence`.
  - **transition** (Kronos → UKG) — normal card styling + explicit legacy→target arrow/text inside the card + orange status chip.
  - **gap** — light red `#FFF3F3` background, red dashed `#D84A4A` border, title always starts with "TO FIND", subtitle names the concrete missing capability, `gapPriority` chip.

## 5. Logos (task 8, part 1)

- `VendorLogo(vendorId)` looks up `logoRegistry[vendorId]`, applies the two audit overrides, and renders either an inlined simple-icons SVG (imported as a local asset — 6 vendors) or a typographic wordmark span (8 vendors + the 2 overrides = 10). No remote URL fetch at runtime, no generic placeholder icon when a vendor name is known.

## 6. Interaction (task 8, part 2)

- Hover/focus on a node dims all unrelated nodes and edges to ~35% opacity and highlights the node plus its first-degree neighbours (computed once from `view.edges` at load, not per-render).
- Click opens `DetailDrawer` (read-only): logo/wordmark, title, subtitle, kind, status/evidence badges, modules, and the resolved `catalogRefs` records' `display_name`/`vendor_name` pulled from `catalogueIndex.ts` (proves the catalogue-linkage rule without exposing catalogue browsing UI). Escape or the close button dismisses it; camera position is preserved.
- Full keyboard support: nodes are focusable buttons, Tab order follows document order (channels → domain groups top-to-bottom, left-to-right), Enter/Space opens the drawer, Escape closes it.

## 7. Deterministic layout validator (task 9)

`scripts/validate-layout.ts`, run standalone (`tsx scripts/validate-layout.ts`) and exiting non-zero on any failure, implementing every rule in `scripts/VALIDATION_REQUIREMENTS.md`:

- Unique group/node/edge ids; every `groupId`/`source`/`target` resolves; every group/node/edge-point inside the 1920×1080 canvas; no duplicate consecutive edge points.
- Node count ≤ `rules.maxVisibleTopLevelCards`, gap count ≤ `rules.maxVisibleGaps`.
- Every node with a `vendorId` resolves to a `logoRegistry` entry (post-override).
- Every `catalogRefs` entry resolves in `coreSystemCatalogue` ∪ `fullResearchCatalogue`.
- Rectangle geometry: no visible node-node overlap; nodes contained in their group; the refined label-zone-vs-connector check from the audit; unrelated node-vs-connector intersection; unrelated edge-vs-edge crossing (with an explicit whitelist array for any approved crossing — empty today, since the audit found none needed).

This is the same logic already prototyped and hand-verified during the audit; it is being productionised as a checked-in, re-runnable script rather than a one-off audit artifact.

## 8. Tests (tasks 9–10)

- **Vitest** (`tests/unit`): validator rule functions (one test per rule with a deliberately-broken fixture), `catalogueIndex` resolution, `VendorLogo` fallback logic (including the two override cases).
- **Playwright** (`tests/e2e`): loads `/architecture` at 1440×900 and 1920×1080, takes a full-page screenshot into `docs/screenshots/`, and asserts:
  - all 29 node titles are visible and not clipped;
  - computed font-size ≥ 11px on every text node inside a card;
  - no element matches a "minimap" role/testid;
  - the filter panel (none exists in Phase 1, but the assertion is kept so a future phase can't silently violate it) is absent/closed;
  - initial camera transform matches `canvas.initialScale` centered;
  - every vendor node's logo element has non-zero width/height;
  - no card has `overflow` producing an internal scrollbar.

## 9. Build discipline / order of work

1. Scaffold (task 3) → 2. Data layer (task 4) → 3. Shell (task 5) → 4. Canvas + groups/nodes (task 6) → 5. Edges (task 7) → 6. Logos/highlight/drawer (task 8) → 7. Validator (task 9) → 8. Playwright + Vitest (task 10) → 9. Run everything, fix, screenshot, write the review report (task 11).

Small, focused commits per the `CLAUDE.md` branching convention (this session works directly on `claude/new-session-t1nhhu` rather than the suggested `feat/*` branch names, since the task assignment pins the branch).

## 10. Explicitly not built in this phase

Suppliers, Evidence, TO FIND management/kanban, systems/stakeholders catalogues, search/command palette, domain deep-dive routes, editing, authentication, RLS, Supabase/Postgres persistence, CSV import, audit history, PNG/PDF export. These remain out of scope until the Total Architecture visual gate is explicitly approved.
