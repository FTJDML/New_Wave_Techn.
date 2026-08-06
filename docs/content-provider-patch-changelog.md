# Content and Provider Patch — changelog

Implements "Claude Code Action Content and Provider Patch v2.2" against the existing Action
Architecture Workbench on `claude/new-session-t1nhhu`. This is a content-completeness and
information-architecture patch: no route, data model, or interaction from Phases 0–5 was removed
or reset, no auto-layout engine was introduced, and every new fact traces to a cited evidence
source or is explicitly labelled TO FIND. See `docs/content-completeness-audit.md` and
`docs/service-provider-audit.md` for the audit this patch was built from.

## §1–2 — Mendix and STEP MDM

- Added `VEN-MENDIX` (Mendix) and `VEN-STIBO` (Stibo Systems) as vendors, `CMP-MENDIX` (Mendix
  low-code application platform) and `CMP-STEP-MDM` (STEP Master Data Management) as components.
- Added 4 evidence sources: `SRC-MENDIX-BNL-MEETUP-2023`, `SRC-STIBO-STEP-PLATFORM`,
  `SRC-ACTION-JOB-PROCESS-EXPERT-COMMERCE`, `SRC-ACTION-JOB-MARKETING-FORMAT`.
- Added 7 name-free claims `CLM-0195`–`CLM-0201` distinguishing the public Mendix/STEP evidence
  from the private, RESTRICTED statement about Mendix, which stays in a stakeholder's gated
  `notes` field (never in a public `claims` record — see the privacy note below).
- Added `REL-025` (Action ↔ Mendix) and `REL-026` (Action ↔ Stibo), each with `provider_role`,
  `supported_capability_ids` and `data_classification`.
- Resolved the generic Product MDM/PIM gap `GAP-020` to `CMP-STEP-MDM`, retaining 3 follow-up
  gaps: `GAP-065` (governance ownership), `GAP-066` (Mendix↔STEP integration), `GAP-067`
  (STEP↔S/4HANA master-data direction) — a partial, not total, resolution.
- Vendor attribution for STEP (Stibo as product vendor) is stored separately from Action's own
  deployment evidence (`CMP-STEP-MDM.notes` flags "vendor attribution inferred") — the patch's
  non-negotiable never-conflate rule.

## §3 — Architecture placement

- **Total Architecture**: added `mendix` and `step-mdm` nodes to the ERP & Core group, edges
  `e30`/`e31`; `maxVisibleTopLevelCards` 30 → 31. Mendix renders as a `satellite` (app/workflow
  layer), never as a `core`/system-of-record node — STEP renders the same way, both explicitly
  subordinate to SAP S/4HANA.
- **ERP & Supply**: added an `es-product-data` group with `es-step-mdm`, `es-mendix`,
  `es-powertext`, `es-contentstack-ref` nodes and 4 edges; also added `es-retailsonar`.
  `maxVisibleTopLevelCards` 20 → 24.
- **Digital Experience**: rewired the old generic `dc-gap-pim-mdm` stub into a real `dc-step-mdm`
  node upstream of the commerce engine, added `dc-mendix`, plus a new `dc-satellites` group for
  the previously-omitted martech/consent/observability vendors. The upstream relationship is
  drawn as an "investigate" dashed edge, not an asserted, unproven interface.

## §4 — Exposing omitted catalogue items

- **Digital Experience**: added Publitas, Twilio SendGrid, Cookiebot/Usercentrics, Smartly.io,
  Channable, Firebase Crashlytics & Analytics.
- **Data & Intelligence**: added SAP Analytics Cloud, SAP BusinessObjects, Looker Studio, Firebase
  Analytics, Hotjar, Mopinion, Q&A Retail, Uberall, and Capgemini (historical Azure migration
  reference).
- **People & Service**: added Staffly and eRecruiter as a new "Regional recruitment satellites"
  group.
- **Foundation**: added a new amber "Known / observed foundation signals" group (Microsoft 365,
  Cloudflare, AWS, Vercel, Fastly — all `technically_observed`, never given `Current` weight) and
  a "Facility & Store OT" group (Planon, Daikin).

## §5 — Providers & Partners view

