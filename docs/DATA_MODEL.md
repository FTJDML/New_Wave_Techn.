# Action data model — schema reference

Everything the app knows about Action's IT landscape lives in one file:
**`src/data/action-architecture-data.json`**. This document explains its structure table by table
and field by field, so it can be read and reasoned about without opening the (very large) raw
file. Read `docs/PROJECT_HANDOFF.md` first for how this data is actually consumed by the app.

## 0. Top-level shape

```
{
  bundleSchemaVersion, generatedOn, purpose, usageRules,   // metadata, informational only
  curatedArchitecture: { view, logoRegistry },             // → src/data/curatedView.ts (Total Architecture)
  viewManifest: [ ... ],                                    // planning metadata for the 6 deep-dive views
  coreSystemCatalogue: { metadata, vendors, systems, architecture_relationships,
                          commercial_relationships, programmes, research_gaps,
                          evidence_sources, claims, technical_observations },
  fullResearchCatalogue: { metadata, taxonomies, domains, capabilities, vendors, components,
                            component_capabilities, architecture_edges, commercial_relationships,
                            programmes, evidence_sources, claims, technical_observations,
                            stakeholders, ownership_links, cgi_relationships, research_gaps,
                            research_tasks, architecture_views, architecture_groups,
                            view_nodes, view_edges },
  toFindBacklog: [ ... ],                                   // informational summary, not read by the app
  researchUpdateTemplate: { ... },                          // a blank-record template for manual research entry
}
```

**Two parallel catalogues exist on purpose.** `coreSystemCatalogue` is the original, smaller
catalogue (26 vendors, 69 systems) that seeded the very first Total Architecture view early in the
project. `fullResearchCatalogue` is the real, continuously-extended catalogue (60 vendors, 166
components as of the last patch) that every catalogue page, every deep-dive view, and the drawer
actually read from at runtime (`src/data/fullCatalogue.ts` is the only reader — never import the
raw JSON directly). **When adding or changing data, edit `fullResearchCatalogue`.**
`coreSystemCatalogue` is kept for lineage/history and is not actively extended.

`fullResearchCatalogue.architecture_views` / `architecture_groups` / `view_nodes` / `view_edges`
exist only because the optional Supabase schema (`supabase/migrations/0001_schema.sql`) has
matching tables for a possible future server-persisted view editor. **The seed script
deliberately does not seed them, and the live app never reads them.** The real, currently-used
view geometry is hand-authored TypeScript in `src/data/curatedView.ts` and
`src/data/deepDiveViews.ts` — see `PROJECT_HANDOFF.md` §3.2. Don't confuse these JSON arrays with
the actual rendered layout.

Everything below describes **`fullResearchCatalogue`**'s tables. `coreSystemCatalogue` mirrors a
subset of the same shape under slightly different field names (`systems` instead of `components`,
`architecture_relationships` instead of `architecture_edges`) and is not detailed further here.

## 1. Reference/taxonomy tables

### `domains` (14 rows)
The top-level groupings components roll up into (e.g. `DOM-STORE`, `DOM-ERP`, `DOM-DATA`,
`DOM-PEOPLE`, `DOM-INTEGRATION`, `DOM-FACILITY`, `DOM-PARTNERS`, …).

| Field | Meaning |
|---|---|
| `domain_id` | e.g. `DOM-COMMERCE` |
| `domain_name` | Human label |
| `parent_domain_id` | For sub-domains; usually empty |
| `description` | One line |
| `display_order` | Sort hint |

### `capabilities` (49 rows)
Finer-grained business/technical capabilities within a domain (e.g. `CAP-STORE-POS`,
`CAP-FORECAST`, `CAP-WFM`, `CAP-ITSM`). Every component has exactly one `primary_capability_id`;
a component can additionally have several rows in `component_capabilities` for secondary
capabilities.

| Field | Meaning |
|---|---|
| `capability_id` | e.g. `CAP-TMS` |
| `capability_name` | Human label |
| `domain_id` | Owning domain |
| `description` | One line |

## 2. The core entity tables

### `vendors` (60 rows)
One row per company. **Every new supplier gets one of these** (unless it's a product from a
vendor already modelled — e.g. PeopleDoc reuses `VEN-UKG` rather than getting its own vendor row).

