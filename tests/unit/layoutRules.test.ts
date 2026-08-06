import { describe, expect, it } from 'vitest';
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
} from '../../scripts/layoutRules';
import { totalArchitectureView, logoRegistry } from '../../src/data/curatedView';
import { rawBundle } from '../../src/data/rawBundle';
import type { ArchitectureGroup, ArchitectureView, ArchitectureViewEdge, ArchitectureViewNode } from '../../src/types/architecture';

function baseGroup(overrides: Partial<ArchitectureGroup> = {}): ArchitectureGroup {
  return { id: 'g1', label: 'GROUP ONE', x: 0, y: 0, w: 400, h: 300, ...overrides };
}

function baseNode(overrides: Partial<ArchitectureViewNode> = {}): ArchitectureViewNode {
  return { id: 'n1', kind: 'core', groupId: 'g1', title: 'Node One', catalogRefs: [], x: 10, y: 10, w: 100, h: 80, ...overrides };
}

function baseEdge(overrides: Partial<ArchitectureViewEdge> = {}): ArchitectureViewEdge {
  return { id: 'e1', source: 'n1', target: 'n2', type: 'integration', points: [[0, 0], [10, 0]], ...overrides };
}

describe('checkUniqueIds', () => {
  it('passes on the real curated view', () => {
    expect(checkUniqueIds(totalArchitectureView)).toEqual([]);
  });

  it('flags a duplicate node id', () => {
    const view: ArchitectureView = {
      ...totalArchitectureView,
      groups: [baseGroup()],
      nodes: [baseNode({ id: 'dup' }), baseNode({ id: 'dup' })],
      edges: [],
    };
    const failures = checkUniqueIds(view);
    expect(failures).toHaveLength(1);
    expect(failures[0].rule).toBe('unique-ids');
  });
});

describe('checkReferences', () => {
  it('passes on the real curated view', () => {
    expect(checkReferences(totalArchitectureView)).toEqual([]);
  });

  it('flags a node with an unknown groupId', () => {
    const view: ArchitectureView = { ...totalArchitectureView, groups: [baseGroup()], nodes: [baseNode({ groupId: 'missing' })], edges: [] };
    const failures = checkReferences(view);
    expect(failures.some((f) => f.rule === 'group-ref')).toBe(true);
  });

  it('flags an edge with an unknown source or target', () => {
    const view: ArchitectureView = {
      ...totalArchitectureView,
      groups: [baseGroup()],
      nodes: [baseNode()],
      edges: [baseEdge({ source: 'n1', target: 'ghost' })],
    };
    const failures = checkReferences(view);
    expect(failures.some((f) => f.rule === 'edge-endpoint')).toBe(true);
  });
});

describe('checkBounds', () => {
  it('passes on the real curated view', () => {
    expect(checkBounds(totalArchitectureView)).toEqual([]);
  });

  it('flags a node positioned outside the canvas', () => {
    const view: ArchitectureView = {
      ...totalArchitectureView,
      groups: [baseGroup()],
      nodes: [baseNode({ x: totalArchitectureView.canvas.width + 50 })],
      edges: [],
    };
    const failures = checkBounds(view);
    expect(failures.some((f) => f.rule === 'canvas-bounds')).toBe(true);
  });

  it('flags an edge waypoint outside the canvas', () => {
    const view: ArchitectureView = {
      ...totalArchitectureView,
      groups: [baseGroup()],
      nodes: [baseNode(), baseNode({ id: 'n2', x: 200 })],
      edges: [baseEdge({ points: [[-10, 0], [10, 0]] })],
    };
    const failures = checkBounds(view);
    expect(failures.some((f) => f.rule === 'canvas-bounds')).toBe(true);
  });
});

describe('checkEdgeGeometryBasics', () => {
  it('passes on the real curated view', () => {
    expect(checkEdgeGeometryBasics(totalArchitectureView.edges)).toEqual([]);
  });

  it('flags a diagonal (non-orthogonal) segment', () => {
    const failures = checkEdgeGeometryBasics([baseEdge({ points: [[0, 0], [10, 10]] })]);
    expect(failures.some((f) => f.rule === 'edge-orthogonal')).toBe(true);
  });

  it('flags duplicate consecutive waypoints', () => {
    const failures = checkEdgeGeometryBasics([baseEdge({ points: [[0, 0], [0, 0], [10, 0]] })]);
    expect(failures.some((f) => f.rule === 'edge-points')).toBe(true);
  });
});

describe('checkLimits', () => {
  it('passes on the real curated view', () => {
    const { nodes, rules } = totalArchitectureView;
    expect(checkLimits(nodes, rules.maxVisibleTopLevelCards, rules.maxVisibleGaps)).toEqual([]);
  });

  it('flags too many visible gap nodes', () => {
    const nodes = Array.from({ length: 9 }, (_, i) => baseNode({ id: `gap-${i}`, kind: 'gap' }));
    const failures = checkLimits(nodes, 30, 8);
    expect(failures.some((f) => f.rule === 'gap-limit')).toBe(true);
  });

  it('flags too many total cards', () => {
    const nodes = Array.from({ length: 5 }, (_, i) => baseNode({ id: `n-${i}` }));
    const failures = checkLimits(nodes, 4, 8);
    expect(failures.some((f) => f.rule === 'card-limit')).toBe(true);
  });
});

describe('checkLogoCoverage', () => {
  it('passes on the real curated view with the real (overridden) logo registry', () => {
    expect(checkLogoCoverage(totalArchitectureView.nodes, logoRegistry)).toEqual([]);
  });

  it('flags a vendorId with no registry entry', () => {
    const failures = checkLogoCoverage([baseNode({ vendorId: 'VEN-UNKNOWN' })], {});
    expect(failures.some((f) => f.rule === 'logo-coverage')).toBe(true);
  });

  it('flags a simple-icons strategy with no slug', () => {
    const failures = checkLogoCoverage([baseNode({ vendorId: 'VEN-X' })], { 'VEN-X': { strategy: 'simple-icons' } });
    expect(failures.some((f) => f.rule === 'logo-coverage')).toBe(true);
  });
});

