# Service-provider audit

Companion to `docs/content-completeness-audit.md`. Full inventory of every provider/vendor with a
real commercial relationship (`fullResearchCatalogue.commercial_relationships`, 24 records before
this patch), plus the two providers this patch adds (Mendix, STEP/Stibo) and the candidate/
affiliation-only vendor stubs that exist but carry no relationship record.

## Role taxonomy used below

Matches the patch's §5.1 list: `SOFTWARE_PLATFORM_VENDOR`, `IMPLEMENTATION_PARTNER`,
`MANAGED_SERVICE_PROVIDER`, `ROLLOUT_INTEGRATOR`, `PHYSICAL_SYSTEMS_INTEGRATOR`,
`BPO_OR_CUSTOMER_OPERATIONS_PROVIDER`, `CONTENT_DATA_AI_SPECIALIST`,
`REGIONAL_RECRUITMENT_SPECIALIST`, `CLOUD_MIGRATION_PARTNER`,
`LOGISTICS_CONNECTIVITY_PROVIDER`, `FACILITY_OT_PROVIDER`, `CANDIDATE_AFFILIATION`,
`UNKNOWN_PROVIDER`. A vendor may carry more than one role across separate relationship records —
none does today, since every existing `commercial_relationships` record models exactly one role.

## Full provider table