| Field | Meaning |
|---|---|
| `vendor_id` | e.g. `VEN-SAP`, `VEN-ADYEN` — stable, referenced everywhere |
| `vendor_name` | Display name |
| `vendor_category` | Free-text category, e.g. "Enterprise software", "Payments" |
| `website_url` | |
| `logo_slug` | A [simple-icons](https://simpleicons.org/) slug if the mark exists there, else `""` (the app then falls back to a typographic wordmark — see `src/data/curatedView.ts`'s `DEEP_DIVE_LOGO_ADDITIONS` and `src/components/logo/brandIcons.ts`) |
| `action_relationship_summary` | Usually left empty; free-text if needed |

### `components` (166 rows)
One row per system/product/platform — the single most important table. A canvas node's
`catalogRefs` array points here (one node can reference more than one component, e.g. a combined
"Firebase Crashlytics & Analytics" canvas card references two component rows).

| Field | Meaning |
|---|---|
| `component_id` | e.g. `CMP-ADYEN` — stable, referenced by edges/gaps/claims/canvas nodes |
| `component_key` | Short slug form of the id |
| `display_name` | What renders as the title (on canvas and in the drawer) |
| `vendor_id` / `vendor_name` | FK into `vendors`; **may be empty** when the capability is confirmed but the vendor isn't (see `capability_confirmed` status) |
| `product_name` | Full product name, may differ from `display_name` |
| `domain_id`, `primary_capability_id` | FKs into the taxonomy tables above |
| `parent_component_id`, `core_component_id` | For a module that belongs to a bigger platform (e.g. `CMP-SN-ITSM`'s parent is `CMP-SERVICENOW`) |
| `node_type` | Almost always `SYSTEM` |
| `architecture_role` | Free-text role, e.g. `CORE_SYSTEM_OF_RECORD`, `SATELLITE_APPLICATION`, `DOMAIN_PLATFORM` |
| `business_process` | What it's actually used for — this is the field that grows when a component gains a newly-confirmed capability (e.g. SymphonyAI GOLD's allocation-scope expansion) |
| `description` | Usually empty; longer free text if needed |
| `deployment_status` | **Not the same enum as the canvas's `DeploymentStatus`** — this is the catalogue-level equivalent, uppercase: `CURRENT`, `SUSPECTED`, `HISTORICAL`, `TRANSITION`, `LEGACY`, `VISUALLY_CONFIRMED`, `CAPABILITY_CONFIRMED`, … (see `src/lib/catalogueStatusMeta.ts`'s `DEPLOYMENT_COLORS` for the exact set the UI colors) |
| `evidence_status` | `CONFIRMED_FIRST_PARTY`, `CONFIRMED_VENDOR_CASE`, `TECHNICALLY_OBSERVED`, `INFERRED`, `PRIVATE_CONFIRMATION`, … |
| `confidence_score` (0–100), `confidence_band` (`LOW`/`MEDIUM`/`HIGH`/`VERY_HIGH`) | |
| `lifecycle_disposition` | One of exactly 4 values: `INVEST`, `INVESTIGATE`, `MIGRATE`, `RETIRE` |
| `modernity` | Free text, e.g. `MODERN_SAAS`, `MIXED`, `UNKNOWN` |
| `strategic_classification` | Free text, a large and growing vocabulary (e.g. `CORE_MODULE`, `PROBABLE_PLATFORM`, `STRATEGIC_HR_CORE`) — not a strict enum, but reuse an existing value where one fits before inventing a new one |
| `system_of_record` | `YES` / `NO` / `PARTIAL` / `UNKNOWN` |
| `criticality` | `LOW` / `MEDIUM` / `HIGH` / `MISSION_CRITICAL` |
| `hosting_model`, `deployment_model`, `geography_scope`, `user_groups` | Free text, often `UNKNOWN` |
| `first_known_year`, `relationship_start_year`, `relationship_start_precision`, `relationship_duration_years_json`, `contract_directness` | Commercial/temporal metadata, usually sparse (`UNKNOWN`) unless directly evidenced |
| `last_verified_date` | ISO date — bump this whenever you touch the row |
| `primary_source_id` / `primary_source_url` | The single best citation |
| `source_ids` | Array of every `evidence_sources.source_id` backing this row |
| `open_questions` | What's still not known — keep this honest and current; this is what a reader relies on to know the finding's limits |
| `notes` | Free text, often used for an explicit caveat (e.g. "confirmed at this specific DC only — not evidenced enterprise-wide") |

