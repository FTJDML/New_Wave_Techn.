# Implementation audit — Action Architecture Workbench

Phase 0 deliverable. Audits the repository and the five authoritative source documents before any product code was written.

## 1. Repository state at audit time

- Git repo `ftjdml/new_wave_techn.`, branch `claude/new-session-t1nhhu`.
- Only pre-existing content: `.github/` (workflow files). No application code, no prior Lovable/Claude pack artifacts.
- The five authoritative documents were supplied as uploads (not yet committed to the repo): `CLAUDE.md`, `02_START_HERE.md`, `03_ACTION_ARCHITECTURE_DATA.json`, `04_DATA_MODEL_SCHEMA_AND_RESEARCH_PROTOCOL.md`, `05_VISUAL_REFERENCE_BOOK.pdf`.
- `05_VISUAL_REFERENCE_BOOK.pdf` is 6 pages (not 19 as a stale tool hint suggested): title page, three Rituals positive references, one Action target wireframe (target composition), one anti-reference screenshot. All six pages were visually inspected.

## 2. JSON structural validation (`03_ACTION_ARCHITECTURE_DATA.json`)

Parsed successfully as valid JSON. Top-level keys present as documented: `bundleSchemaVersion`, `generatedOn`, `purpose`, `usageRules`, `curatedArchitecture`, `viewManifest`, `coreSystemCatalogue`, `fullResearchCatalogue`, `toFindBacklog`, `researchUpdateTemplate`.

`curatedArchitecture.view` (`id: total-architecture`) is the exclusive source used for the Total Architecture screen:

| Check | Result |
|---|---|
| Groups | 8 |
| Nodes | 29 (matches required count) |
| Edges | 25 (matches required count) |
| Gap nodes (`kind: "gap"`) | 7 (within the max-8 limit) |
| Canvas | 1920×1080, background `#FFFFFF`, initialScale 0.82 |
| `rules.autoLayout` / `draggableNodes` / `showMinimap` | all `false`, as required |
| `rules.maxVisibleGaps` | 8 |
| Duplicate group/node/edge IDs | none found |
| Every node's `groupId` resolves to a declared group | yes |
| Every edge's `source`/`target` resolves to a declared node | yes |
| Every group, node, and edge waypoint inside the 1920×1080 canvas | yes |
| Duplicate consecutive edge points | none |
| All edge segments axis-aligned (orthogonal) | yes, all 25 edges |
| Node–node bounding-box overlaps | none |
| Group–group bounding-box overlaps | none |
| Nodes fully contained inside their declared group's rectangle | yes, all 29 |
| Unrelated edge–edge crossings (edges sharing no source/target) | none |
| `catalogRefs` resolution against `coreSystemCatalogue.systems` (69 records) ∪ `fullResearchCatalogue.components` (155 records) | all resolve, zero missing |

Validation performed with a standalone script exercising the same rules the in-repo deterministic validator (Phase 1, task 9) implements; see `scripts/validate-layout.ts` once added.

## 3. Connector-vs-label geometry (deviation found and resolved)

The static checks above pass, but a finer-grained check — modelling each domain group's label as a small top-left text rectangle (starting at `group.x + 12`, height ≈22px, width estimated from the label string length) rather than the full group width — found that **3 of the 25 edges, as authored, route through their own domain group's label text**:

| Edge | Groups affected | Segment(s) in conflict |
|---|---|---|
| `e01` (`ch-stores` → `ctac-xv`) | `store` | vertical drop at x=200 passes straight through "STORE UNIFIED COMMERCE" |
| `e02` (`ch-digital` → `contentstack`) | `digital` | horizontal jog at y=185 and vertical drop at x=675 pass through "DIGITAL EXPERIENCE & ONLINE COMMERCE" (a label wide relative to a narrow 460px-wide group) |
| `e05` (`ch-employees` → `successfactors`) | `people` | horizontal jog at y=520 and vertical drop at x=1600 pass through "PEOPLE & SERVICE MANAGEMENT" |

No other edges are affected, and this same check confirms the other apparent conflicts a cruder full-group-width heuristic would flag (e.g. `e03`, `e04`, `e21`, `e22`, `e26`) are **not** real — those edges pass through the group's top band but well clear of the actual label text.

