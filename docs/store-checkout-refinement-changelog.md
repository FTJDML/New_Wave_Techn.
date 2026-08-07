# Store & Checkout refinement — changelog and deliverables

Implements the "Action IT Landscape — Store Unified Commerce & Checkout Hardware refinement"
brief against the existing Action Architecture Workbench on `claude/new-session-t1nhhu`. Scope was
restricted to the two named domains — **Store Unified Commerce (core & integration)** and
**Checkout Hardware & Operations** — inside the existing `storeCheckoutView`
(`src/data/deepDiveViews.ts`). No new application, route, data model, or layout engine was
introduced; the existing canvas renderer, drawer, zoom, filters, and evidence pipeline are
untouched apart from the additions described below.

## 1. Status taxonomy

The brief's evidence taxonomy (current confirmed / historically confirmed / visually confirmed /
capability confirmed — vendor unknown / transition / suspected / TO FIND P0 / TO FIND P1) already
existed almost entirely in `DeploymentStatus` and the TO-FIND/priority gap system. Two genuinely new
concepts had no existing label and were added as new enum values, both reusing the existing amber
"observed" color so they read as a family with `technically_observed`, not as a new visual language:

- `visually_confirmed` — evidence is a photo/case-study image, not a contract or vendor statement.
- `capability_confirmed` — a capability (e.g. "SCO has video-based intervention") is confirmed by
  Action's own materials, but the vendor supplying it is not.

Added to `STATUS_META` (canvas badges), `DEPLOYMENT_COLORS` (catalogue-level badges), and the
`AppHeader` legend, so the same finding renders identically on the canvas, in the drawer, and in
the catalogue tables.

## 2. Node-by-node changes in `storeCheckoutView`

| Node | Change | Status |
|---|---|---|
| `sc-target-pos` | Renamed "Target POS / SCO platform" → "Target cash-register software / SCO Gen 2". Vendor-neutral — no `vendorId`, no catalogue vendor assignment. | TO FIND P0 (gap card; `transition` carried on the underlying status field, surfaced only in the drawer/catalogue since `GapNode` never renders a status badge) |
| `sc-zebra-scanning` (**new**) | Replaces the old generic scanner TO-FIND stub as the *confirmed* checkout-scanning node: Zebra MP7000-S-ACT + DS4308. | `historical` (never `current`) |
| `sc-checkpoint-eas` (**new**) | Separate EAS-integration node. Explicitly scoped to the antenna/tag integration only — not claimed as the store's exclusive or complete EAS/CCTV/loss-prevention provider. | `capability_confirmed` |
| `sc-gap-pos-printer` | Kept as TO FIND, subtitle now explicitly excludes the Zebra ZT230/ZD410 shelf/label printers so a future researcher doesn't misattribute them. | TO FIND P0 |
| `sc-gap-pos-scale` | Renamed "Checkout scale / SCO weighing" → "SCO bagging-area weight verification / external scale". | TO FIND P1 |
| `sc-adyen` | Unchanged status (`current`) — kept as confirmed payment platform. | current |
| `sc-gap-payment-terminal` | Renamed → "Payment terminal OEM, models & estate management"; subtitle and edge label make clear Adyen is not assumed to manufacture or manage the physical terminals. | TO FIND P0 |
| `sc-gap-pos-pc` | Kept as TO FIND, subtitle now explicitly scoped to "lane only — see SCO vision edge" so it can never be conflated with the new SCO camera-processing node. | TO FIND P0 |
| `sc-sco-video-analytics` (**new**) | SCO video analytics & product-recognition capability, sourced from Action's own self-checkout privacy statement. No `vendorId` — capability is confirmed, the vendor is not. | `capability_confirmed` |
| `sc-gap-sco-vision-edge` (**new**) | Separate TO-FIND for the local processing/edge-appliance hardware behind the SCO vision capability — kept distinct from `sc-gap-pos-pc` per the brief's explicit guardrail. | TO FIND P0 |
| `sc-gap-cctv-vms` | Old combined "CCTV / fraud / loss-prevention platform" node split three ways (see below); this node is now scoped to general store CCTV/VMS only, explicitly excluding SCO recognition and EAS. | TO FIND P1 |
| `sc-pan-oston` | Subtitle expanded to name its actual capabilities (checkout-zone design, CWA, staging, logistics, installation, SCO Gen 2 rollout) while keeping it a `hub`-kind integrator node — no edge or fact implies it is the OEM, software owner, or commercial supplier of anything it physically touches. | `current` |
| `sc-centric` (**new**) | Historical store-IT-rollout / Zebra-deployment / device-management partner. | `historical`, subtitle: "current 2026 scope to validate" |
| `sc-gap-itfieldservice` | Renamed "Store field service" → "Current store IT break/fix & swap-stock partner"; priority raised P1 → P0 since this is the open half of the Centric finding. | TO FIND P0 |
| `sc-elo-touch` | Status changed from an implicit "current" reading to `visually_confirmed`; subtitle "model & fleet scope unknown". | `visually_confirmed` |