### `component_capabilities` (171 rows)
Many-to-many join between components and *secondary* capabilities (a component's *primary*
capability is on the component row itself).

| Field | Meaning |
|---|---|
| `component_capability_id` | e.g. `CC-CHANNEL-STORES-STORE-POS` |
| `component_id`, `capability_id` | FKs |
| `relationship_type` | e.g. `PRIMARY`, `SECONDARY` |
| `confidence_score` | |
| `source_ids` | |

### `architecture_edges` (164 rows)
The **catalogue-level** relationship records — distinct from a canvas edge's `points` polyline
(§3.2 of the handoff doc). A canvas edge *may* cite one of these via `canonicalRelationshipIds`,
but doesn't have to (several patches added canvas edges with no catalogue-level edge behind them
when the relationship was inferred purely from the two components' co-occurrence in a source,
without a dedicated integration claim to back it).

| Field | Meaning |
|---|---|
| `edge_id` | e.g. `EDGE-0161` |
| `from_component_id`, `to_component_id` | FKs |
| `relationship_type`, `direction`, `integration_status` | Free text |
| `confidence_score`, `confidence_band` | |
| `integration_pattern`, `data_objects`, `frequency`, `business_purpose` | Integration detail, often sparse |
| `edge_style` | Rendering hint (loosely mirrors the canvas `ViewEdgeType`s) |
| `is_missing_link` | `true` for a confirmed *gap* in integration (as opposed to a gap in knowledge) |
| `primary_source_url`, `source_ids` | |
| `validation_question` | What a researcher should still check |
| `notes` | |