New page at `/architecture/providers` (`src/pages/ProvidersPage.tsx`, `src/lib/providersView.ts`)
— a plain grid/list page, not a system-flow canvas, per the patch's own framing. Groups every
known provider into the 6 named sections (Store/checkout & rollout; Cloud & enterprise delivery;
Digital/product data & content; Customer operations; Supply chain & logistics; People &
recruitment), each card showing role badge, supported systems, since/geography, status/evidence,
and open questions. A vendor with no `commercial_relationships` record (4POS, Elo) renders as a
bare stub — "Candidate affiliation — no relationship record" — never a fabricated role. A
dedicated red "TO FIND — delivery ecosystem" section lists every provider-shaped gap
(`DOM-PARTNERS`), including the Marketing & Format Technology multi-partner sourcing model that
Action confirms publicly without naming a partner.

Added `ProviderRole` (13-value union) and extended `CommercialRelationship` with
`provider_role`, `supported_capability_ids`, `data_classification` (`src/types/catalogue.ts`).

## §6 — Provider overlay toggle

Added a "Show delivery partners" toggle (`src/components/canvas/ProviderOverlayToggle.tsx`) to
every canvas view (Total Architecture + all 6 deep dives), default OFF everywhere. When enabled:

- a floating panel (`ProviderOverlayPanel.tsx`) lists providers whose vendor or component is
  actually drawn on that view, capped at 6 combined cards + TO-FIND gap stubs
  (`buildProviderOverlay()` in `src/lib/providersView.ts`);
- TO-FIND gap stubs fill any remaining slots, matched by the gap's `linked_component_ids`
  against the view's own `catalogRefs` — never a gap unrelated to what's on screen;
- all application edges fade (`isEdgeDimmed` overridden to `true`) so the panel reads clearly
  against a de-emphasised canvas;
- the fixed layout is untouched — the panel is an absolutely-positioned overlay outside the
  canvas coordinate system, so no node, edge, or group geometry changes when it opens.

**Deviation from the letter of §6**: the spec's illustrative examples imply provider *edges*
drawn between provider and system cards. That would require a dynamic router injecting new
edges into hand-tuned, validator-gated canvases — directly against the patch's own "no
auto-layout" constraint. The side-panel implementation delivers the same functional outcome
(surface relevant delivery partners without disturbing the fixed layout) without that risk.

## §7 — Data model

Covered in §2/§5 above: `provider_role`, `supported_capability_ids`, `data_classification` added
to all 26 `commercial_relationships` records (24 existing + `REL-025`/`REL-026`).

## §8 — Stakeholder and evidence links

- Added stakeholders `STK-INGRID-CAMPMAN` (IT Supplier Manager) and
  `STK-COMMERCIAL-PROCESS-TEAM` (organisational team context from the Process Expert Commerce
  vacancy — deliberately not a named individual).
- Added ownership links `OWN-0100`–`OWN-0104`: Gino Ramcharan → STEP MDM (low-confidence process
  route, "validate scope"), Commercial Process Team → STEP MDM (organisational context only),
  Patrick Werkman → Mendix (2023 event-evidence reference only), Ingrid Campman → the
  managed-service-partner component and the `DOM-PARTNERS` domain.
- Populated `target_stakeholders_or_sources` on all 8 provider-discovery gaps (`GAP-058`,
  `GAP-060`, `GAP-068`–`GAP-073`) with Anouk de Ruiter, Ingrid Campman, Karin Bergers, Martin van
  Dijk, Duncan Schoen, and — where a more specific existing domain owner already applies — Joep
  Groen (SAP) or Jorik Dopmeijer (web channel).
- **Privacy**: this field is stored in the canonical data only; `GapDetailDrawer.tsx` has never
  rendered `target_stakeholders_or_sources` (a pre-existing, documented exclusion), and
  `tests/e2e/privacy.spec.ts` dynamically re-derives its forbidden-name list from the data bundle
  every run, so the new names are covered automatically. Richard Lendvai's private Mendix
  statement stays in his own gated stakeholder `notes` field, never in a public `claims` record.

## §9 — Visual and content-quality fixes

- **Duplicate-label fix**: a bare bold wordmark sitting directly beside a bold node title read
  as one run-on label (`Ctac Ctac XV Unified Commerce`). Restyled `VendorLogo`'s wordmark
  fallback as a small badge/chip (uppercase, muted colour, bordered background) so it reads as a
  logo slot, not a continuation of the title — without removing the logo (the existing
  "every vendor node renders a non-empty logo or wordmark" acceptance test still passes).