The old combined CCTV/fraud node is now three separate, non-mergeable concepts: `sc-gap-cctv-vms`
(general store CCTV, TO FIND P1), `sc-sco-video-analytics` (SCO recognition capability, vendor
unknown), and `sc-checkpoint-eas` (EAS only, confirmed component). No edge or label implies any one
of the three covers the others.

## 3. New relationships (edges)

12 relationships required by the brief now have explicit edges, using only the view's existing 6
edge types (`integration`, `probable-integration`, `physical-integration`, `migration`,
`missing-link` — no new `ViewEdgeType` was needed):

`sc-e09`–`sc-e21` connect Ctac↔Zebra, Zebra↔Checkpoint EAS, Checkpoint EAS↔Ctac, Pan Oston↔Zebra,
Pan Oston↔Elo (direction flipped to Pan Oston→Elo, since Pan Oston is the physical integrator, not
the reverse), SCO video analytics→SCO vision edge, SCO video analytics→target POS, Centric→Pan
Oston, and the printer/scale/POS-PC/payment-terminal/IT-field-service gap cards' physical-
integration links into Pan Oston's checkout-zone rollout.

## 4. Legend and drawer

- `AppHeader`'s status legend gained "Visually confirmed" and "Capability confirmed — vendor
  unknown" entries (9 entries total, up from 7), each visually distinct from "Confirmed current"
  and "Legacy / historical".
- `SystemDetailDrawer` now shows a **historical caveat banner** — "Public evidence confirms
  implementation, but not the current 2026 estate or contract scope." — directly under the badge
  row for every component with `deployment_status: HISTORICAL` (covers `CMP-ZEBRA-SCANNING` and
  `CMP-CENTRIC`), plus two new fact rows (**Confidence**, **Last verified**) so every finding
  surfaces evidence status, confidence, source, and last-verified date without a bespoke per-node
  template.

## 5. Assumptions made due to schema differences

1. `visually_confirmed` and `capability_confirmed` are shared enum values used for two genuinely
   different concepts each (Elo's fleet vs. Zebra photographic evidence; SCO video analytics vs. —
   no second capability-confirmed case arose in this domain). Both render identically (same amber),
   which is acceptable per the brief's "reuse existing badge colors" instruction but means the two
   sub-cases are only distinguished by node subtitle/drawer text, not color.
2. `sc-tofind`'s `maxVisibleTopLevelCards` cap (17, view-level override) meant the Store Unified
   Commerce domain's 12 required relationships and 8 P0/P1 gaps all had to fit on cards already
   present or newly added within that cap — no gap was hidden to satisfy the cap; the cap was raised
   instead (see §6).
3. Pan Oston's abstract "checkout hardware estate" role is approximated as direct edges from each
   hardware gap card into `sc-pan-oston` labelled "physical integration — vendor/OEM unknown",
   rather than inventing an intermediate "checkout hardware estate" node the source material never
   named.