| Provider | Role | Supported platform/capability | Relationship status | Since | Geography | Directness | Evidence status | Currentness | Open questions | Systems supported | View placement |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Pan Oston (REL-001) | `PHYSICAL_SYSTEMS_INTEGRATOR` | Checkout-zone hardware integration | Current | 2005 | Europe | Direct supplier | Confirmed vendor case | Current | Full partner BOM; programme owner; target POS/SCO role | CMP-PAN-OSTON, CMP-PAN-OSTON-CWA | Total Architecture, Store & Checkout, Providers & Partners |
| Ctac (REL-002) | `SOFTWARE_PLATFORM_VENDOR` + `ROLLOUT_INTEGRATOR` | XV Unified Commerce (POS/SCO/mPOS/API/loyalty) | Current but transitioning | 2005 | 10+ EU countries | Direct supplier | Confirmed vendor case | Current, transitioning | Target POS supplier; remaining XV scope; contract term | CMP-CTAC-XV + 5 XV modules | Total Architecture, Store & Checkout, Providers & Partners |
| SAP (REL-003) | `SOFTWARE_PLATFORM_VENDOR` | S/4HANA, CAR, EWM, TM, Ariba, Business Network, SuccessFactors, ECP, BW, Datasphere, SAC, BusinessObjects | Current | 2026 (start unknown) | International | Direct supplier | Confirmed first-party | Current | Historic start date; implementation partners; offshore MSP | 12 components | Total Architecture, ERP & Supply, Data & Intelligence, People & Service |
| Microsoft (REL-004) | `SOFTWARE_PLATFORM_VENDOR` | Azure, Power BI, M365/Exchange | Current | 2017 | International | Direct supplier | Confirmed first-party | Current | M365/security license scope; tenant structure; current MSP | CMP-AZURE, CMP-POWER-BI, CMP-M365 | Total Architecture, Data & Intelligence, Foundation |
| **Capgemini (REL-005)** | `CLOUD_MIGRATION_PARTNER` | 2017 Azure migration | Historical project, current scope unknown | 2017 | International | Implementation partner | Confirmed vendor case | Historical | Current delivery/MSP/advisory role? | CMP-CAPGEMINI-AZURE | Foundation (historical ref), Providers & Partners |
| SymphonyAI (REL-006) | `SOFTWARE_PLATFORM_VENDOR` | GOLD forecasting/replenishment/allocation/promotion/supplier-collab/warehouse-replenish | Current | 2022 | International | Direct supplier | Confirmed first-party | Current | Original start date; support partner; tactical planning role | 7 GOLD modules | Total Architecture, ERP & Supply |
| Tata Consultancy Services (REL-007) | `SOFTWARE_PLATFORM_VENDOR` (product: Optumera) | Pricing & space optimization | Likely current | 2022 | Intl., countries unknown | Direct supplier | Confirmed vendor case | Likely current | Current contract; countries; owner | CMP-TCS-OPTUMERA | ERP & Supply, Providers & Partners |
| RetailSonar (REL-008) | `CONTENT_DATA_AI_SPECIALIST` | Location intelligence | Likely current | 2019 | Europe | Direct supplier | Confirmed vendor case | Likely current | Current term; users; interfaces | CMP-RETAILSONAR | Providers & Partners (not yet on a canvas — see changelog) |
| Adyen (REL-009) | `SOFTWARE_PLATFORM_VENDOR` | Payment authorization & tender | Current | 2026 (start unknown) | Stores + webshop | Direct supplier | Confirmed first-party | Current | Start date; terminal supplier; acquiring countries | CMP-ADYEN | Total Architecture, Store & Checkout |
| UKG (REL-010) | `SOFTWARE_PLATFORM_VENDOR` | Pro Workforce Management (target) | Transition | 2026 | International | Direct supplier | Confirmed first-party | Transition | Rollout status; country waves; support partner | CMP-UKG-PRO-WFM | Total Architecture, People & Service |
| Kronos (REL-011) | `SOFTWARE_PLATFORM_VENDOR` | Workforce Central (legacy) | Legacy, in transition | 2026 | International | Direct supplier | Confirmed first-party | Legacy transition | — | CMP-K-RONOS-WFC | Total Architecture, People & Service |
| ServiceNow (REL-012) | `SOFTWARE_PLATFORM_VENDOR` | ITSM, CSM, CMDB | Current | 2026 (start unknown) | International | Direct supplier | Confirmed first-party | Current | Module breadth; owner model; CMDB completeness | 4 components | Total Architecture, People & Service |
| Contentstack (REL-013) | `SOFTWARE_PLATFORM_VENDOR` | Headless CMS | Technically deployed | 2026 | Web estate | Direct contract unproven | Confirmed first-party | Current | Direct contract; implementation partner; content scope | CMP-CONTENTSTACK | Total Architecture, Digital Experience |
| Algolia (REL-014) | `SOFTWARE_PLATFORM_VENDOR` | Product search | Current | 2026 | App confirmed | Direct contract unproven | Confirmed first-party | Current | Web scope; contract owner | CMP-ALGOLIA | Total Architecture, Digital Experience |
| Google (REL-015) | `SOFTWARE_PLATFORM_VENDOR` | Firebase, BigQuery, Looker Studio, Ads | Current, multi-product | 2026 | Digital channels | Mixed direct/platform | Confirmed first-party | Current | — | 6 components | Total Architecture, Data & Intelligence |
| Databricks (REL-016) | `SOFTWARE_PLATFORM_VENDOR` | Lakehouse platform | Current | 2026 | International | Direct supplier | Confirmed first-party | Current | — | CMP-DATABRICKS | Total Architecture, Data & Intelligence |
| NEXT AI (REL-017) | `CONTENT_DATA_AI_SPECIALIST` | Customer feedback/insight platform | Likely current | 2026 | Intl., countries unknown | Direct supplier | Confirmed vendor case | Likely current | — | CMP-NEXT-AI | Total Architecture, Data & Intelligence |
| **Squadra (REL-018)** | `CONTENT_DATA_AI_SPECIALIST` (implementation/SaaS unknown) | PowerText.ai product content | Project confirmed, scope unknown | 2026 | Digital channels | Implementation partner | Confirmed vendor case | Current | Implementation vs SaaS model | CMP-POWERTEXT | Digital Experience (upstream product-data group), Providers & Partners |
| Staffly (REL-019) | `REGIONAL_RECRUITMENT_SPECIALIST` | Recruitment assessments | Regional currentness to validate | 2022 | Poland | Direct supplier | Confirmed vendor case | To validate | — | CMP-STAFFLY | Providers & Partners (not yet on a canvas — see changelog) |
| **RIFF (REL-020)** | `BPO_OR_CUSTOMER_OPERATIONS_PROVIDER` | Customer-contact services | Current | 2016 | To validate | Direct supplier | Confirmed vendor case | Current | Tech stack; countries; channels; contract scope | CMP-RIFF | Providers & Partners |
| Wuunder (REL-021) | `LOGISTICS_CONNECTIVITY_PROVIDER` | Shipping/carrier connectivity | Likely current | 2026 | Unknown | Private confirmed | Private confirmation | Likely current | Countries; modules; volumes; carriers | CMP-WUUNDER | Total Architecture, ERP & Supply |
| Planon (REL-022) | `FACILITY_OT_PROVIDER` | Facilities / real estate | Likely current | 2026 | Unknown | Direct supplier | Confirmed first-party | Likely current | — | CMP-PLANON | Providers & Partners (not yet on a canvas — see changelog) |
| Anaplan (REL-023) | `SOFTWARE_PLATFORM_VENDOR` | Commercial planning (being replaced) | Transition | 2026 | Unknown | Direct supplier | Confirmed first-party | Transition | Target vendor; retained scope; migration timeline | CMP-ANAPLAN | Total Architecture, ERP & Supply |
| Daikin (REL-024) | `FACILITY_OT_PROVIDER` | HVAC and store facility tech | Current | 2026 | Europe, to validate | Direct supplier | Confirmed vendor case | Current | — | CMP-DAIKIN-HVAC | Providers & Partners (not yet on a canvas — see changelog) |
| **Mendix (new, this patch)** | `SOFTWARE_PLATFORM_VENDOR` | Low-code application platform | Confirmed multi-source | 2023 (known since) | Unknown | Unknown | Confirmed multi-source | Current | App portfolio; hosting/tenant model; implementation/CoE partner | CMP-MENDIX | Total Architecture (satellite), ERP & Supply, Digital Experience, Providers & Partners |
| **STEP MDM / Stibo Systems (new, this patch)** | `SOFTWARE_PLATFORM_VENDOR` | Master Data Management | Confirmed (job signal); vendor attribution is product-identity inference | ≥2026 (job posting date) | Unknown | Unknown | Confirmed first-party job signal (Action use); strong product-identity inference (Stibo attribution) | Investigate | Authoritative product master vs PIM; onboarding workflow; syndication targets | CMP-STEP-MDM | Total Architecture (replaces generic PIM/MDM gap), ERP & Supply, Digital Experience, Providers & Partners |