### `commercial_relationships` (27 rows)
Who Action actually *contracts with*, as opposed to what system exists — this is the table behind
the **Providers & Partners** page and the provider-overlay toggle on every canvas view
(`src/lib/providersView.ts`). A relationship can exist with an empty `component_ids` (e.g. a
services engagement like a WiFi site survey that isn't tied to any specific catalogued system).

| Field | Meaning |
|---|---|
| `relationship_id` | e.g. `REL-027` |
| `vendor_id`, `vendor_name` | FK |
| `provider_role` | **A strict TypeScript union** (`ProviderRole` in `src/types/catalogue.ts`) — one of `SOFTWARE_PLATFORM_VENDOR`, `IMPLEMENTATION_PARTNER`, `MANAGED_SERVICE_PROVIDER`, `ROLLOUT_INTEGRATOR`, `PHYSICAL_SYSTEMS_INTEGRATOR`, `BPO_OR_CUSTOMER_OPERATIONS_PROVIDER`, `CONTENT_DATA_AI_SPECIALIST`, `REGIONAL_RECRUITMENT_SPECIALIST`, `CLOUD_MIGRATION_PARTNER`, `LOGISTICS_CONNECTIVITY_PROVIDER`, `FACILITY_OT_PROVIDER`, `CANDIDATE_AFFILIATION`, `UNKNOWN_PROVIDER`. Adding a 13th value means editing that type too. |
| `relationship_type` | Free text, e.g. `DIRECT_SUPPLIER`, `PROJECT_ENGAGEMENT` |
| `scope_summary` | One-line description of what they actually do |
| `start_year`, `start_precision`, `known_since_year`, `relationship_duration_years_json` | |
| `current_status`, `lifecycle_status` | Free text — a fairly large existing vocabulary (`CURRENT`, `CURRENT_BUT_TRANSITIONING`, `PROJECT_CONFIRMED_CURRENT_SCOPE_UNKNOWN`, `HISTORICAL_PROJECT_CONFIRMED_CURRENT_SCOPE_UNKNOWN`, …) — reuse a value if one already fits the evidentiary shape |
| `strategic_role` | Free text |
| `geography_scope`, `directness` | |
| `implementation_partner_id`, `support_partner_id` | Optional FKs to another vendor |
| `component_ids` | Array of `components.component_id` this relationship touches — **can be empty** |
| `supported_capability_ids` | Array of `capabilities.capability_id` |
| `evidence_status`, `confidence_score`, `confidence_band` | |
| `source_ids`, `primary_source_url`, `last_verified_date` | |
| `open_questions` | |
| `data_classification` | e.g. `INTERNAL` |
| `notes` | |

### `programmes` (6 rows)
Named transformation initiatives (e.g. "Store cash-register software transition") that connect a
`source_component_ids` set to a `target_component_ids` set — used sparingly, only when Action's own
material explicitly frames something as a programme rather than just a component-level transition.

## 3. Evidence & claims — the tables that make everything checkable

### `evidence_sources` (52 rows)
One row per **citable source** — a URL or reference, never a bare assertion.

| Field | Meaning |
|---|---|
| `source_id` | e.g. `SRC-ACTION-JOB-SERVICENOW` — human-readable slug, not sequential |
| `source_title` | |
| `publisher` | Who published it (`Action`, a vendor name, `World Wide WiFi Experts`, …) |
| `source_type` | `FIRST_PARTY`, `FIRST_PARTY_JOB` (an Action job posting), `VENDOR_CASE`, `VENDOR_PRODUCT_PAGE`, `VENDOR_SUPPORT_PAGE`, `TECHNICAL_SCAN`, `TECHNICAL_ENDPOINT`, `VISUAL_EVIDENCE`, `PRIVATE_SOURCE`, `PROJECT_WORKING_FILE` |
| `publication_date_or_year` | Often empty |
| `url_or_reference` | The actual link — always fill this in for a public source |
| `evidence_scope` | What this source actually confirms — write this precisely, it's what a reviewer trusts instead of re-reading the source |
| `last_verified_date` | |
| `reliability_rating_1_5` | Editorial judgement, not automated |
| `notes` | |

### `claims` (215 rows)
One row per **discrete factual assertion**, each citing one or more `evidence_sources`. This is
the layer that lets multiple components/relationships share one source without re-typing the
evidence, and lets an evidence page list "everything this source has been used to support."

| Field | Meaning |
|---|---|
| `claim_id` | e.g. `CLM-0206` — sequential |
| `subject_type` | `COMPONENT`, `COMMERCIAL_RELATIONSHIP`, `ARCHITECTURE`, or `PROGRAMME` |
| `subject_id` | FK into the matching table |
| `predicate` | A fairly small controlled vocabulary: `DEPLOYMENT_OR_RELATIONSHIP`, `HISTORICAL_DEPLOYMENT`, `CAPABILITY_CONFIRMED`, `CURRENT_STATUS`, `LIFECYCLE_STATUS`, `RELATIONSHIP_START_YEAR`, `IDENTIFICATION_STATUS`, `WORKING_HYPOTHESIS`, `CORE_PATTERN`, `TECH_SCAN_RULE`, `DEPLOYMENT_SIGNAL`, `PRIVATE_RELATIONSHIP_SIGNAL`, `PROGRAMME_STATUS`, `ONLINE_COMMERCE_STATUS` — pick the closest existing one |
| `value` | The actual claim sentence, plain English |
| `claim_status` | Almost always `SUPPORTED` |
| `confidence_score`, `confidence_band` | |
| `date_checked`, `valid_from`, `valid_to` | |
| `source_ids` | |
| `data_classification` | `INTERNAL` for the vast majority |
| `notes` | Often used for an explicit caveat |

### `technical_observations` (34 rows)
Raw technical-scan findings (e.g. a detected JS library or hosting header) that have **not yet**
been promoted to a confirmed claim — this is the table the Phase 4 promotion workflow
(`PromoteObservationForm.tsx`) reads from and writes into `claims`/`components` when a researcher
promotes one with a citing source and a note.

| Field | Meaning |
|---|---|
| `observation_id`, `technology_name`, `vendor_name`, `category` | |
| `mapped_component_id` | Which component this observation is evidence *for*, if any |
| `hostname_or_scope`, `observation_date`, `observation_date_semantics`, `first_seen`, `last_seen`, `currentness` | |
| `evidence_status`, `confidence_score` | |
| `direct_contract_inference_allowed` | `false` means: this observation alone must never be read as proof of a direct commercial contract (e.g. seeing a CDN's fingerprint doesn't prove a direct relationship with that CDN vendor) |
| `source_id`, `notes` | |

## 4. Gaps & tasks — the "what we don't know yet" tables

### `research_gaps` (76 rows)
Every `TO FIND` card on every canvas is backed by exactly one of these.

| Field | Meaning |
|---|---|
| `gap_id` | e.g. `GAP-004` |
| `gap_component_id` | Usually a placeholder component id the gap represents (kept even after resolution — see below) |
| `domain_id` | |
| `gap_title`, `why_essential`, `research_question`, `current_hypothesis` | |
| `priority` | `P0`–`P3` — mirrors the canvas `GapPriority` |
| `impact_area`, `gap_status` (`OPEN`/`RESOLVED`/…), `research_route`, `target_stakeholders_or_sources`, `evidence_needed`, `recommended_next_action`, `research_owner`, `target_date` | |
| `created_date`, `last_updated_date` | |
| `linked_component_ids`, `linked_edge_ids`, `source_ids` | |
| `resolution_summary`, `resolved_component_id` | **The established resolution pattern**: when a gap gets resolved by a newly-confirmed component, the *original placeholder component is left completely untouched* — all resolution information goes only into these two fields plus `gap_status: 'RESOLVED'`. Don't delete or repurpose the old placeholder row; don't skip filling these in. |

### `research_tasks` (76 rows)
Actionable next steps against a gap (one gap can have several).

| Field | Meaning |
|---|---|
| `task_id`, `gap_id` | |
| `task_title`, `task_type`, `status`, `priority`, `assigned_to`, `next_action`, `target_date` | |
| `result_summary`, `new_source_ids` | Filled in once work happens |
| `created_date`, `updated_date` | |

## 5. People tables — privacy-classified, gated in the UI

These three tables exist for internal ownership/relationship tracking and are **never rendered in
the public-facing UI** — see `PROJECT_HANDOFF.md` §2.7 and `tests/e2e/privacy.spec.ts`. Real names
only ever surface behind Supabase auth on `/stakeholders`. Treat any row in these tables as
sensitive regardless of where you're viewing the data from.

### `stakeholders` (31 rows)
A person believed to hold a role relevant to Action's IT landscape. Fields: `stakeholder_id`,
`full_name`, `title`, `department_or_cluster`, `seniority`, `current_status`, `mandate_summary`,
`linkedin_url`, `evidence_status` (often `WORKING_HYPOTHESIS`), `confidence_score`/`band`,
`source_ids`, `data_classification` (`INTERNAL_CONFIDENTIAL`), `notes`.

### `ownership_links` (104 rows)
Many-to-many: which stakeholder is believed to own which domain/component/programme. Fields:
`ownership_link_id`, `stakeholder_id`, `object_type` (`DOMAIN`/`COMPONENT`/…), `object_id`,
`owner_role`, `evidence_status`, `confidence_score`/`band`, `source_ids`, `notes`. The
`OwnershipSection.tsx` component renders these **masked** in the public UI (role visible, identity
hidden) unless the viewer is authenticated.

### `cgi_relationships` (7 rows)
Private intelligence about warm introduction routes (e.g. a consulting contact who knows a given
stakeholder). Fields: `cgi_relationship_id`, `target_type`, `target_id`, `cgi_contact_name`,
`relationship_type`, `warmth`, `history`, `possible_intro`, `next_action`,
`data_classification` (`RESTRICTED`), `source_reference`. This table is the most sensitive one in
the whole bundle — it is not seeded into Supabase either (see `PROJECT_HANDOFF.md` §4, Phase 5) and
has no UI surface at all; it exists purely as a private research artifact inside the JSON file.

## 6. How the canvas layer references all of this

A canvas node (`ArchitectureViewNode` in `src/types/architecture.ts`) never repeats catalogue data
— it carries only presentation fields (`x`/`y`/`w`/`h`, `kind`, `status`, `evidence`,
`vendorId`) plus a `catalogRefs: string[]` pointing at one or more `components.component_id`
values. Clicking a node resolves those refs through `src/data/fullCatalogue.ts` and renders the
full record — including its evidence, claims, linked edges, and any open `research_gaps` — in
`SystemDetailDrawer.tsx`. If you add a component to the catalogue but never reference it from any
node's `catalogRefs`, it's still fully visible on `/systems`, `/suppliers`, `/evidence` etc. — it
just won't appear on any diagram until a node is added for it.