4. `GapNode` never renders a `StatusBadge`, so `sc-target-pos`'s dual status (TO FIND P0 /
   TRANSITION) is carried as `status: 'transition'` + `gapPriority: 'P0'` — both fields are present
   and correct, but "TRANSITION" itself is only visible in the drawer/catalogue, not as a second
   canvas badge next to "TO FIND P0". This matches the existing `GapNode` component's behavior for
   every other gap card in the app and was not special-cased.
5. The old `CMP-POS-SCANNER` placeholder catalogue component was left completely untouched (per the
   established resolved-gap pattern from the prior session's `GAP-020`); `GAP-004` was updated with
   `resolution_summary` and `resolved_component_id: 'CMP-ZEBRA-SCANNING'` and `gap_status:
   'RESOLVED'` rather than deleting or mutating the old placeholder record.

## 6. Layout changes

- Canvas height 760 → 940, `initialScale` 0.85 → 0.75 (more content, same fit-to-view UX).
- `sc-core` group height 290 → 480 to fit a second row of satellite nodes (Zebra, Checkpoint EAS,
  Centric, SCO video analytics).
- `rules.maxVisibleTopLevelCards` overridden 12 → 17 for this view only (mirrors the pattern already
  used by `digitalCommerceView`'s own override), since the count includes every node, gap or not.
- Zero new logo/wordmark entries were left unregistered: `VEN-ZEBRA`, `VEN-CHECKPOINT`, and
  `VEN-CENTRIC` were added to `DEEP_DIVE_LOGO_ADDITIONS` as typographic wordmarks (none has a
  simple-icons mark).

## 7. Remaining P0/P1 gaps (unchanged in count, several renamed/rescoped — see §2)

**P0** — target cash-register software / SCO Gen 2 vendor; POS lane computer/controller; receipt
printer (not the Zebra shelf-label printers); payment terminal OEM, models & estate management; SCO
vision technology vendor; SCO vision edge appliance / local processing server; current store IT
break/fix & swap-stock partner (raised from P1); scanner-replacement standard (folded into the
target-POS/SCO Gen 2 gap, since the brief's own MP72-family note ties scanner succession to the
Gen 2 programme rather than treating it as independent).

**P1** — SCO bagging-area weight verification / external scale; general store CCTV / VMS (not SCO
recognition, not EAS).

None of these are hidden by the resolution of the Zebra-scanning or Elo findings — each remains a
visible gap card with its own priority badge.

## 8. Confirmation — no unsupported vendor assignment

No catalogue, node, or edge in this patch assigns a specific supplier to: the target cash-register
software / SCO Gen 2 platform, the receipt printer, the POS lane computer/controller, the payment
terminal hardware (OEM/models), the SCO bagging-area scale, the general store CCTV/VMS platform, or
the SCO video-analytics/product-recognition platform. Each of these remains either a `vendorId`-less
gap card (`kind: 'gap'`, TO FIND) or a `vendorId`-less `capability_confirmed` satellite node
(`sc-sco-video-analytics`). Enactor, GK, NCR, Toshiba, Diebold Nixdorf, Oracle, Aptos, and any other
POS/SCO-Gen-2 vendor name were not introduced anywhere in this patch.

## 9. Verification

- `npx tsx scripts/validate-layout.ts` — 0 layout failures across all 7 views (was 1 mid-patch:
  a genuine `sc-e14`/`sc-e16` edge crossing, fixed by rerouting `sc-e14` through the clear
  `sap-car`↔`target-pos` gap corridor rather than through the congested lane `sc-e16` needed).
- `npx tsc -b --noEmit` — clean.
- `npx eslint .` — 0 errors (1 pre-existing, unrelated `react-refresh` warning in `AuthContext.tsx`).
- `npx vitest run` — 184/184 passed.
- `npx playwright test --project=desktop-1440 --project=desktop-1920` — 208/208 passed, including
  the Store & Checkout golden screenshot, 11px text-floor, no-scrollbar, vendor-logo, and
  detail-drawer checks.
- Screenshot: `docs/screenshots/store-checkout-desktop-1920.png` (refreshed by this patch's test
  run).