**Resolution (applied in the Phase 1 renderer, not by mutating the source JSON's node/group/catalogue data):** the exact same 3 edges get a corrected `points` polyline that preserves their source, target, type, label and orthogonality, and only nudges the route through the existing inter-row gaps / group padding gutters that the curated layout already leaves clear:

- `e01`: `[[200,113],[200,150],[260,150],[260,220]]` — jogs right in the 30px gap between the channel row and the store group before descending, entering `ctac-xv`'s top edge at x=260 instead of x=200.
- `e02`: `[[545,113],[545,220],[575,220]]` — descends at x=545 (the group's left padding gutter, left of the label's own start at x=557) and enters `contentstack` from the top-left corner of its top edge instead of crossing under the label.
- `e05`: `[[1245,113],[1245,130],[1890,130],[1890,545],[1600,545],[1600,560]]` — moves the horizontal jog from y=520 (inside the label band) to y=545 (below it, still above the `successfactors` node top at y=560).

All three corrected routes were re-validated against: the refined label-zone check (all now clear), the node-intersection check (no new unrelated-node hits), and the edge crossing check (no new unrelated crossings introduced). This is the only geometry deviation from the raw authored coordinates; it is a connector-routing correction only — no group, node, size, or catalogue reference was changed.

## 4. Logo/wordmark asset audit

`logoRegistry` declares 14 vendor entries, all of which are referenced by at least one node's `vendorId`, and every `vendorId` used by a node resolves to a `logoRegistry` entry (14/14 — no gaps at the data level).

Cross-checking against `simple-icons@16.28.0` (the version resolvable from the registry at audit time) found that **2 of the 8 entries with `strategy: "simple-icons"` do not resolve to a real icon**:

| Vendor | Declared slug | simple-icons has it? |
|---|---|---|
| `VEN-MICROSOFT` | `microsoftazure` | No — Microsoft/Azure marks are not in the simple-icons dataset |
| `VEN-SERVICENOW` | `servicenow` | No — not in the simple-icons dataset |
| `VEN-SAP` | `sap` | Yes |
| `VEN-DATABRICKS` | `databricks` | Yes |
| `VEN-ADYEN` | `adyen` | Yes |
| `VEN-CONTENTSTACK` | `contentstack` | Yes |
| `VEN-TCS` | `tcs` | Yes |
| `VEN-OPENTEXT` | `opentext` | Yes |

**Resolution:** per `CLAUDE.md`'s own fallback rule ("`simple-icons` waar beschikbaar... voor ontbrekende merken: een nette typografische wordmark fallback"), the renderer's logo component overrides `VEN-MICROSOFT` and `VEN-SERVICENOW` to render as typographic wordmarks ("Microsoft Azure", "ServiceNow") instead of attempting an unresolvable simple-icons lookup. The other 6 vendors already declared `wordmark` strategy in the data (`VEN-CTAC`, `VEN-PANOSTON`, `VEN-SYMPHONYAI`, `VEN-WUUNDER`, `VEN-UKG`, `VEN-NEXTAI`) and need no change. Net effect: 6 real simple-icons logos, 8 wordmarks, 0 missing/generic placeholders.

## 5. Chosen dependency set (with rationale)

| Purpose | Choice | Why |
|---|---|---|
| App framework | React 18 + TypeScript (strict) | required by `CLAUDE.md` |
| Build tool | Vite | required unless a documented reason says otherwise; none applies here |
| Canvas rendering | Custom HTML/CSS card layer + custom SVG connector layer + a hand-rolled pan/zoom transform | required — no React Flow/Dagre/ELK/force-directed layout for the curated view |
| Icons | `simple-icons` (raw SVG import per vendor, only for the 6 vendors confirmed resolvable above) | local, no runtime network fetch, matches the logo rule |
| Unit tests | Vitest | required |
| Browser tests / screenshots | Playwright (Chromium; browsers pre-provisioned in this environment) | required |
| Linting | ESLint (typescript-eslint, react-hooks) | standard, keeps strict-mode violations visible |

No routing library is introduced in Phase 1 beyond a single static `/architecture` route (a minimal hand-rolled router is enough; Phase 1 explicitly builds only this one route).

## 6. Missing assets

None beyond the two logo-slug gaps documented in §4, which have a defined fallback. No other referenced local asset paths exist in the data (`logoStrategy: "asset"` is not used by any of the 14 registry entries, so no local image files need to be sourced).

## 7. Data parsing test

A parsing/validation pass (the geometry and reference checks in §2–§4) was run against the full JSON bundle as part of this audit and will be encoded as the permanent, executable `scripts/validate-layout.ts` validator in Phase 1 (task 9), so the same checks run on every future data or layout change, per `scripts/VALIDATION_REQUIREMENTS.md`.

## 8. No product code was written during this audit

This document and `docs/IMPLEMENTATION_PLAN_ACTUAL.md` are the only deliverables of Phase 0.
