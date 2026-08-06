/**
 * Pure layout-validation rules, implementing scripts/VALIDATION_REQUIREMENTS.md.
 * Each rule takes explicit data (never module-level state) so it can be exercised against
 * both the real curated view and deliberately-broken fixtures in tests/unit.
 */
import type { ArchitectureGroup, ArchitectureViewEdge, ArchitectureViewNode, ArchitectureView } from '../src/types/architecture';

export type Point = readonly [number, number];
export type Rect = { readonly x1: number; readonly y1: number; readonly x2: number; readonly y2: number };

export interface Failure {
  readonly rule: string;
  readonly message: string;
}

export interface CatalogueLookup {
  has(id: string): boolean;
}

export interface LogoRegistryLike {
  readonly [vendorId: string]: { readonly strategy: string; readonly slug?: string; readonly text?: string } | undefined;
}

function toRect(box: { x: number; y: number; w: number; h: number }): Rect {
  return { x1: box.x, y1: box.y, x2: box.x + box.w, y2: box.y + box.h };
}

function rectsOverlap(a: Rect, b: Rect): boolean {
  return !(a.x2 <= b.x1 || b.x2 <= a.x1 || a.y2 <= b.y1 || b.y2 <= a.y1);
}

function rectContains(outer: Rect, inner: Rect): boolean {
  return inner.x1 >= outer.x1 && inner.y1 >= outer.y1 && inner.x2 <= outer.x2 && inner.y2 <= outer.y2;
}

export function checkUniqueIds(view: ArchitectureView): Failure[] {
  const failures: Failure[] = [];
  const check = (label: string, ids: readonly string[]) => {
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) failures.push({ rule: 'unique-ids', message: `Duplicate ${label} id: ${id}` });
      seen.add(id);
    }
  };
  check('group', view.groups.map((g) => g.id));
  check('node', view.nodes.map((n) => n.id));
  check('edge', view.edges.map((e) => e.id));
  return failures;
}

export function checkReferences(view: ArchitectureView): Failure[] {
  const failures: Failure[] = [];
  const groupIds = new Set(view.groups.map((g) => g.id));
  const nodeIds = new Set(view.nodes.map((n) => n.id));

  for (const node of view.nodes) {
    if (!groupIds.has(node.groupId)) {
      failures.push({ rule: 'group-ref', message: `Node ${node.id} references unknown group ${node.groupId}` });
    }
  }
  for (const edge of view.edges) {
    if (!nodeIds.has(edge.source)) failures.push({ rule: 'edge-endpoint', message: `Edge ${edge.id} source ${edge.source} does not exist` });
    if (!nodeIds.has(edge.target)) failures.push({ rule: 'edge-endpoint', message: `Edge ${edge.id} target ${edge.target} does not exist` });
  }
  return failures;
}

export function checkBounds(view: ArchitectureView): Failure[] {
  const failures: Failure[] = [];
  const canvasRect: Rect = { x1: 0, y1: 0, x2: view.canvas.width, y2: view.canvas.height };

  for (const group of view.groups) {
    if (!rectContains(canvasRect, toRect(group))) {
      failures.push({ rule: 'canvas-bounds', message: `Group ${group.id} is out of canvas bounds` });
    }
  }
  for (const node of view.nodes) {
    if (!rectContains(canvasRect, toRect(node))) {
      failures.push({ rule: 'canvas-bounds', message: `Node ${node.id} is out of canvas bounds` });
    }
  }
  for (const edge of view.edges) {
    for (const [x, y] of edge.points) {
      if (x < 0 || y < 0 || x > view.canvas.width || y > view.canvas.height) {
        failures.push({ rule: 'canvas-bounds', message: `Edge ${edge.id} has a waypoint (${x},${y}) outside the canvas` });
      }
    }
  }
  return failures;
}

