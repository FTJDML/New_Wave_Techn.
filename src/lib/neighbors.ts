import type { ArchitectureViewEdge } from '@/types/architecture';

/** Maps a node id to the set of node ids reachable by exactly one edge, and the edge ids involved. */
export interface NeighbourGraph {
  readonly neighbourNodes: ReadonlyMap<string, ReadonlySet<string>>;
  readonly neighbourEdges: ReadonlyMap<string, ReadonlySet<string>>;
}

export function buildNeighbourGraph(edges: readonly ArchitectureViewEdge[]): NeighbourGraph {
  const neighbourNodes = new Map<string, Set<string>>();
  const neighbourEdges = new Map<string, Set<string>>();

  const addNode = (a: string, b: string) => {
    if (!neighbourNodes.has(a)) neighbourNodes.set(a, new Set());
    neighbourNodes.get(a)!.add(b);
  };
  const addEdge = (nodeId: string, edgeId: string) => {
    if (!neighbourEdges.has(nodeId)) neighbourEdges.set(nodeId, new Set());
    neighbourEdges.get(nodeId)!.add(edgeId);
  };

  for (const edge of edges) {
    addNode(edge.source, edge.target);
    addNode(edge.target, edge.source);
    addEdge(edge.source, edge.id);
    addEdge(edge.target, edge.id);
  }

  return { neighbourNodes, neighbourEdges };
}
