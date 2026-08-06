# Content-completeness audit

Companion to `docs/service-provider-audit.md`, per the "Claude Code Action Content and Provider
Patch v2.2" prompt's §1. This audit inspects the actual runtime data and view files as they
exist on `claude/new-session-t1nhhu` before any patch code was written, so every count below is
computed directly from `src/data/action-architecture-data.json` and `src/data/deepDiveViews.ts`
— nothing here is estimated.

## Canonical files actually used at runtime

- **`src/data/action-architecture-data.json`** — the single source JSON. `fullResearchCatalogue`
  is the canonical, currently-used research catalogue (`coreSystemCatalogue` is an earlier/smaller
  Phase 1 catalogue, superseded and no longer read by any page). `curatedArchitecture.view` is the
  Total Architecture canvas; `curatedArchitecture.logoRegistry` is the base logo registry.
- **`src/data/deepDiveViews.ts`** — the 6 domain deep-dive canvases (`storeCheckoutView`,
  `digitalCommerceView`, `erpSupplyView`, `dataIntelligenceView`, `peopleServiceView`,
  `foundationSecurityView`) are hand-authored TypeScript literals in this one file, **not** stored
  in the JSON — `viewManifest.views` in the JSON is a planning manifest only, superseded by this
  file's actual content.
- **`src/data/curatedView.ts`** — loads the Total Architecture view and merges the logo registry
  with two hardcoded override maps (`LOGO_STRATEGY_OVERRIDES`, `DEEP_DIVE_LOGO_ADDITIONS`).
- **`scripts/validate-layout.ts`** / **`scripts/layoutRules.ts`** — the deterministic layout
  gate, run against a fixed array of the 7 views above.

## Counts

| Record type | Count |
|---|---|
| Vendor records (`fullResearchCatalogue.vendors`) | 52 |
| System/component records (`fullResearchCatalogue.components`) | 155 |
| Commercial relationships (`fullResearchCatalogue.commercial_relationships`) | 24 |
| Known implementation/service/rollout partners (relationships typed `IMPLEMENTATION_PARTNER`, or vendor category naming a delivery role — Capgemini, Squadra, Ctac, Pan Oston, TCS, RIFF, Wuunder, Planon, Daikin, Staffly, RetailSonar) | 11 |
| Technical observations (`fullResearchCatalogue.technical_observations`) | 34 |
| TO FIND gaps (`fullResearchCatalogue.research_gaps`) | 64 (all `OPEN`) |
| Of which explicitly provider/partner-shaped (not a platform/system gap) | 2 today (GAP-010 store field-service partner, GAP-058 current managed-service partners) — see `docs/service-provider-audit.md` §4 for the additional provider-TO-FIND records this patch adds |

