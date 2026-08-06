import { rawBundle } from './rawBundle';
import type { CatalogueRecordSummary } from '@/types/architecture';

/**
 * Resolves a single catalogRefs id to a read-only summary for the detail drawer.
 * This is the only place the canonical research catalogue is read — it is looked up
 * by id on demand, never iterated to produce visible architecture cards.
 */
function buildIndex(): ReadonlyMap<string, CatalogueRecordSummary> {
  const index = new Map<string, CatalogueRecordSummary>();

  for (const system of rawBundle.coreSystemCatalogue.systems) {
    index.set(system.component_id, {
      id: system.component_id,
      displayName: system.display_name,
      vendorName: system.vendor_name,
      productName: system.product_name,
      source: 'core',
    });
  }

  for (const component of rawBundle.fullResearchCatalogue.components) {
    if (index.has(component.component_id)) continue;
    index.set(component.component_id, {
      id: component.component_id,
      displayName: component.display_name ?? component.component_id,
      vendorName: component.vendor_name,
      productName: component.product_name,
      source: 'full',
    });
  }

  return index;
}

const catalogueIndex = buildIndex();

export function resolveCatalogueRef(id: string): CatalogueRecordSummary | undefined {
  return catalogueIndex.get(id);
}

export function resolveCatalogueRefs(ids: readonly string[]): CatalogueRecordSummary[] {
  return ids.map(resolveCatalogueRef).filter((r): r is CatalogueRecordSummary => r !== undefined);
}
