#!/usr/bin/env tsx
/**
 * CLI runner for the deterministic layout validator (see scripts/layoutRules.ts).
 * Runs against every curated view the app renders — the Total Architecture (with its
 * documented connector/logo overrides) plus all 6 Phase 3 domain deep dives — so a
 * regression in any hand-curated layout fails the same gate. Exits non-zero on any failure.
 */
import { totalArchitectureView, logoRegistry } from '../src/data/curatedView';
import {
  storeCheckoutView,
  digitalCommerceView,
  erpSupplyView,
  dataIntelligenceView,
  peopleServiceView,
  foundationSecurityView,
} from '../src/data/deepDiveViews';
import { rawBundle } from '../src/data/rawBundle';
import type { ArchitectureView } from '../src/types/architecture';
import {
  checkUniqueIds,
  checkReferences,
  checkBounds,
  checkEdgeGeometryBasics,
  checkLimits,
  checkLogoCoverage,
  checkCatalogRefs,
  checkNodeOverlap,
  checkGroupOverlap,
  checkNodeInGroup,
  checkLabelIntersection,
  checkEdgeNodeIntersection,
  checkEdgeCrossings,
  type Failure,
} from './layoutRules';

// The Providers & Partners page (src/pages/ProvidersPage.tsx) is deliberately NOT an
// ArchitectureView and is not registered here — content-provider patch §5 asks for a
// provider directory, not a system-flow canvas, so it renders as a plain grid/list page with
// no groups/nodes/edges/canvas geometry for this validator to check. Its own correctness is
// covered by tests/unit/providersView.test.ts and tests/e2e/providers.spec.ts instead.
const VIEWS: readonly ArchitectureView[] = [
  totalArchitectureView,
  storeCheckoutView,
  digitalCommerceView,
  erpSupplyView,
  dataIntelligenceView,
  peopleServiceView,
  foundationSecurityView,
];

const catalogueIds = new Set<string>();
for (const system of rawBundle.coreSystemCatalogue.systems) catalogueIds.add(system.component_id);
for (const component of rawBundle.fullResearchCatalogue.components) catalogueIds.add(component.component_id);

let totalFailures = 0;

for (const view of VIEWS) {
  const { canvas, rules, groups, nodes, edges } = view;

  const failures: Failure[] = [
    ...checkUniqueIds(view),
    ...checkReferences(view),
    ...checkBounds(view),
    ...checkEdgeGeometryBasics(edges),
    ...checkLimits(nodes, rules.maxVisibleTopLevelCards, rules.maxVisibleGaps),
    ...checkLogoCoverage(nodes, logoRegistry),
    ...checkCatalogRefs(nodes, catalogueIds),
    ...checkNodeOverlap(nodes),
    ...checkGroupOverlap(groups),
    ...checkNodeInGroup(nodes, groups),
    ...checkLabelIntersection(edges, groups),
    ...checkEdgeNodeIntersection(edges, nodes),
    ...checkEdgeCrossings(edges),
  ];

  console.log(`\n=== ${view.id} ===`);
  console.log(`Validated ${nodes.length} nodes, ${edges.length} edges, ${groups.length} groups (canvas ${canvas.width}x${canvas.height}).`);

  if (failures.length > 0) {
    console.error(`${failures.length} layout validation failure(s):`);
    for (const f of failures) {
      console.error(`  [${f.rule}] ${f.message}`);
    }
    totalFailures += failures.length;
  } else {
    console.log('Layout validation passed with 0 failures.');
  }
}

if (totalFailures > 0) {
  console.error(`\n${totalFailures} total layout validation failure(s) across ${VIEWS.length} views.`);
  process.exitCode = 1;
} else {
  console.log(`\nAll ${VIEWS.length} views passed layout validation with 0 failures.`);
}