export function checkEdgeGeometryBasics(edges: readonly ArchitectureViewEdge[]): Failure[] {
  const failures: Failure[] = [];
  for (const edge of edges) {
    const pts = edge.points;
    if (pts.length < 2) {
      failures.push({ rule: 'edge-points', message: `Edge ${edge.id} has fewer than 2 waypoints` });
      continue;
    }
    for (let i = 0; i < pts.length - 1; i++) {
      const [x1, y1] = pts[i];
      const [x2, y2] = pts[i + 1];
      if (x1 === x2 && y1 === y2) {
        failures.push({ rule: 'edge-points', message: `Edge ${edge.id} has duplicate consecutive waypoints at (${x1},${y1})` });
      }
      if (x1 !== x2 && y1 !== y2) {
        failures.push({ rule: 'edge-orthogonal', message: `Edge ${edge.id} segment ${i} is not axis-aligned: (${x1},${y1})->(${x2},${y2})` });
      }
    }
  }
  return failures;
}

export function checkLimits(nodes: readonly ArchitectureViewNode[], maxCards: number, maxGaps: number): Failure[] {
  const failures: Failure[] = [];
  if (nodes.length > maxCards) {
    failures.push({ rule: 'card-limit', message: `${nodes.length} visible nodes exceeds maxVisibleTopLevelCards (${maxCards})` });
  }
  const gapCount = nodes.filter((n) => n.kind === 'gap').length;
  if (gapCount > maxGaps) {
    failures.push({ rule: 'gap-limit', message: `${gapCount} visible gaps exceeds maxVisibleGaps (${maxGaps})` });
  }
  return failures;
}

export function checkLogoCoverage(nodes: readonly ArchitectureViewNode[], logoRegistry: LogoRegistryLike): Failure[] {
  const failures: Failure[] = [];
  for (const node of nodes) {
    if (!node.vendorId) continue;
    const definition = logoRegistry[node.vendorId];
    if (!definition) {
      failures.push({ rule: 'logo-coverage', message: `Node ${node.id} vendorId ${node.vendorId} has no logoRegistry entry` });
      continue;
    }
    if (definition.strategy === 'simple-icons' && !definition.slug) {
      failures.push({ rule: 'logo-coverage', message: `Node ${node.id} vendorId ${node.vendorId} declares simple-icons with no slug` });
    }
    if (definition.strategy === 'wordmark' && !definition.text) {
      failures.push({ rule: 'logo-coverage', message: `Node ${node.id} vendorId ${node.vendorId} declares wordmark with no text` });
    }
  }
  return failures;
}

export function checkCatalogRefs(nodes: readonly ArchitectureViewNode[], catalogue: CatalogueLookup): Failure[] {
  const failures: Failure[] = [];
  for (const node of nodes) {
    for (const ref of node.catalogRefs) {
      if (!catalogue.has(ref)) {
        failures.push({ rule: 'catalog-ref', message: `Node ${node.id} catalogRef ${ref} does not resolve in the catalogue` });
      }
    }
  }
  return failures;
}

export function checkNodeOverlap(nodes: readonly ArchitectureViewNode[]): Failure[] {
  const failures: Failure[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (rectsOverlap(toRect(nodes[i]), toRect(nodes[j]))) {
        failures.push({ rule: 'node-overlap', message: `Nodes ${nodes[i].id} and ${nodes[j].id} overlap` });
      }
    }
  }
  return failures;
}

export function checkGroupOverlap(groups: readonly ArchitectureGroup[]): Failure[] {
  const failures: Failure[] = [];
  for (let i = 0; i < groups.length; i++) {
    for (let j = i + 1; j < groups.length; j++) {
      if (rectsOverlap(toRect(groups[i]), toRect(groups[j]))) {
        failures.push({ rule: 'group-overlap', message: `Groups ${groups[i].id} and ${groups[j].id} overlap` });
      }
    }
  }
  return failures;
}

export function checkNodeInGroup(nodes: readonly ArchitectureViewNode[], groups: readonly ArchitectureGroup[]): Failure[] {
  const failures: Failure[] = [];
  const groupById = new Map(groups.map((g) => [g.id, g] as const));
  for (const node of nodes) {
    const group = groupById.get(node.groupId);
    if (!group) continue; // reported by checkReferences
    if (!rectContains(toRect(group), toRect(node))) {
      failures.push({ rule: 'node-in-group', message: `Node ${node.id} is not fully contained within group ${node.groupId}` });
    }
  }
  return failures;
}

const LABEL_CHAR_WIDTH_PX = 7.3;
const LABEL_HEIGHT_PX = 22;

