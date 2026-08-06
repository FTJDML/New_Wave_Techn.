import bundle from './action-architecture-data.json' with { type: 'json' };
import type {
  ArchitectureEdge,
  Capability,
  Claim,
  Component,
  ComponentCapability,
  CommercialRelationship,
  Domain,
  EvidenceSource,
  Programme,
  ResearchGap,
  ResearchTask,
  TechnicalObservation,
  Vendor,
} from '@/types/catalogue';

interface FullResearchCatalogue {
  readonly domains: readonly Domain[];
  readonly capabilities: readonly Capability[];
  readonly vendors: readonly Vendor[];
  readonly components: readonly Component[];
  readonly component_capabilities: readonly ComponentCapability[];
  readonly architecture_edges: readonly ArchitectureEdge[];
  readonly commercial_relationships: readonly CommercialRelationship[];
  readonly programmes: readonly Programme[];
  readonly evidence_sources: readonly EvidenceSource[];
  readonly claims: readonly Claim[];
  readonly technical_observations: readonly TechnicalObservation[];
  readonly research_gaps: readonly ResearchGap[];
  readonly research_tasks: readonly ResearchTask[];
}

const frc = (bundle as unknown as { fullResearchCatalogue: FullResearchCatalogue }).fullResearchCatalogue;

export const domains: readonly Domain[] = frc.domains;
export const capabilities: readonly Capability[] = frc.capabilities;
export const vendors: readonly Vendor[] = frc.vendors;
export const components: readonly Component[] = frc.components;
export const componentCapabilities: readonly ComponentCapability[] = frc.component_capabilities;
export const architectureEdges: readonly ArchitectureEdge[] = frc.architecture_edges;
export const commercialRelationships: readonly CommercialRelationship[] = frc.commercial_relationships;
export const programmes: readonly Programme[] = frc.programmes;
export const evidenceSources: readonly EvidenceSource[] = frc.evidence_sources;
export const claims: readonly Claim[] = frc.claims;
export const technicalObservations: readonly TechnicalObservation[] = frc.technical_observations;
export const researchGaps: readonly ResearchGap[] = frc.research_gaps;
export const researchTasks: readonly ResearchTask[] = frc.research_tasks;

function indexBy<T, K extends string>(items: readonly T[], key: (item: T) => K): ReadonlyMap<K, T> {
  const map = new Map<K, T>();
  for (const item of items) map.set(key(item), item);
  return map;
}

function groupBy<T, K extends string>(items: readonly T[], key: (item: T) => K): ReadonlyMap<K, T[]> {
  const map = new Map<K, T[]>();
  for (const item of items) {
    const k = key(item);
    const list = map.get(k);
    if (list) list.push(item);
    else map.set(k, [item]);
  }
  return map;
}

const domainById = indexBy(domains, (d) => d.domain_id);
const capabilityById = indexBy(capabilities, (c) => c.capability_id);
const vendorById = indexBy(vendors, (v) => v.vendor_id);
const componentById = indexBy(components, (c) => c.component_id);
const evidenceById = indexBy(evidenceSources, (e) => e.source_id);
const gapById = indexBy(researchGaps, (g) => g.gap_id);

const edgesFromComponent = groupBy(architectureEdges, (e) => e.from_component_id);
const edgesToComponent = groupBy(architectureEdges, (e) => e.to_component_id);
const capabilitiesForComponent = groupBy(componentCapabilities, (cc) => cc.component_id);
const commercialRelationshipsForVendor = groupBy(commercialRelationships, (r) => r.vendor_id);
const claimsForSubject = groupBy(claims, (c) => c.subject_id);
const technicalObservationsForComponent = groupBy(technicalObservations, (o) => o.mapped_component_id);
const gapsForComponent = groupBy(researchGaps, (g) => g.gap_component_id);
const gapsForDomain = groupBy(researchGaps, (g) => g.domain_id);
const tasksForGap = groupBy(researchTasks, (t) => t.gap_id);
const componentsForVendor = groupBy(components, (c) => c.vendor_id);
const componentsForDomain = groupBy(components, (c) => c.domain_id);

export function getDomain(id: string): Domain | undefined {
  return domainById.get(id);
}
export function getCapability(id: string): Capability | undefined {
  return capabilityById.get(id);
}
export function getVendor(id: string): Vendor | undefined {
  return vendorById.get(id);
}
export function getComponent(id: string): Component | undefined {
  return componentById.get(id);
}
export function getEvidenceSource(id: string): EvidenceSource | undefined {
  return evidenceById.get(id);
}
export function getEvidenceSources(ids: readonly string[]): EvidenceSource[] {
  return ids.map(getEvidenceSource).filter((e): e is EvidenceSource => e !== undefined);
}
export function getGap(id: string): ResearchGap | undefined {
  return gapById.get(id);
}

export function getOutgoingEdges(componentId: string): ArchitectureEdge[] {
  return edgesFromComponent.get(componentId) ?? [];
}
export function getIncomingEdges(componentId: string): ArchitectureEdge[] {
  return edgesToComponent.get(componentId) ?? [];
}
export function getCapabilitiesForComponent(componentId: string): ComponentCapability[] {
  return capabilitiesForComponent.get(componentId) ?? [];
}
export function getCommercialRelationshipsForVendor(vendorId: string): CommercialRelationship[] {
  return commercialRelationshipsForVendor.get(vendorId) ?? [];
}
export function getClaimsForSubject(subjectId: string): Claim[] {
  return claimsForSubject.get(subjectId) ?? [];
}
export function getTechnicalObservationsForComponent(componentId: string): TechnicalObservation[] {
  return technicalObservationsForComponent.get(componentId) ?? [];
}
export function getGapsForComponent(componentId: string): ResearchGap[] {
  return gapsForComponent.get(componentId) ?? [];
}
export function getGapsForDomain(domainId: string): ResearchGap[] {
  return gapsForDomain.get(domainId) ?? [];
}
export function getTasksForGap(gapId: string): ResearchTask[] {
  return tasksForGap.get(gapId) ?? [];
}
export function getComponentsForVendor(vendorId: string): Component[] {
  return componentsForVendor.get(vendorId) ?? [];
}
export function getComponentsForDomain(domainId: string): Component[] {
  return componentsForDomain.get(domainId) ?? [];
}

/** Programmes that name this component as either a source (legacy) or target (future) system. */
export function getProgrammesForComponent(componentId: string): Programme[] {
  return programmes.filter((p) => p.source_component_ids.includes(componentId) || p.target_component_ids.includes(componentId));
}

export function getClaimsCitingSource(sourceId: string): Claim[] {
  return claims.filter((c) => c.source_ids.includes(sourceId));
}
