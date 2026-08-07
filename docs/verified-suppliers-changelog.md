# Verified-suppliers addition — changelog

Adds the 12 newly-verified vendors/products from the latest brief to the existing Action
Architecture Workbench on `claude/new-session-t1nhhu`. No existing node, edge, component, or gap
was removed or restructured beyond what each item required; no new TO FIND node or candidate
vendor was introduced.

**Important finding, checked before making any change:** 5 of the 12 items were already present
in the app — some in more detail than the brief assumed. Per the brief's own "use existing
components, never duplicate" rule, those 5 were left as no-ops (or given a small text refinement
where the brief's source material added a genuinely new fact) rather than creating a duplicate or
conflicting node. Each is called out explicitly below.

## 1. Genuinely new nodes added

| # | Node | Placement | Status |
|---|---|---|---|
| 1 | **BWise / SAI360 GRC** | ERP & Supply → Warehouse, Transport & Carrier (`es-bwise-sai360`) | Confirmed current — scoped to the Banyeres del Penedès DC only |
| 2 | **ORTEC transport planning & optimisation** | ERP & Supply → Warehouse, Transport & Carrier (`es-ortec`), edge to SAP Transportation Management | Confirmed current — product/module not identified |
| 4 | **SAP RE-FX** (SAP Flexible Real Estate Management) | ERP & Supply → ERP & Procurement Core (`es-sap-refx`), edge from SAP S/4HANA | Confirmed current |
| 9 | **PeopleDoc** | People & Service → HR & Workforce Management (`ps-peopledoc`) | Confirmed current — branded with the existing UKG logo since PeopleDoc is now a UKG product |

Vendors added: `VEN-SAI360`, `VEN-ORTEC`. `VEN-SAP` and `VEN-UKG` were reused (RE-FX and
PeopleDoc respectively) — no new vendor record for either.

`VEN-WWWIFI` (World Wide WiFi Experts) was also added, but only as a **Providers & Partners**
delivery-partner card (`REL-027`, "Cloud and enterprise delivery" section) — per the brief, it was
never added to any core-technology canvas, since the case study does not identify the underlying
network-equipment manufacturer.

## 2. Existing nodes updated (status change or new confirmed fact — not new nodes)

| # | Node | Change |
|---|---|---|
| 3 | **OpenText Vendor Invoice Management for SAP Solutions** (`es-opentext-vim`) | Renamed from "OpenText VIM — probable"; status `suspected` → `current`, evidence `inferred` → `confirmed_first_party`, on the strength of the new Portfolio & Lease Specialist posting corroborating the original S2P posting |
| 7 | **SymphonyAI GOLD — Forecasting, Replenishment & Allocation** (`es-symphony-gold`) | Renamed; added operational/new-item/promotional/seasonal allocation and assortment phase-in/phase-out to the component's `business_process` and the node subtitle |
| 8 | **SAP SuccessFactors** (`ps-successfactors`) | Subtitle "Core HR" → "Core HR & onboarding". Employee Central Payroll was already modelled as its own confirmed node (`ps-ecp`) — not duplicated |
| 11 | **Algolia app product search & ranking** (`dc-algolia`) | Renamed from "Algolia product search"; subtitle now names ranking optimisation and consent-based personalised sorting, from the same cookie-statement source already on file |

## 3. Items already fully present — no node added, no duplicate created

| # | Requested item | What's already there |
|---|---|---|
| 5 | **ServiceNow platform** | Already modelled in **People & Service** (not Foundation) as `ps-servicenow`, with ITSM/CSM/CMDB module nodes (`ps-sn-itsm`, `ps-sn-csm`, `ps-sn-cmdb`), all `CURRENT` / `CONFIRMED_FIRST_PARTY`. The brief's job-posting URL is a different mirror of the same ServiceNow Solution Architect posting already on file (`SRC-ACTION-JOB-SERVICENOW`). Adding a second ServiceNow node in Foundation would have duplicated it and put it in two places at once — skipped. The existing ITSM/CSM/CMDB module nodes pre-date this patch and were left untouched (removing them was not something this brief asked for). |
| 10 | **Kronos** | Already modelled as `ps-kronos` ("Kronos Workforce Central", `legacy`) with its confirmed migration target `ps-ukg-pro-wfm` ("UKG Pro Workforce Management", `transition`) — a more specific pair than the brief assumed exists. The brief's job-posting URL again mirrors the existing `SRC-ACTION-JOB-KRONOS-UKG`-style source. No change made. |
| 12 | **Firebase Crashlytics** | Already modelled in **Digital Experience** as `dc-firebase-analytics` ("Firebase Crashlytics & Analytics"), citing the exact same cookie-statement URL the brief gives, whose `evidence_scope` already reads "Algolia, Firebase Analytics and Crashlytics." A *separate* "Google Firebase app platform" parent node exists, but in the **Data & Customer Intelligence** view, not Digital Experience — restructuring Digital Experience's existing combined node into a parent/child pair to match would have gone beyond "add a new verified node" into rearchitecting an existing, working node. Left as-is. |

Items 5, 10 and 12 are flagged here rather than silently skipped so this can be corrected in a
follow-up brief if the intent was actually to consolidate or relocate them.

## 4. Full list of new/updated catalogue IDs

- New vendors: `VEN-SAI360`, `VEN-ORTEC`, `VEN-WWWIFI`
- New components: `CMP-SAI360-GRC`, `CMP-ORTEC`, `CMP-SAP-REFX`, `CMP-PEOPLEDOC`
- Updated components: `CMP-OPENTEXT-VIM`, `CMP-SYMPHONY-GOLD`, `CMP-SUCCESSFACTORS`, `CMP-ALGOLIA`
- New commercial relationship: `REL-027` (World Wide WiFi Experts)
- New evidence sources: `SRC-ACTION-JOB-WPC-SAI360`, `SRC-ACTION-JOB-TRANSPORT-PLANNER`,
  `SRC-ACTION-JOB-PORTFOLIO-LEASE`, `SRC-ACTION-JOB-HRIS-DMS`, `SRC-ACTION-JOB-HRIS-ONBOARDING`,
  `SRC-ACTION-JOB-SCP-ANALYST`, `SRC-ACTION-JOB-ALLOCATOR`, `SRC-WWWIFI-CASE-STUDY`
- New claims: `CLM-0207`–`CLM-0215`
- New canvas nodes: `es-sap-refx`, `es-bwise-sai360`, `es-ortec`, `ps-peopledoc`
- New canvas edges: `es-e23` (SAP S/4HANA → SAP RE-FX), `es-e24` (SAP Transportation Management ↔
  ORTEC)
- Logo registry additions: `VEN-SAI360`, `VEN-ORTEC`, `VEN-WWWIFI` (typographic wordmarks — none
  has a simple-icons mark)

## 5. Verification

- `npx tsx scripts/validate-layout.ts` — 0 layout failures across all 7 views.
- `npx tsc -b --noEmit` — clean.
- `npx eslint .` — 0 errors (1 pre-existing, unrelated warning).
- `npx vitest run` — 184/184 passed.
- `npx playwright test --project=desktop-1440 --project=desktop-1920` — 208/208 passed.
- Screenshots refreshed: `docs/screenshots/erp-supply-desktop-1920.png`,
  `docs/screenshots/people-service-desktop-1920.png`,
  `docs/screenshots/digital-commerce-desktop-1920.png`,
  `docs/screenshots/foundation-security-desktop-1920.png` (confirms no duplicate ServiceNow node
  was added here), `docs/screenshots/providers-desktop-1920.png`.