export function labelRect(group: ArchitectureGroup): Rect {
  const width = Math.min(group.label.length * LABEL_CHAR_WIDTH_PX + 16, group.w - 24);
  return { x1: group.x + 12, y1: group.y, x2: group.x + 12 + width, y2: group.y + LABEL_HEIGHT_PX };
}

export function segmentIntersectsRect(p1: Point, p2: Point, rect: Rect): boolean {
  const [x1, y1] = p1;
  const [x2, y2] = p2;
  if (x1 === x2) {
    const x = x1;
    const yLo = Math.min(y1, y2);
    const yHi = Math.max(y1, y2);
    return rect.x1 < x && x < rect.x2 && yHi > rect.y1 && yLo < rect.y2;
  }
  if (y1 === y2) {
    const y = y1;
    const xLo = Math.min(x1, x2);
    const xHi = Math.max(x1, x2);
    return rect.y1 < y && y < rect.y2 && xHi > rect.x1 && xLo < rect.x2;
  }
  return false;
}

export function checkLabelIntersection(edges: readonly ArchitectureViewEdge[], groups: readonly ArchitectureGroup[]): Failure[] {
  const failures: Failure[] = [];
  for (const edge of edges) {
    for (let i = 0; i < edge.points.length - 1; i++) {
      const p1 = edge.points[i];
      const p2 = edge.points[i + 1];
      for (const group of groups) {
        if (segmentIntersectsRect(p1, p2, labelRect(group))) {
          failures.push({ rule: 'edge-label-intersection', message: `Edge ${edge.id} segment ${i} crosses the label of group ${group.id}` });
        }
      }
    }
  }
  return failures;
}

export function checkEdgeNodeIntersection(edges: readonly ArchitectureViewEdge[], nodes: readonly ArchitectureViewNode[]): Failure[] {
  const failures: Failure[] = [];
  for (const edge of edges) {
    for (let i = 0; i < edge.points.length - 1; i++) {
      const p1 = edge.points[i];
      const p2 = edge.points[i + 1];
      for (const node of nodes) {
        if (node.id === edge.source || node.id === edge.target) continue;
        if (segmentIntersectsRect(p1, p2, toRect(node))) {
          failures.push({ rule: 'edge-node-intersection', message: `Edge ${edge.id} segment ${i} intersects unrelated node ${node.id}` });
        }
      }
    }
  }
  return failures;
}

export function segmentsCross(a1: Point, a2: Point, b1: Point, b2: Point): boolean {
  const aVert = a1[0] === a2[0];
  const bVert = b1[0] === b2[0];
  if (aVert === bVert) return false;
  const [vx, vy1, vy2] = aVert ? [a1[0], a1[1], a2[1]] : [b1[0], b1[1], b2[1]];
  const [hy, hx1, hx2] = aVert ? [b1[1], b1[0], b2[0]] : [a1[1], a1[0], a2[0]];
  const vLo = Math.min(vy1, vy2);
  const vHi = Math.max(vy1, vy2);
  const hLo = Math.min(hx1, hx2);
  const hHi = Math.max(hx1, hx2);
  return hLo < vx && vx < hHi && vLo < hy && hy < vHi;
}

export function checkEdgeCrossings(
  edges: readonly ArchitectureViewEdge[],
  approvedCrossings: ReadonlySet<string> = new Set(),
): Failure[] {
  const failures: Failure[] = [];
  for (let i = 0; i < edges.length; i++) {
    for (let j = i + 1; j < edges.length; j++) {
      const a = edges[i];
      const b = edges[j];
      const related = a.source === b.source || a.source === b.target || a.target === b.source || a.target === b.target;
      if (related) continue;
      const key = [a.id, b.id].sort().join('|');
      if (approvedCrossings.has(key)) continue;

      for (let ai = 0; ai < a.points.length - 1; ai++) {
        for (let bi = 0; bi < b.points.length - 1; bi++) {
          if (segmentsCross(a.points[ai], a.points[ai + 1], b.points[bi], b.points[bi + 1])) {
            failures.push({ rule: 'edge-crossing', message: `Unrelated edges ${a.id} and ${b.id} cross without an approved whitelist entry` });
          }
        }
      }
    }
  }
  return failures;
}
