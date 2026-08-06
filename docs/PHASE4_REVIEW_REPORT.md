# Phase 4 review report — research and editing workflow

Deliverable for Phase 4 ("ongoing research and editing workflow") per `CLAUDE.md` and `docs/06_BUILD_SEQUENCE.md`, built after the user approved Phase 3 and explicitly approved Phase 4 ("approve go ahead with phase 4").

## 1. A privacy decision made before writing any code

`06_BUILD_SEQUENCE.md`'s Phase 4 list includes "ownership hypotheses" — editing which links a real stakeholder name to a system, domain, capability, programme or gap with a role. Every prior phase kept `stakeholders`/`ownership_links` out of the UI entirely because `CLAUDE.md`'s privacy guardrail requires authentication and RLS before private/CGI data is exposed, and neither exists before Phase 5.

This was flagged to the user before building anything (not decided silently), with three options: defer ownership editing to Phase 5, build it but never render the name, or build the full stakeholder UI now. The user chose the middle option: **build ownership-hypothesis editing now, but never display a real stakeholder name anywhere in the rendered app.**

This is implemented at the type level, not just by convention in a component:

- `StakeholderRecord` (in `src/research/types.ts`) is the only place `full_name` exists, and it is a **private, module-internal shape** — no exported read function in `src/research/store.ts` ever returns it.
- Every read path — `listMaskedStakeholders()`, `getMaskedStakeholder()` — returns `MaskedStakeholder`, a type that has no `full_name` field at all (`Omit<StakeholderRecord, 'full_name'>` plus an auto-generated `label` like `"Contact 3"`).
- The creation form (`OwnershipSection`'s "this is a new contact" panel) is the only place a name is ever typed. It is written once into the store and never read back by any component afterward.
- `tests/e2e/research-workflow.spec.ts`'s "ownership masking — live creation regression" test creates a stakeholder with a deliberately distinctive name through the real UI, then asserts the string never appears in `document.body.innerText` on the page it was created on, the audit history page, or the systems catalogue — a live behavioral check, not just a static JSON-derived one like Phase 2's privacy test.

## 2. What was built

Per `06_BUILD_SEQUENCE.md`'s Phase 4 list — every bullet has a corresponding feature:

- **Create/update source** — an "+ Add evidence source" panel on `/evidence`, and an "Edit source" toggle inside `EvidenceSourceDrawer` for updating an existing one in place.
- **Create/update claim** — an "+ Add claim" panel on `/evidence`'s Claims tab, reused inline from the observation-promotion flow (below) with the subject pre-filled.
- **Promote a technical observation to a validated relationship only via review** — `SystemDetailDrawer`'s Technical Observations section gets a "Review & promote" action per observation. Promotion is blocked until a justification note is written and a supporting claim is linked (existing or newly created) — there is no automatic path from observation to confirmed relationship, matching `04_DATA_MODEL_SCHEMA_AND_RESEARCH_PROTOCOL.md`'s explicit rule.
- **Gap status and research tasks** — `GapDetailDrawer` gets a `GapStatusControl` that only offers the *valid next* transitions for the gap's current status (`OPEN → RESEARCHING/PARKED`, `RESEARCHING → VALIDATING/PARKED/OPEN`, `VALIDATING → RESOLVED/RESEARCHING/PARKED`, `PARKED → OPEN/RESEARCHING`, `RESOLVED` is terminal), requires a resolution summary to resolve, and logs a note with every move. Research tasks are now addable and editable, not just displayed.
- **Ownership hypotheses** — `OwnershipSection`, masked as described in §1, attached to both `SystemDetailDrawer` and `GapDetailDrawer`.
- **Audit history** — every mutation (source/claim create-or-update, gap status change, task create-or-update, ownership-link create-or-update, stakeholder create, observation promotion, CSV import) appends an `AuditEvent` with a before/after snapshot and, where relevant, a note. Visible on the new `/research?tab=audit` page with an expandable before/after diff per row.
- **CSV import preview and validation** — `/research`'s Import tab: paste or upload CSV (evidence sources or claims), get a per-row preview showing exactly which rows are valid and which are rejected and why (reusing the same validators the manual forms use), then commit only the valid rows. Invalid rows are never silently dropped — the confirmation banner reports both counts, and the skip reasons stay visible in the preview table.
- **Private classification** — every new/edited source, claim, stakeholder and ownership link carries a `data_classification` field (`PUBLIC` / `INTERNAL` / `INTERNAL_CONFIDENTIAL` / `RESTRICTED`), editable in every form and shown as a column on the Claims table. This is metadata visibility, not a rendering gate — existing `RESTRICTED` claims already render today in Phase 2's Evidence page (the classification marks sensitivity for a future authenticated audience; the ownership/stakeholder masking in §1 is the one hard gate this phase adds).

### Architecture

- **`src/research/types.ts`** — every Phase 4 type: `StakeholderRecord` (private), `MaskedStakeholder` (public), `OwnershipLink`, `AuditEvent`, and the `New*Input` shapes each form submits.
- **`src/research/validation.ts`** — pure validators (`{ok, errors}`, never throws) for every input type, reused identically by the manual forms, the promotion flow, and the CSV import preview/commit — one source of truth for "is this row valid," not three.
- **`src/research/store.ts`** — the local overlay. No backend exists before Phase 5, so every mutation lands in a versioned `localStorage`-backed object (`aaw-research-overlay-v1`), never in the canonical JSON bundle. Merged selectors (`mergedSources`, `mergedClaims`, `mergedGap`, `mergedTasksForGap`, `ownershipLinksForSubject`) are what every page/drawer reads — the canonical arrays in `src/data/fullCatalogue.ts` are untouched and still the audited Phase 2 read path.
- **`src/research/useResearchStore.ts`** — a `useSyncExternalStore` hook so every consumer re-renders on any mutation, anywhere, without prop-drilling.
- **`src/components/forms/*`** — one small typed component per input type (`AddSourceForm`, `AddClaimForm`, `AddTaskForm`, `GapStatusControl`, `PromoteObservationForm`, `OwnershipSection`), sharing one CSS module for visual consistency with the rest of the app.
- **`src/lib/csv.ts`** — a ~70-line RFC4180-ish parser (quoted fields, embedded commas/newlines, `""` escaping). Not a dependency: the import volumes here (dozens of rows) don't justify one.
- **`/research`** (`src/pages/ResearchPage.tsx`) — the CSV import wizard and audit history, as two tabs; linked from the main nav.

## 3. Tests and validation

```
$ npx tsc -b --noEmit                 → clean
$ npx eslint .                        → clean
$ npm run build                       → clean (pre-existing chunk-size advisory only)
$ npx tsx scripts/validate-layout.ts  → 7/7 views, 0 failures (unchanged — this phase touches no architecture view)
$ npx vitest run                      → 6 files, 88 tests passed (64 pre-existing + 24 new)
$ npx playwright test                 → 164 tests passed (82 checks × 2 viewports)
```

New Vitest coverage (`tests/unit/research.test.ts`): every validator's accept/reject paths (including the gap-transition state machine and the "no automatic promotion" rule), store mutations creating and correctly merging sources/claims/tasks, gap-status audit-and-block behavior, CSV preview-vs-commit (preview never mutates), and — the one asserted with the most care — that a masked stakeholder's JSON representation and every list/audit-log serialization never contains the real name.

New Playwright coverage (`tests/e2e/research-workflow.spec.ts`): add-source (success and validation-failure paths), add-claim, promotion validation, the full gap-status transition sequence including the blocked-resolution case, task creation, CSV import (valid+invalid rows in one batch), audit history, and the live ownership-masking regression described in §1.

`tests/e2e/privacy.spec.ts` was not modified this phase (still covers all 12 static routes from Phase 3) since its scope is the *canonical* stakeholder data; the new masking test lives in `research-workflow.spec.ts` because it exercises freshly-created, not canonical, data.

## 4. Bugs found and fixed while building this phase

- **`react-hooks/exhaustive-deps` false-positive on the merged-gaps `useMemo`.** `ToFindPage`'s gap list needs to recompute whenever the research store mutates, but the recomputation trigger (`useSyncExternalStore`'s snapshot) isn't read inside the memo callback, so the lint rule flagged it as an unnecessary dependency. Kept the dependency (it's correct — the pre-existing `useCamera.ts` hook has the same documented pattern) and added a `eslint-disable-next-line` with a one-line explanation, matching that precedent instead of inventing a new one.
- **CSV import needed a true dry-run, not a "validate then immediately mutate."** The first pass of `importRows` validated and committed in the same loop, which meant the preview table had no way to show "these 3 rows are valid" without already having created them. Refactored the row-to-input mapping into `sourceInputFromRow`/`claimInputFromRow` helpers shared by a new `previewImportRows` (validate-only) and the existing `importRows` (validate-and-commit), so the preview step is provably side-effect-free — covered by a unit test that checks `mergedSources().length` is unchanged after a preview.

