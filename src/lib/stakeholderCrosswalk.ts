// Cross-reference into the separate "Action Stakeholder Intelligence" app (not part of this
// repo) via src/data/stakeholderTechCrosswalk.json — a hand-curated, hand-verified map from
// that app's technology domains to this app's canvas nodes. The two apps are never merged and
// never share a runtime or a database; this is purely an outbound-link lookup so a reader can
// jump from "this system" to "who owns/influences it" without either app knowing the other's
// internal data model. See docs/PROJECT_HANDOFF.md for the full rationale.
import crosswalkBundle from '@/data/stakeholderTechCrosswalk.json' with { type: 'json' };
import { getViewAppearances } from '@/data/viewIndex';

interface CrosswalkMapping {
  readonly stakeholder_domain_id: string;
  readonly stakeholder_domain_name: string;
  readonly workbench_domain_id: string;
  readonly workbench_capability_ids: readonly string[];
  readonly workbench_view_id: string;
  readonly workbench_node_ids: readonly string[];
  readonly mapping_confidence: 'high' | 'medium' | 'loose';
  readonly notes: string;
}

const mappings = (crosswalkBundle as { readonly mappings: readonly CrosswalkMapping[] }).mappings;

const nodeIdToMappings = (() => {
  const index = new Map<string, CrosswalkMapping[]>();
  for (const mapping of mappings) {
    for (const nodeId of mapping.workbench_node_ids) {
      const existing = index.get(nodeId);
      if (existing) existing.push(mapping);
      else index.set(nodeId, [mapping]);
    }
  }
  return index;
})();

// Unset by default — there is no deployed Stakeholder Intelligence app yet. Every consumer of
// this module must treat a null base URL as "link not available", never fall back to a guessed
// URL (see .env.example).
const STAKEHOLDER_APP_BASE_URL = (import.meta.env.VITE_STAKEHOLDER_APP_URL as string | undefined)?.replace(/\/+$/, '');

export const isStakeholderAppConfigured = Boolean(STAKEHOLDER_APP_BASE_URL);

export interface StakeholderDomainLink {
  readonly domainId: string;
  readonly domainName: string;
  readonly confidence: 'high' | 'medium' | 'loose';
  /** null when VITE_STAKEHOLDER_APP_URL isn't configured — render the domain name without a link. */
  readonly url: string | null;
}

function buildStakeholderAppUrl(domainId: string): string | null {
  if (!STAKEHOLDER_APP_BASE_URL) return null;
  return `${STAKEHOLDER_APP_BASE_URL}/technology?domain=${encodeURIComponent(domainId)}`;
}

/**
 * Every Stakeholder Intelligence technology domain whose mapping references a canvas node that
 * renders this catalogue component, deduplicated by domain. Empty when this component has no
 * known stakeholder-domain mapping — callers should render nothing in that case, not a "no data"
 * placeholder (this crosswalk is deliberately partial; most components have no mapping yet).
 */
export function getStakeholderDomainLinksForComponent(componentId: string): readonly StakeholderDomainLink[] {
  const seenDomainIds = new Set<string>();
  const links: StakeholderDomainLink[] = [];
  for (const appearance of getViewAppearances(componentId)) {
    const matches = nodeIdToMappings.get(appearance.nodeId);
    if (!matches) continue;
    for (const mapping of matches) {
      if (seenDomainIds.has(mapping.stakeholder_domain_id)) continue;
      seenDomainIds.add(mapping.stakeholder_domain_id);
      links.push({
        domainId: mapping.stakeholder_domain_id,
        domainName: mapping.stakeholder_domain_name,
        confidence: mapping.mapping_confidence,
        url: buildStakeholderAppUrl(mapping.stakeholder_domain_id),
      });
    }
  }
  return links;
}
