import type { ViewEdgeType } from '@/types/architecture';

export interface EdgeStyle {
  readonly stroke: string;
  readonly strokeWidth: number;
  readonly dashArray?: string;
  readonly markerColor: string;
}

const BASE: EdgeStyle = { stroke: '#54544e', strokeWidth: 1.4, markerColor: '#54544e' };

export const EDGE_STYLES: Readonly<Record<ViewEdgeType, EdgeStyle>> = {
  'business-flow': BASE,
  integration: BASE,
  'data-flow': { stroke: '#5b7a9c', strokeWidth: 1.25, markerColor: '#5b7a9c' },
  'physical-integration': { stroke: '#54544e', strokeWidth: 1.4, dashArray: '1 3', markerColor: '#54544e' },
  migration: { stroke: '#d97a1f', strokeWidth: 1.4, dashArray: '6 4', markerColor: '#d97a1f' },
  'migration-and-integration': { stroke: '#d97a1f', strokeWidth: 1.4, dashArray: '6 4', markerColor: '#d97a1f' },
  'probable-integration': { stroke: '#b8860b', strokeWidth: 1.25, dashArray: '4 3', markerColor: '#b8860b' },
  'missing-link': { stroke: '#d84a4a', strokeWidth: 1.4, dashArray: '5 4', markerColor: '#d84a4a' },
};
