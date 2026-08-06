// Per-view completeness counter (content-provider patch §9.10): "18 shown · 43 known in
// domain · 9 TO FIND" — makes explicit that a curated canvas is never the full catalogue.
import { components, researchGaps } from '@/data/fullCatalogue';
import type { ArchitectureView } from '@/types/architecture';

export interface ViewSummary {
  readonly shown: number;
  readonly knownInDomain: number;
  readonly toFind: number;
}

/**
 * Domain(s) each hand-curated view draws from, derived from the actual domain_id of every
 * component the view's nodes cite (see docs/content-completeness-audit.md). Total
 * Architecture spans every domain except DOM-PARTNERS, which has its own Providers &
 * Partners page and counter.
 */
const VIEW_DOMAIN_IDS: Readonly<Record<string, readonly string[]>> = {
  'total-architecture': [
    'DOM-COMMERCE',
    'DOM-STORE',
    'DOM-DIGITAL',
    'DOM-PAYMENTS',
    'DOM-MARTECH',
    'DOM-MERCH',
    'DOM-ERP',
    'DOM-SUPPLY',
    'DOM-DATA',
    'DOM-PEOPLE',
    'DOM-INTEGRATION',
    'DOM-CLOUD',
    'DOM-FACILITY',
  ],
  'store-checkout': ['DOM-STORE'],
  'digital-commerce': ['DOM-DIGITAL'],
  'erp-supply': ['DOM-ERP', 'DOM-SUPPLY', 'DOM-MERCH'],
  'data-intelligence': ['DOM-DATA'],
  'people-service': ['DOM-PEOPLE'],
  'foundation-security': ['DOM-CLOUD', 'DOM-INTEGRATION'],
};

export function buildViewSummary(view: ArchitectureView): ViewSummary {
  const domainIds = VIEW_DOMAIN_IDS[view.id] ?? [];
  const shown = view.nodes.filter((n) => n.kind !== 'gap').length;
  if (domainIds.length === 0) {
    return { shown, knownInDomain: shown, toFind: 0 };
  }
  const knownInDomain = components.filter((c) => domainIds.includes(c.domain_id)).length;
  const toFind = researchGaps.filter((g) => domainIds.includes(g.domain_id)).length;
  return { shown, knownInDomain, toFind };
}

export function formatViewSummary(summary: ViewSummary): string {
  return `${summary.shown} shown · ${summary.knownInDomain} known in domain · ${summary.toFind} TO FIND`;
}