## Candidate/affiliation-only stubs (no commercial relationship record)

| Provider | Role | Note |
|---|---|---|
| 4POS (`VEN-4POS`) | `CANDIDATE_AFFILIATION` | Vendor stub exists (category "POS hardware", website only) but **no component and no commercial_relationship reference it** — an unused placeholder today. Per the patch, kept as an affiliated/candidate lead related to Pan Oston only, Action deployment unconfirmed; never connected into the live architecture as a confirmed component. |
| Elo Touch Solutions (`VEN-ELO`) | `UNKNOWN_PROVIDER` (hardware observation) | Has a component (`CMP-ELO-TOUCH`, `TECHNICALLY_OBSERVED`) but no `commercial_relationships` record — deployed hardware observation, commercial route unknown, exactly as the patch describes. |

## Provider TO FIND gaps

Two existing `research_gaps` are already provider-shaped rather than platform-shaped:
**GAP-010** (store field-service partner) and **GAP-058** (current managed-service partners).
This patch adds the remaining provider gaps named in its §5.3 as new `research_gaps` /
`research_tasks` records (external digital development partners for Marketing & Format
Technology, Mendix implementation/CoE partner, STEP/Stibo implementation partner, SAP offshore
MSP, current cloud/infrastructure operations partner, ServiceNow implementation/run partner,
contact-centre platform/telephony behind RIFF) — see `docs/content-provider-patch-changelog.md`
for the exact new gap IDs and `docs/PHASE5_REVIEW_REPORT.md`-style discipline: no fabricated
partner names, every one stays a named `TO FIND` question.

## Governance rules this audit and the resulting patch keep

- A technical observation is never converted into a direct supplier contract (ruled out above by
  keeping `evidence_status` distinct and never inferring a `commercial_relationships` record from
  an observation alone).
- A platform vendor (Mendix, STEP/Stibo, SAP, Microsoft, ServiceNow) is never presented as its own
  implementation or managed-service provider unless a separate relationship record evidences that
  role — none currently do, and this patch does not invent one for Mendix or STEP MDM.
- An implementation partner (Capgemini, Squadra) is never presented as a system of record.
- No unknown external partner (dev shops, MSPs, integrators, carriers, security providers) is
  given a fabricated name anywhere in this table or the gaps it feeds.
