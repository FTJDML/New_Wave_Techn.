// Reverse index from a canonical catalogue id to every curated architecture view that
// renders it as a node, so catalogue drawers can link back to the diagram(s) that show a
// given system or TO FIND gap. Built once from the same view objects the canvas renders —
// never a separate hand-maintained list, so it can't drift from the actual curated views.
import { totalArchitectureView } from './curatedView';
import {
  storeCheckoutView,
  digitalCommerceView,
  erpSupplyView,
  dataIntelligenceView,
  peopleServiceView,
  foundationSecurityView,
} from './deepDiveViews';
import type { ArchitectureView } from '@/types/architecture';

export interface ViewAppearance {
  readonly routePath: string;
  readonly viewTitle: string;
  readonly nodeId: string;
}

const VIEWS: ReadonlyArray<{ readonly view: ArchitectureView; readonly routePath: string }> = [
  { view: totalArchitectureView, routePath: '/architecture' },
  { view: storeCheckoutView, routePath: '/architecture/store' },
  { view: digitalCommerceView, routePath: '/architecture/digital' },
  { view: erpSupplyView, routePath: '/architecture/erp-supply' },
  { view: dataIntelligenceView, routePath: '/architecture/data' },
  { view: peopleServiceView, routePath: '/architecture/people-service' },
  { view: foundationSecurityView, routePath: '/architecture/foundation' },
];

function buildIndex(): ReadonlyMap<string, readonly ViewAppearance[]> {
  const index = new Map<string, ViewAppearance[]>();
  for (const { view, routePath } of VIEWS) {
    for (const node of view.nodes) {
      for (const ref of node.catalogRefs) {
        const appearance: ViewAppearance = { routePath, viewTitle: view.title, nodeId: node.id };
        const existing = index.get(ref);
        if (existing) existing.push(appearance);
        else index.set(ref, [appearance]);
      }
    }
  }
  return index;
}

const catalogueRefIndex = buildIndex();

export function getViewAppearances(catalogueId: string): readonly ViewAppearance[] {
  return catalogueRefIndex.get(catalogueId) ?? [];
}