## 5. Deviations / known limitations

- Editing is entirely client-local (`localStorage`), per `CLAUDE.md`'s "database and authentication come only after the visual golden path is approved" and Phase 5 being the persistence phase. Nothing written in Phase 4 survives a different browser, a cleared cache, or a different device — that's expected, not a bug, until Phase 5's Postgres schema and API land.
- "Private classification" is metadata (a field the researcher sets and sees), not a rendering gate for anything except the ownership/stakeholder masking in §1. A `RESTRICTED` claim created in this phase renders exactly like existing `RESTRICTED` claims already did in Phase 2 — this phase did not introduce a broader classification-based redaction system, since nothing in `06_BUILD_SEQUENCE.md` or the acceptance tests asks for one beyond the stakeholder/CGI guardrail already in force.
- The CSV import wizard supports evidence sources and claims — the two entities `06_BUILD_SEQUENCE.md` lists immediately above "CSV import preview and validation" in the Phase 4 bullet list. Gaps, tasks, and ownership links are not bulk-importable in this phase; they're one-at-a-time through their respective forms, which matches how often they're created (dozens, not hundreds) versus sources/claims (the catalogue already has 36 and 194 respectively).

## 6. Statement on later phases

Phase 5 (Postgres/Supabase persistence, authentication, RLS) remains **deliberately not built**. Every Phase 4 edit lives in browser `localStorage` layered on top of the still-untouched, still-read-only canonical JSON bundle. The moment Phase 5 lands, the ownership/stakeholder masking in §1 should be revisited — with real authentication and row-level security in place, a signed-in researcher may be an intended audience for real names, and the current "never render" rule was deliberately scoped to *this* unauthenticated phase, not stated as permanent.
