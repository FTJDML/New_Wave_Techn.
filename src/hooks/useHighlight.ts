import { useMemo, useState } from 'react';
import type { ArchitectureViewEdge } from '@/types/architecture';
import { buildNeighbourGraph } from '@/lib/neighbors';

export interface HighlightState {
  readonly activeNodeId: string | null;
  readonly setActiveNodeId: (id: string | null) => void;
  readonly isNodeDimmed: (nodeId: string) => boolean;
  readonly isNodeEmphasised: (nodeId: string) => boolean;
  readonly isEdgeDimmed: (edgeId: string) => boolean;
  readonly isEdgeEmphasised: (edgeId: string) => boolean;
}

/** First-degree-neighbour hover/focus highlighting, computed once from the given edge list. */
export function useHighlight(edges: readonly ArchitectureViewEdge[]): HighlightState {
  const graph = useMemo(() => buildNeighbourGraph(edges), [edges]);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);

  const relatedNodes = activeNodeId ? graph.neighbourNodes.get(activeNodeId) : undefined;
  const relatedEdges = activeNodeId ? graph.neighbourEdges.get(activeNodeId) : undefined;

  return {
    activeNodeId,
    setActiveNodeId,
    isNodeDimmed: (nodeId) => activeNodeId !== null && nodeId !== activeNodeId && !relatedNodes?.has(nodeId),
    isNodeEmphasised: (nodeId) => activeNodeId !== null && (nodeId === activeNodeId || (relatedNodes?.has(nodeId) ?? false)),
    isEdgeDimmed: (edgeId) => activeNodeId !== null && !relatedEdges?.has(edgeId),
    isEdgeEmphasised: (edgeId) => activeNodeId !== null && (relatedEdges?.has(edgeId) ?? false),
  };
}