**Components actually rendered as a node somewhere** (union of Total Architecture's 29 nodes and
all 6 deep dives' nodes, by `catalogRefs`): **95 of 155** (61%). The other **60 exist in the
catalogue but are not drawn on any canvas today** — see the classification below. This is not
inherently a defect: `/to-find`, `/systems`, `/suppliers` and search already surface the full
catalogue regardless of what's on canvas, and several deep-dive `rules.maxVisibleGaps` /
`maxVisibleTopLevelCards` limits deliberately cap what's visible per view.

## The six classes

### 1. Displayed in the current architecture (95 components)

Every component referenced by a node's `catalogRefs` in `curatedArchitecture.view` or any of the
6 `deepDiveViews.ts` exports. Includes all core systems (Ctac XV, SAP S/4HANA, SymphonyAI GOLD,
Databricks, ServiceNow, SuccessFactors, etc.) and their already-curated satellites (Contentstack,
Algolia, Adyen, NEXT AI, Wuunder, TCS Optumera, Elo, Anaplan, and others).

### 2. Known in the catalogue but omitted from every deep dive (60 components)

The full list (id | vendor | display name):

```
CMP-XV-POS | VEN-CTAC | XV POS
CMP-XV-SCO | VEN-CTAC | XV self-checkout
CMP-XV-MPOS | VEN-CTAC | XV mobile POS
CMP-XV-API | VEN-CTAC | XV APIs / Central Services
CMP-XV-OCL | VEN-CTAC | XV Omni Customer Loyalty
CMP-XV-PRICE-PROMO | VEN-CTAC | XV Price & Promotion
CMP-XV-VIRTUAL-BASKET | VEN-CTAC | XV virtual basket
CMP-STORE-HANDHELDS | VEN-UNKNOWN | TO FIND — store handheld terminals
CMP-STORE-NETWORK | VEN-UNKNOWN | TO FIND — store network / SD-WAN / Wi-Fi
CMP-LOYALTY-DIGITAL-RECEIPT | VEN-UNKNOWN | TO FIND — loyalty and digital receipt architecture
CMP-GIFTCARD | VEN-UNKNOWN | TO FIND — gift-card platform
CMP-PUBLITAS | VEN-PUBLITAS | Publitas digital catalogue
CMP-POWERTEXT | VEN-SQUADRA | PowerText.ai product content
CMP-SENDGRID | VEN-TWILIO | Twilio SendGrid email delivery
CMP-FIREBASE-ANALYTICS | VEN-GOOGLE | Firebase Analytics
CMP-FIREBASE-CRASHLYTICS | VEN-GOOGLE | Firebase Crashlytics
CMP-HOTJAR | VEN-HOTJAR | Hotjar UX analytics
CMP-COOKIEBOT | VEN-USERCENTRICS | Cookiebot / Usercentrics consent
CMP-CRM-CDP | VEN-UNKNOWN | TO FIND — CRM / CDP / personalization core
CMP-CONTACT-CENTER | VEN-UNKNOWN | TO FIND — customer-service / contact-center platform
CMP-MOPINION | VEN-MOPINION | Mopinion feedback source
CMP-QA-RETAIL | VEN-QARETAIL | Q&A Retail feedback source
CMP-UBERALL | VEN-UBERALL | Uberall local listings source
CMP-RIFF | VEN-RIFF | RIFF customer-contact services
CMP-SMARTLY | VEN-SMARTLY | Smartly.io
CMP-CHANNABLE | VEN-CHANNABLE | Channable
CMP-GOOGLE-ADS | VEN-GOOGLE | Google advertising and measurement
CMP-META-ADS | VEN-META | Meta advertising
CMP-TIKTOK-ADS | VEN-TIKTOK | TikTok advertising
CMP-PINTEREST-ADS | VEN-PINTEREST | Pinterest advertising
CMP-AWIN | VEN-AWIN | Awin affiliate network
CMP-S4-SALES-POSTING | VEN-SAP | SAP S/4 sales posting scope
CMP-TAX-CONSOLIDATION | VEN-UNKNOWN | TO FIND — tax / consolidation platform
CMP-TREASURY-BANKING | VEN-UNKNOWN | TO FIND — treasury / banking interfaces
CMP-GOLD-PROMOTION | VEN-SYMPHONYAI | GOLD promotion planning
CMP-GOLD-WH-REPLENISH | VEN-SYMPHONYAI | GOLD warehouse replenishment
CMP-RETAILSONAR | VEN-RETAILSONAR | RetailSonar location intelligence
CMP-SPACE-SHELF | VEN-UNKNOWN | TO FIND — space / shelf / planogram tooling
CMP-ROUTE-OPTIMIZATION | VEN-UNKNOWN | TO FIND — route planning / optimization
CMP-EMPLOYEE-CENTRAL | VEN-SAP | SAP SuccessFactors Employee Central
CMP-STAFFLY | VEN-STAFFLY | Staffly recruitment assessments — Poland
CMP-ERECRUITER | VEN-ERECRUITER | eRecruiter — probable regional ATS
CMP-LMS | VEN-UNKNOWN | TO FIND — learning-management platform
CMP-PLANON | VEN-PLANON | Planon facilities / real estate
CMP-DAIKIN-HVAC | VEN-DAIKIN | Daikin HVAC and store support
CMP-BMS-ENERGY | VEN-UNKNOWN | TO FIND — building / energy management platform
CMP-INTEGRATION-MONITORING | VEN-UNKNOWN | TO FIND — integration monitoring
CMP-OBSERVABILITY | VEN-UNKNOWN | TO FIND — observability / APM / logging
CMP-SAP-SAC | VEN-SAP | SAP Analytics Cloud
CMP-SAP-BO | VEN-SAP | SAP BusinessObjects
CMP-LOOKER-STUDIO | VEN-GOOGLE | Google Looker Studio
CMP-CLOUDFLARE | VEN-CLOUDFLARE | Cloudflare edge / DNS / bot / security
CMP-AWS-SIGNAL | VEN-AWS | Amazon Web Services hosting signal
CMP-VERCEL-SIGNAL | VEN-VERCEL | Vercel hosting signal
CMP-FASTLY-SIGNAL | VEN-FASTLY | Fastly hosting / load-balancer signal
CMP-M365 | VEN-MICROSOFT | Microsoft 365 / Exchange Online
CMP-TELECOM | VEN-UNKNOWN | TO FIND — telecom / mobile / voice
CMP-DEVOPS-CICD | VEN-UNKNOWN | TO FIND — DevOps / CI/CD / source control
CMP-TEST-AUTOMATION | VEN-UNKNOWN | TO FIND — test-management / automation tooling
CMP-CAPGEMINI-AZURE | VEN-CAPGEMINI | Capgemini Azure migration partner
```

Sub-groups within this class, since "omitted" covers very different situations:

- **Already-modelled submodules of a curated core** (7): the `CMP-XV-*` records are Ctac XV's
  own modules — the parent `CMP-CTAC-XV` card is on canvas everywhere it matters; these aren't a
  content gap, just a level of detail below what a card shows.
- **Confirmed/observed satellites never drawn** (~25): Publitas, PowerText.ai, SendGrid, Firebase
  Analytics/Crashlytics, Hotjar, Cookiebot, Mopinion, Q&A Retail, Uberall, RIFF, Smartly.io,
  Channable, the ad-platform components, SAP SAC/BusinessObjects, Looker Studio, Cloudflare,
  AWS/Vercel/Fastly signals, M365, RetailSonar, Staffly, eRecruiter, Planon, Daikin, Capgemini,
  GOLD promotion/warehouse-replenish modules, SuccessFactors Employee Central. This is what §4 of
  the patch targets — the patch adds curated nodes for the highest-value subset of these across
  the relevant deep dives (see the changelog for exactly which).
- **Un-drawn `TO FIND` gaps** (17, all `VEN-UNKNOWN`/`evidence_status: UNKNOWN`): store
  handheld terminals, store network, loyalty/digital receipt, gift card, CRM/CDP, contact center,
  tax/consolidation, treasury/banking, space/shelf, route optimization, LMS, BMS/energy,
  integration monitoring, observability, telecom, DevOps/CI-CD, test automation. These are real
  gaps in `research_gaps` and already fully visible on `/to-find` — they're absent from canvases
  by design, not oversight: every view's `rules.maxVisibleGaps` (8–10) deliberately shows only
  the highest-priority gaps per domain, per `CLAUDE.md`'s "no more than eight essential TO FIND
  cards" rule. Not touched by this patch.

### 3. Newly evidenced and absent from the local catalogue

**Mendix** and **STEP MDM** — confirmed absent from every vendor/component/relationship record
before this patch (checked by exact name and by every vendor category). Added in this patch —
see `docs/service-provider-audit.md` §1–2 and `docs/content-provider-patch-changelog.md`.

### 4. Technical observation only (non-contractual, per `evidence_status`)

`TECHNICALLY_OBSERVED` / `INDIRECTLY_CONFIRMED` / `INFERRED` components already in the catalogue,
none of which may ever be promoted to a confirmed relationship without new evidence (existing
rule, unchanged by this patch): XV Price & Promotion, XV virtual basket, Next.js, React,
Cloudinary, Publitas, SendGrid, Hotjar, Cookiebot/Usercentrics, Salesforce (product unknown),
Mopinion, Q&A Retail, Uberall, Google Ads, Awin, SAP S/4 sales-posting scope, eRecruiter,
Cloudflare, AWS/Vercel/Fastly hosting signals, Microsoft 365. 34 `technical_observations` records
back these; none are treated as supplier contracts anywhere in the app (`SystemDetailDrawer`
already labels `TECHNICALLY_OBSERVED` distinctly from `CONFIRMED_*`).

### 5. Known service/delivery partner

Vendors whose `commercial_relationships.relationship_type` is `IMPLEMENTATION_PARTNER`, or whose
role is a delivery/rollout/BPO function rather than a licensed platform: **Capgemini**
(`REL-005`, Azure migration, 2017, current scope unknown), **Squadra** (`REL-018`, PowerText.ai
implementation/SaaS, scope unknown), **Ctac** (`REL-002`, software + rollout), **Pan Oston**
(`REL-001`, physical integrator), **TCS** (`REL-007`, Optumera + pricing-transformation
service), **RIFF** (`REL-020`, BPO customer-contact operations, since 2016), **Wuunder**
(`REL-021`, private-confirmed carrier connectivity), **Planon**, **Daikin**, **Staffly**,
**RetailSonar**. Full role/status/directness table in `docs/service-provider-audit.md`.

### 6. Genuinely unknown / TO FIND

All 17 `VEN-UNKNOWN` components listed under class 2 above, plus every provider-shaped gap this
patch newly registers (Mendix implementation/CoE partner, STEP/Stibo implementation partner, SAP
offshore MSP, cloud/infrastructure operations partner, ServiceNow implementation/run partner,
contact-centre platform/telephony behind RIFF, and the others listed in
`docs/service-provider-audit.md` §4) — none of these get an invented name; every one stays a
named `TO FIND` research question.

## What this audit does not cover

`fullResearchCatalogue.stakeholders`, `ownership_links`, and `cgi_relationships` are deliberately
outside the scope of a *content-completeness* audit — they're personal/relationship data governed
by `CLAUDE.md`'s privacy guardrails and Phase 4/5's masking and RLS work, not architecture
content. Section 8 of the patch (stakeholder links) is handled separately in the changelog.