- **Regression caught and fixed during this patch**: the badge's `flex-shrink: 0` forced 100% of
  any width squeeze onto the node title, and long vendor wordmarks ("Microsoft Azure",
  "ServiceNow") broke titles into per-letter fragments in narrow cards (see `fs-azure`, `fs-m365`
  in the Foundation view). Fixed by capping the badge at `max-width: 84px` with an ellipsis
  truncation, and giving the title `flex: 1 1 auto` so it always gets first claim on available
  width (`VendorLogo.module.css`, `NodeCard.module.css`).
- **View summary counter** (`src/lib/viewSummary.ts`): every canvas view's header now shows
  `N shown · M known in domain · K TO FIND`, computed from the view's own domain(s) rather than
  a static string, so it can never silently go stale.
- Orthogonal routing, no-line-crosses-a-card-body, and no-card-overlap were already enforced by
  the existing deterministic layout validator (`scripts/validate-layout.ts`) and re-verified
  after every change in this patch — 0 failures across all 7 views throughout.

## §10 — Search and Suppliers filters

- Confirmed (no code change needed) that global search already indexes every term listed in the
  patch: Mendix, STEP, Stibo Systems, RIFF, Capgemini, Squadra, PowerText.ai, Staffly, eRecruiter,
  RetailSonar, Planon, Daikin, Cloudflare, Microsoft 365, Publitas, SendGrid,
  Cookiebot/Usercentrics, SAP Analytics Cloud, SAP BusinessObjects, Looker Studio, Smartly.io,
  Channable — see the new `tests/e2e/catalogue.spec.ts` search-coverage test.
- Added Suppliers filters (`src/lib/supplierFilters.ts`, `src/pages/SuppliersPage.tsx`): provider
  role, current status, directness, domain, geography, evidence status, known-since year, and
  "has an open provider gap" — all derived live from `commercial_relationships`/`components`, so
  a vendor with no relationship record (4POS, Elo) simply has no value, never a fabricated one.

## §11 — Acceptance tests

Re-verified directly, not just asserted:

- Mendix/STEP exist with public evidence; STEP's vendor attribution is separated from Action's
  deployment evidence; the generic PIM/MDM gap is partially resolved with 3 retained follow-ups;
  the private Richard Lendvai statement stays out of public `claims`; no technical observation
  was promoted to a contractual relationship; no unknown partner was given a fabricated name.
- STEP appears in Total Architecture and ERP & Supply; Mendix renders as a satellite everywhere;
  Digital Experience shows the upstream product-data relationship as an "investigate" edge, not
  an asserted interface; Providers & Partners renders correctly at 1440×900 (see screenshots);
  provider roles are visually distinct (role badges) from systems; Total Architecture stays
  readable at default zoom; no auto-layout was introduced; the layout validator confirms 0
  edge/card-body crossings across all 7 views.
- Digital, Data, People and Foundation all expose the specified omitted systems (§4); Providers &
  Partners lists every named provider and every explicit TO-FIND item; search returns every §10
  term.
- No duplicate vendor/product labels remain (§9); status/evidence badges stay visually distinct
  (existing colour system, unchanged); Current/Observed/Private/Transition/Historical/TO FIND
  remain visually distinct.
- All existing tabs, drawers, evidence and stakeholder links still work; see Test results below.

## Test results

- `npx tsc -b --noEmit` — clean.
- `npx eslint .` — 0 errors (1 pre-existing, unrelated warning in `AuthContext.tsx`).
- `npx vitest run` — **184/184 unit tests passed** across 14 files (10 new: `providersView`,
  `supplierFilters`, `viewSummary`, plus the pre-existing suites, none of which needed changes).
- `npx tsx scripts/validate-layout.ts` — **0 failures across all 7 canvas views**.
- `npx playwright test` — **104/104 passed** on both the `desktop-1440` and `desktop-1920`
  projects (208 total), including 3 new spec files (`providers.spec.ts`, `provider-overlay.spec.ts`,
  plus additions to `catalogue.spec.ts`) and the full pre-existing regression suite (privacy,
  auth, research workflow, deep dives, architecture golden path) unchanged.
- `npm run build` — succeeds (pre-existing >500kB chunk-size warning only, unrelated to this
  patch).
- No console errors observed during any Playwright run.

