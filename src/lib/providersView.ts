// Pure view-model builder for the Providers & Partners page (content-provider patch §5).
// Groups known providers into the sections the patch specifies by name, resolves each one's
// commercial_relationships record (role, status, evidence, systems supported), and separately
// lists every provider-shaped TO FIND gap. Never invents a partner name — a provider without a
// commercial_relationships record (4POS, Elo) renders as a bare vendor stub, not a fabricated role.
import { commercialRelationships, getComponent, getVendor, researchGaps } from '@/data/fullCatalogue';
import type { CommercialRelationship, ResearchGap, Vendor } from '@/types/catalogue';
import type { ArchitectureView } from '@/types/architecture';
import { humanize } from '@/lib/formatting';

export interface ProviderCard {
  readonly vendor: Vendor;
  readonly relationship: CommercialRelationship | null;
  readonly systemNames: readonly string[];
}

export interface ProviderSection {
  readonly title: string;
  readonly cards: readonly ProviderCard[];
}

const SECTIONS: ReadonlyArray<{ title: string; vendorIds: readonly string[] }> = [
  { title: 'Store, checkout and rollout', vendorIds: ['VEN-CTAC', 'VEN-PANOSTON', 'VEN-4POS', 'VEN-ELO'] },
  { title: 'Cloud and enterprise delivery', vendorIds: ['VEN-CAPGEMINI', 'VEN-TCS', 'VEN-WWWIFI'] },
  { title: 'Digital, product data and content', vendorIds: ['VEN-MENDIX', 'VEN-STIBO', 'VEN-SQUADRA', 'VEN-NEXTAI', 'VEN-RETAILSONAR'] },
  { title: 'Customer operations', vendorIds: ['VEN-RIFF'] },
  { title: 'Supply chain and logistics', vendorIds: ['VEN-WUUNDER', 'VEN-DAIKIN'] },
  { title: 'People and recruitment', vendorIds: ['VEN-STAFFLY', 'VEN-ERECRUITER'] },
];

function buildCard(vendorId: string): ProviderCard | null {
  const vendor = getVendor(vendorId);
  if (!vendor) return null;
  const relationship = commercialRelationships.find((r) => r.vendor_id === vendorId) ?? null;
  const systemNames = (relationship?.component_ids ?? []).map((id) => getComponent(id)?.display_name ?? id);
  return { vendor, relationship, systemNames };
}

export function buildProviderSections(): readonly ProviderSection[] {
  return SECTIONS.map((section) => ({
    title: section.title,
    cards: section.vendorIds.map(buildCard).filter((c): c is ProviderCard => c !== null),
  }));
}

export function formatProviderRole(relationship: CommercialRelationship | null): string {
  if (!relationship) return 'Candidate affiliation — no relationship record';
  return humanize(relationship.provider_role);
}

export function isProviderGap(gap: ResearchGap): boolean {
  return gap.domain_id === 'DOM-PARTNERS';
}

export function buildProviderToFindGaps(): readonly ResearchGap[] {
  return researchGaps.filter(isProviderGap);
}

/** Provider-overlay cap (patch §6): "show no more than six provider cards in any domain view". */
export const MAX_OVERLAY_PROVIDER_CARDS = 6;

export interface ProviderOverlay {
  readonly cards: readonly ProviderCard[];
  readonly gaps: readonly ResearchGap[];
}

/**
 * Providers whose commercial_relationships record touches a vendor or component that is
 * actually drawn on `view` — the provider overlay never lists a provider unrelated to what's
 * currently visible. Order follows first appearance among the view's nodes.
 */
function relatedProviderCards(view: ArchitectureView): readonly ProviderCard[] {
  const cards: ProviderCard[] = [];
  const seenVendorIds = new Set<string>();

  for (const node of view.nodes) {
    if (!node.vendorId || seenVendorIds.has(node.vendorId)) continue;
    const relationship =
      commercialRelationships.find(
        (r) => r.vendor_id === node.vendorId || node.catalogRefs.some((ref) => r.component_ids.includes(ref)),
      ) ?? null;
    if (!relationship) continue;

    const vendor = getVendor(node.vendorId);
    if (!vendor) continue;

    seenVendorIds.add(node.vendorId);
    const systemNames = relationship.component_ids.map((id) => getComponent(id)?.display_name ?? id);
    cards.push({ vendor, relationship, systemNames });
  }

  return cards;
}

/**
 * TO-FIND provider gaps whose `linked_component_ids` touch a component actually drawn on
 * `view` — e.g. the Mendix CoE-partner gap only appears in views where a Mendix node is
 * visible. Never lists a gap the view has no evidenced connection to.
 */
function relatedProviderGaps(view: ArchitectureView): readonly ResearchGap[] {
  const visibleComponentIds = new Set(view.nodes.flatMap((n) => n.catalogRefs));
  return buildProviderToFindGaps().filter((gap) => gap.linked_component_ids.some((id) => visibleComponentIds.has(id)));
}

/**
 * Provider overlay content for a single domain architecture view (patch §6, "Show delivery
 * partners" toggle): confirmed providers first, then TO-FIND provider stubs filling any
 * remaining slots, capped together at MAX_OVERLAY_PROVIDER_CARDS.
 */
export function buildProviderOverlay(view: ArchitectureView): ProviderOverlay {
  const cards = relatedProviderCards(view).slice(0, MAX_OVERLAY_PROVIDER_CARDS);
  const remaining = MAX_OVERLAY_PROVIDER_CARDS - cards.length;
  const gaps = remaining > 0 ? relatedProviderGaps(view).slice(0, remaining) : [];
  return { cards, gaps };
}