describe('checkCatalogRefs', () => {
  it('passes on the real curated view against the real catalogue', () => {
    const knownIds = new Set<string>();
    for (const system of rawBundle.coreSystemCatalogue.systems) knownIds.add(system.component_id);
    for (const component of rawBundle.fullResearchCatalogue.components) knownIds.add(component.component_id);
    expect(checkCatalogRefs(totalArchitectureView.nodes, knownIds)).toEqual([]);
  });

  it('flags a catalogRef that does not resolve', () => {
    const failures = checkCatalogRefs([baseNode({ catalogRefs: ['CMP-DOES-NOT-EXIST'] })], new Set());
    expect(failures.some((f) => f.rule === 'catalog-ref')).toBe(true);
  });
});

describe('checkNodeOverlap', () => {
  it('passes on the real curated view', () => {
    expect(checkNodeOverlap(totalArchitectureView.nodes)).toEqual([]);
  });

  it('flags two overlapping nodes', () => {
    const failures = checkNodeOverlap([baseNode({ id: 'a', x: 0, y: 0, w: 100, h: 100 }), baseNode({ id: 'b', x: 50, y: 50, w: 100, h: 100 })]);
    expect(failures.some((f) => f.rule === 'node-overlap')).toBe(true);
  });
});

describe('checkGroupOverlap', () => {
  it('passes on the real curated view', () => {
    expect(checkGroupOverlap(totalArchitectureView.groups)).toEqual([]);
  });

  it('flags two overlapping groups', () => {
    const failures = checkGroupOverlap([baseGroup({ id: 'a', x: 0, y: 0, w: 200, h: 200 }), baseGroup({ id: 'b', x: 100, y: 100, w: 200, h: 200 })]);
    expect(failures.some((f) => f.rule === 'group-overlap')).toBe(true);
  });
});

describe('checkNodeInGroup', () => {
  it('passes on the real curated view', () => {
    expect(checkNodeInGroup(totalArchitectureView.nodes, totalArchitectureView.groups)).toEqual([]);
  });

  it('flags a node that spills outside its group', () => {
    const groups = [baseGroup({ w: 100, h: 100 })];
    const nodes = [baseNode({ x: 80, y: 80, w: 50, h: 50 })];
    const failures = checkNodeInGroup(nodes, groups);
    expect(failures.some((f) => f.rule === 'node-in-group')).toBe(true);
  });
});

describe('checkLabelIntersection', () => {
  it('passes on the real (corrected) curated view', () => {
    expect(checkLabelIntersection(totalArchitectureView.edges, totalArchitectureView.groups)).toEqual([]);
  });

  it('flags an edge routed straight through a group label', () => {
    const groups = [baseGroup({ x: 0, y: 0, w: 400, h: 300, label: 'A REASONABLY LONG GROUP LABEL' })];
    const edges = [baseEdge({ points: [[100, -20], [100, 50]] })];
    const failures = checkLabelIntersection(edges, groups);
    expect(failures.some((f) => f.rule === 'edge-label-intersection')).toBe(true);
  });
});

describe('checkEdgeNodeIntersection', () => {
  it('passes on the real curated view', () => {
    expect(checkEdgeNodeIntersection(totalArchitectureView.edges, totalArchitectureView.nodes)).toEqual([]);
  });

  it('flags an edge that cuts through an unrelated node', () => {
    const nodes = [baseNode({ id: 'n1', x: 0, y: 0, w: 20, h: 20 }), baseNode({ id: 'n2', x: 500, y: 500, w: 20, h: 20 }), baseNode({ id: 'blocker', x: 40, y: -5, w: 20, h: 20 })];
    const edges = [baseEdge({ source: 'n1', target: 'n2', points: [[50, -20], [50, 20]] })];
    const failures = checkEdgeNodeIntersection(edges, nodes);
    expect(failures.some((f) => f.rule === 'edge-node-intersection')).toBe(true);
  });
});

describe('checkEdgeCrossings', () => {
  it('passes on the real curated view', () => {
    expect(checkEdgeCrossings(totalArchitectureView.edges)).toEqual([]);
  });

  it('flags two unrelated edges that cross', () => {
    const edges = [
      baseEdge({ id: 'e1', source: 'a', target: 'b', points: [[0, 0], [100, 0]] }),
      baseEdge({ id: 'e2', source: 'c', target: 'd', points: [[50, -50], [50, 50]] }),
    ];
    const failures = checkEdgeCrossings(edges);
    expect(failures.some((f) => f.rule === 'edge-crossing')).toBe(true);
  });

  it('does not flag a crossing explicitly whitelisted', () => {
    const edges = [
      baseEdge({ id: 'e1', source: 'a', target: 'b', points: [[0, 0], [100, 0]] }),
      baseEdge({ id: 'e2', source: 'c', target: 'd', points: [[50, -50], [50, 50]] }),
    ];
    const failures = checkEdgeCrossings(edges, new Set(['e1|e2']));
    expect(failures).toEqual([]);
  });

  it('does not flag edges that share an endpoint', () => {
    const edges = [
      baseEdge({ id: 'e1', source: 'shared', target: 'b', points: [[0, 0], [100, 0]] }),
      baseEdge({ id: 'e2', source: 'shared', target: 'd', points: [[50, -50], [50, 50]] }),
    ];
    expect(checkEdgeCrossings(edges)).toEqual([]);
  });
});