## Exact source files changed

Modified:

```
scripts/validate-layout.ts
src/App.tsx
src/components/canvas/ArchitectureCanvas.tsx
src/components/logo/VendorLogo.module.css
src/components/nodes/NodeCard.module.css
src/components/shell/AppHeader.module.css
src/components/shell/AppHeader.tsx
src/components/shell/DomainTabs.tsx
src/data/action-architecture-data.json
src/data/deepDiveViews.ts
src/pages/ArchitectureViewPage.tsx
src/pages/SuppliersPage.tsx
src/types/catalogue.ts
tests/e2e/catalogue.spec.ts
docs/screenshots/*.png (regenerated golden screenshots — content genuinely changed)
```

Added:

```
docs/content-completeness-audit.md
docs/service-provider-audit.md
docs/content-provider-patch-changelog.md
docs/content-provider-patch-ids.json
src/components/canvas/ProviderOverlayPanel.tsx
src/components/canvas/ProviderOverlayPanel.module.css
src/components/canvas/ProviderOverlayToggle.tsx
src/components/canvas/ProviderOverlayToggle.module.css
src/lib/providersView.ts
src/lib/supplierFilters.ts
src/lib/viewSummary.ts
src/pages/ProvidersPage.tsx
src/pages/ProvidersPage.module.css
tests/unit/providersView.test.ts
tests/unit/supplierFilters.test.ts
tests/unit/viewSummary.test.ts
tests/e2e/providers.spec.ts
tests/e2e/provider-overlay.spec.ts
docs/screenshots/providers-*.png
docs/screenshots/erp-supply-provider-overlay-*.png
```

## Ranked unresolved research (concise — see `/to-find` and `docs/service-provider-audit.md` for
## the complete 72-item OPEN backlog)

**P0 — blocks a confirmed operating model:**

1. `GAP-058` — current managed-service partners (SAP offshore MSP, cloud ops, service desk, store
   support, domain development partners) — the single biggest provider-ecosystem unknown this
   patch surfaces.
2. `GAP-060` — contract owners, terms and geographies per strategic platform (cross-cutting;
   makes every other platform record operationally usable once resolved).
3. `GAP-001`/`GAP-003`–`GAP-005`/`GAP-007` — target POS/SCO platform and its hardware bill of
   materials (pre-existing, still open, still the largest single architecture unknown).
4. `GAP-040`–`GAP-042` — integration backbone (iPaaS/ESB, API gateway, event streaming) —
   pre-existing Foundation P0s with no owner identified.
5. `GAP-049`/`GAP-051`–`GAP-053` — IAM/SSO/PAM, EDR/XDR, SIEM/SOC, SD-WAN — pre-existing security
   P0s; `GAP-058`'s "current managed-service partners" answer would likely also name the SOC/MSSP
   partner this patch's own Providers TO-FIND section flags.

**P1 — resolves a specific, newly-surfaced provider question:**

6. `GAP-071` — SAP offshore managed-service partner (linked directly to `CMP-SAP-S4`; Joep Groen
   is the existing system owner to start from).
7. `GAP-068` — external digital development partners for Marketing & Format Technology (sourcing
   model publicly confirmed, partner not named).
8. `GAP-069` — Mendix implementation/CoE partner (or confirm an internal-only Centre of Excellence).
9. `GAP-070` — STEP/Stibo implementation and support partner.
10. `GAP-065`/`GAP-066`/`GAP-067` — STEP MDM governance ownership, Mendix↔STEP integration, and
    STEP↔S/4HANA master-data direction — the three follow-ups retained when the generic PIM/MDM
    gap was resolved to STEP.
11. `GAP-072` — ServiceNow implementation and run partner (Karin Bergers already owns the
    platform; this asks who built/runs it).

**P2 — narrows a known-but-unconfirmed detail:**

12. `GAP-073` — contact-centre platform and telephony/CCaaS provider behind RIFF (RIFF's own
    relationship is confirmed; the underlying stack is not, and RIFF isn't drawn on any canvas
    yet — see `docs/content-completeness-audit.md`'s conditional note on when it should be).
13. `GAP-059` — exact SAP CAR role and interfaces (pre-existing, adjacent to this patch's ERP work).
14. `GAP-061` — current Ctac XV footprint and target retirement plan (pre-existing, adjacent to
    this patch's Store & Checkout work).
