#!/usr/bin/env tsx
/**
 * CLI runner for the deterministic layout validator (see scripts/layoutRules.ts).
 * Runs against the same overridden view the app renders (src/data/curatedView.ts) so the
 * 3 connector-waypoint corrections and 2 logo-strategy overrides documented in
 * docs/IMPLEMENTATION_AUDIT.md are validated as-shipped, not against the raw JSON.
 * Exits non-zero on any failure.
 */
import { totalArchitectureView, logoRegistry } from '../src/data/curatedView';
import { rawBundle } from '../src/data/rawBundle';
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

const view = totalArchitectureView;
const { canvas, rules, groups, nodes, edges } = view;

const catalogueIds = new Set<string>();
for (const system of rawBundle.coreSystemCatalogue.systems) catalogueIds.add(system.component_id);
for (const component of rawBundle.fullResearchCatalogue.components) catalogueIds.add(component.component_id);

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

console.log(`Validated ${nodes.length} nodes, ${edges.length} edges, ${groups.length} groups (canvas ${canvas.width}x${canvas.height}).`);

if (failures.length > 0) {
  console.error(`\n${failures.length} layout validation failure(s):\n`);
  for (const f of failures) {
    console.error(`  [${f.rule}] ${f.message}`);
  }
  process.exitCode = 1;
} else {
  console.log('Layout validation passed with 0 failures.');
}
