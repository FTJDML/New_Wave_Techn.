// Pure row-mapping functions: canonical JSON bundle record → Postgres row shape from
// supabase/migrations/0001_schema.sql. Kept dependency-free and side-effect-free so they can
// be unit-tested (tests/unit/seedMappers.test.ts) without a live database connection — the
// only part of Phase 5 that has never run against a real Supabase project.
//
// Deliberately dropped, not migrated (documented in docs/PHASE5_REVIEW_REPORT.md §5):
//   - `research_gaps.target_stakeholders_or_sources` — free-text real names. The `gaps` table
//     in the supplied schema has no column for this field; that omission is correct and this
//     mapper preserves it by never reading the field, matching the app's standing privacy rule.
//   - `fullResearchCatalogue.cgi_relationships` — no table exists for it in the supplied
//     schema; not invented here.
// Folded into `notes` rather than silently dropped (real gaps in the supplied schema, not
// privacy-motivated): `evidence_sources.evidence_scope`, `stakeholders.seniority` /
// `mandate_summary` / `current_status`, `research_tasks.next_action`.

export type Classification = 'public' | 'internal' | 'private' | 'restricted';

export function mapClassification(raw: string | undefined | null): Classification {
  switch ((raw ?? '').toUpperCase()) {
    case 'PUBLIC':
      return 'public';
    case 'INTERNAL':
      return 'internal';
    case 'INTERNAL_CONFIDENTIAL':
      return 'private';
    case 'RESTRICTED':
    case 'PRIVATE_SOURCE':
      return 'restricted';
    default:
      return 'internal';
  }
}

function toIntOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : parseInt(String(value), 10);
  return Number.isFinite(n) ? n : null;
}

function nullIfEmpty(value: string | undefined | null): string | null {
  return value ? value : null;
}

function yearToDate(value: string | number | undefined | null): string | null {
  const year = toIntOrNull(value);
  return year ? `${year}-01-01` : null;
}

export interface VendorRow {
  readonly id: string;
  readonly name: string;
  readonly category: string | null;
  readonly website_url: string | null;
  readonly logo_strategy: string | null;
  readonly logo_value: string | null;
  readonly relationship_summary: string | null;
}

export function mapVendor(
  vendor: Record<string, unknown>,
  logoRegistry: Readonly<Record<string, { strategy?: string; slug?: string; assetPath?: string; text?: string }>>,
): VendorRow {
  const id = String(vendor.vendor_id);
  const logo = logoRegistry[id];
  const logoSlug = nullIfEmpty(vendor.logo_slug as string);
  return {
    id,
    name: String(vendor.vendor_name ?? id),
    category: nullIfEmpty(vendor.vendor_category as string),
    website_url: nullIfEmpty(vendor.website_url as string),
    logo_strategy: logo?.strategy ?? (logoSlug ? 'simple-icons' : null),
    logo_value: logo?.slug ?? logo?.assetPath ?? logo?.text ?? logoSlug,
    relationship_summary: nullIfEmpty(vendor.action_relationship_summary as string),
  };
}

export interface SystemRow {
  readonly id: string;
  readonly name: string;
  readonly vendor_id: string | null;
  readonly product_name: string | null;
  readonly domain_id: string;
  readonly parent_system_id: string | null;
  readonly core_system_id: string | null;
  readonly architecture_role: string;
  readonly business_process: string | null;
  readonly description: string | null;
  readonly deployment_status: string;
  readonly evidence_status: string;
  readonly confidence_score: number | null;
  readonly lifecycle_disposition: string | null;
  readonly modernity: string | null;
  readonly system_of_record: string | null;
  readonly criticality: string | null;
  readonly hosting_model: string | null;
  readonly deployment_model: string | null;
  readonly geography_scope: string | null;
  readonly user_groups: string | null;
  readonly first_known_year: number | null;
  readonly last_verified_date: string | null;
  readonly open_questions: string | null;
  readonly notes: string | null;
  readonly classification: Classification;
}

export function mapSystem(component: Record<string, unknown>): SystemRow {
  const evidenceStatus = String(component.evidence_status ?? 'unknown').toLowerCase();
  return {
    id: String(component.component_id),
    name: String(component.display_name ?? component.component_id),
    vendor_id: nullIfEmpty(component.vendor_id as string),
    product_name: nullIfEmpty(component.product_name as string),
    domain_id: String(component.domain_id ?? 'DOM-UNKNOWN'),
    parent_system_id: nullIfEmpty(component.parent_component_id as string),
    core_system_id: nullIfEmpty(component.core_component_id as string),
    architecture_role: String(component.architecture_role ?? 'unknown'),
    business_process: nullIfEmpty(component.business_process as string),
    description: nullIfEmpty(component.description as string),
    deployment_status: String(component.deployment_status ?? 'unknown').toLowerCase(),
    evidence_status: evidenceStatus,
    confidence_score: toIntOrNull(component.confidence_score),
    lifecycle_disposition: nullIfEmpty(component.lifecycle_disposition as string),
    modernity: nullIfEmpty(component.modernity as string),
    system_of_record: nullIfEmpty(component.system_of_record as string),
    criticality: nullIfEmpty(component.criticality as string),
    hosting_model: nullIfEmpty(component.hosting_model as string),
    deployment_model: nullIfEmpty(component.deployment_model as string),
    geography_scope: nullIfEmpty(component.geography_scope as string),
    user_groups: nullIfEmpty(component.user_groups as string),
    first_known_year: toIntOrNull(component.first_known_year),
    last_verified_date: nullIfEmpty(component.last_verified_date as string),
    open_questions: nullIfEmpty(component.open_questions as string),
    notes: nullIfEmpty(component.notes as string),
    // Components carry no classification field of their own; a privately-confirmed system's
    // very existence is treated as sensitive, everything else defaults to the schema's own
    // 'internal' default.
    classification: evidenceStatus === 'private_confirmation' ? 'private' : 'internal',
  };
}

export interface CapabilityRow {
  readonly id: string;
  readonly name: string;
  readonly domain_id: string;
  readonly description: string | null;
}

export function mapCapability(capability: Record<string, unknown>): CapabilityRow {
  return {
    id: String(capability.capability_id),
    name: String(capability.capability_name ?? capability.capability_id),
    domain_id: String(capability.domain_id ?? 'DOM-UNKNOWN'),
    description: nullIfEmpty(capability.description as string),
  };
}

export interface SystemCapabilityRow {
  readonly system_id: string;
  readonly capability_id: string;
  readonly is_primary: boolean;
}

export function mapSystemCapability(cc: Record<string, unknown>): SystemCapabilityRow {
  return { system_id: String(cc.component_id), capability_id: String(cc.capability_id), is_primary: cc.relationship_type === 'PRIMARY' };
}

export interface CommercialRelationshipRow {
  readonly id: string;
  readonly vendor_id: string;
  readonly relationship_type: string;
  readonly scope_summary: string | null;
  readonly start_year: number | null;
  readonly start_precision: string;
  readonly known_since_year: number | null;
  readonly duration_years_as_of_date: number | null;
  readonly current_status: string | null;
  readonly lifecycle_status: string | null;
  readonly strategic_role: string | null;
  readonly geography_scope: string | null;
  readonly directness: string | null;
  readonly implementation_partner_id: string | null;
  readonly support_partner_id: string | null;
  readonly evidence_status: string | null;
  readonly confidence_score: number | null;
  readonly last_verified_date: string | null;
  readonly open_questions: string | null;
  readonly notes: string | null;
  readonly classification: Classification;
}

export function mapCommercialRelationship(rel: Record<string, unknown>): CommercialRelationshipRow {
  return {
    id: String(rel.relationship_id),
    vendor_id: String(rel.vendor_id),
    relationship_type: String(rel.relationship_type ?? 'unknown'),
    scope_summary: nullIfEmpty(rel.scope_summary as string),
    start_year: toIntOrNull(rel.start_year),
    start_precision: String(rel.start_precision ?? 'unknown').toLowerCase(),
    known_since_year: toIntOrNull(rel.known_since_year),
    duration_years_as_of_date: toIntOrNull(rel.relationship_duration_years_json),
    current_status: nullIfEmpty(rel.current_status as string),
    lifecycle_status: nullIfEmpty(rel.lifecycle_status as string),
    strategic_role: nullIfEmpty(rel.strategic_role as string),
    geography_scope: nullIfEmpty(rel.geography_scope as string),
    directness: nullIfEmpty(rel.directness as string),
    implementation_partner_id: nullIfEmpty(rel.implementation_partner_id as string),
    support_partner_id: nullIfEmpty(rel.support_partner_id as string),
    evidence_status: nullIfEmpty((rel.evidence_status as string)?.toLowerCase()),
    confidence_score: toIntOrNull(rel.confidence_score),
    last_verified_date: nullIfEmpty(rel.last_verified_date as string),
    open_questions: nullIfEmpty(rel.open_questions as string),
    notes: nullIfEmpty(rel.notes as string),
    classification: 'internal',
  };
}

export interface EvidenceSourceRow {
  readonly id: string;
  readonly title: string;
  readonly url_or_reference: string | null;
  readonly source_type: string;
  readonly publisher: string | null;
  readonly publication_date: string | null;
  readonly checked_date: string | null;
  readonly classification: Classification;
  readonly notes: string | null;
}

export function mapEvidenceSource(source: Record<string, unknown>): EvidenceSourceRow {
  const scope = nullIfEmpty(source.evidence_scope as string);
  const notes = nullIfEmpty(source.notes as string);
  return {
    id: String(source.source_id),
    title: String(source.source_title ?? source.source_id),
    url_or_reference: nullIfEmpty(source.url_or_reference as string),
    source_type: String(source.source_type ?? 'unknown'),
    publisher: nullIfEmpty(source.publisher as string),
    publication_date: yearToDate(source.publication_date_or_year as string),
    checked_date: nullIfEmpty(source.last_verified_date as string),
    classification: mapClassification(source.source_type === 'PRIVATE_SOURCE' ? 'RESTRICTED' : undefined),
    notes: scope ? [scope, notes].filter(Boolean).join(' | ') : notes,
  };
}

export interface ClaimRow {
  readonly id: string;
  readonly subject_type: string;
  readonly subject_id: string;
  readonly predicate: string;
  readonly value: string;
  readonly status: string;
  readonly confidence_score: number | null;
  readonly valid_from: string | null;
  readonly valid_to: string | null;
  readonly checked_date: string | null;
  readonly classification: Classification;
  readonly notes: string | null;
}

export function mapClaim(claim: Record<string, unknown>): ClaimRow {
  return {
    id: String(claim.claim_id),
    subject_type: String(claim.subject_type ?? 'unknown'),
    subject_id: String(claim.subject_id),
    predicate: String(claim.predicate ?? 'unknown'),
    value: String(claim.value ?? ''),
    status: String(claim.claim_status ?? 'unknown'),
    confidence_score: toIntOrNull(claim.confidence_score),
    valid_from: nullIfEmpty(claim.valid_from as string),
    valid_to: nullIfEmpty(claim.valid_to as string),
    checked_date: nullIfEmpty(claim.date_checked as string),
    classification: mapClassification(claim.data_classification as string),
    notes: nullIfEmpty(claim.notes as string),
  };
}

export interface TechnicalObservationRow {
  readonly id: string;
  readonly technology_name: string;
  readonly vendor_name: string | null;
  readonly category: string | null;
  readonly mapped_system_id: string | null;
  readonly hostname_or_scope: string | null;
  readonly observation_date: string | null;
  readonly first_seen: string | null;
  readonly last_seen: string | null;
  readonly currentness: string | null;
  readonly confidence_score: number | null;
  readonly direct_contract_inference_allowed: boolean;
  readonly source_id: string | null;
  readonly notes: string | null;
}

export function mapTechnicalObservation(observation: Record<string, unknown>): TechnicalObservationRow {
  return {
    id: String(observation.observation_id),
    technology_name: String(observation.technology_name ?? 'unknown'),
    vendor_name: nullIfEmpty(observation.vendor_name as string),
    category: nullIfEmpty(observation.category as string),
    mapped_system_id: nullIfEmpty(observation.mapped_component_id as string),
    hostname_or_scope: nullIfEmpty(observation.hostname_or_scope as string),
    observation_date: nullIfEmpty(observation.observation_date as string),
    first_seen: nullIfEmpty(observation.first_seen as string),
    last_seen: nullIfEmpty(observation.last_seen as string),
    currentness: nullIfEmpty(observation.currentness as string),
    confidence_score: toIntOrNull(observation.confidence_score),
    direct_contract_inference_allowed: Boolean(observation.direct_contract_inference_allowed),
    source_id: nullIfEmpty(observation.source_id as string),
    notes: nullIfEmpty(observation.notes as string),
  };
}

export interface GapRow {
  readonly id: string;
  readonly name: string;
  readonly domain_id: string;
  readonly capability_id: string | null;
  readonly why_essential: string | null;
  readonly research_question: string;
  readonly current_hypothesis: string | null;
  readonly priority: string;
  readonly criticality: string | null;
  readonly status: string;
  readonly fastest_research_route: string | null;
  readonly required_evidence_type: string | null;
  readonly owner: string | null;
  readonly next_action: string | null;
  readonly resolved_at: string | null;
  readonly resolution_summary: string | null;
  readonly classification: Classification;
}

/** Never reads `target_stakeholders_or_sources` — see the file header note. */
export function mapGap(gap: Record<string, unknown>): GapRow {
  const status = String(gap.gap_status ?? 'open').toLowerCase();
  return {
    id: String(gap.gap_id),
    name: String(gap.gap_title ?? gap.gap_id),
    domain_id: String(gap.domain_id ?? 'DOM-UNKNOWN'),
    capability_id: null,
    why_essential: nullIfEmpty(gap.why_essential as string),
    research_question: String(gap.research_question ?? ''),
    current_hypothesis: nullIfEmpty(gap.current_hypothesis as string),
    priority: String(gap.priority ?? 'P3'),
    criticality: nullIfEmpty(gap.impact_area as string),
    status,
    fastest_research_route: nullIfEmpty(gap.research_route as string),
    required_evidence_type: nullIfEmpty(gap.evidence_needed as string),
    owner: nullIfEmpty(gap.research_owner as string),
    next_action: nullIfEmpty(gap.recommended_next_action as string),
    resolved_at: status === 'resolved' ? nullIfEmpty(gap.last_updated_date as string) : null,
    resolution_summary: nullIfEmpty(gap.resolution_summary as string),
    classification: 'internal',
  };
}

export interface ResearchTaskRow {
  readonly id: string;
  readonly gap_id: string | null;
  readonly title: string;
  readonly description: string | null;
  readonly status: string;
  readonly priority: string | null;
  readonly assignee: string | null;
  readonly due_date: string | null;
  readonly result_summary: string | null;
}

export function mapResearchTask(task: Record<string, unknown>): ResearchTaskRow {
  const description = [nullIfEmpty(task.task_type as string), nullIfEmpty(task.next_action as string)].filter(Boolean).join(' — ') || null;
  return {
    id: String(task.task_id),
    gap_id: nullIfEmpty(task.gap_id as string),
    title: String(task.task_title ?? task.task_id),
    description,
    status: String(task.status ?? 'open').toLowerCase(),
    priority: nullIfEmpty(task.priority as string),
    assignee: nullIfEmpty(task.assigned_to as string),
    due_date: nullIfEmpty(task.target_date as string),
    result_summary: nullIfEmpty(task.result_summary as string),
  };
}

export interface ProgrammeRow {
  readonly id: string;
  readonly name: string;
  readonly status: string | null;
  readonly scope: string | null;
  readonly geography: string | null;
  readonly timeline: string | null;
  readonly evidence_status: string | null;
  readonly open_questions: string | null;
}

export function mapProgramme(programme: Record<string, unknown>): ProgrammeRow {
  const start = nullIfEmpty(programme.start_date_or_year as string);
  const target = nullIfEmpty(programme.target_date_or_year as string);
  return {
    id: String(programme.programme_id),
    name: String(programme.programme_name ?? programme.programme_id),
    status: nullIfEmpty(programme.status as string),
    scope: nullIfEmpty(programme.description as string) ?? nullIfEmpty(programme.business_outcome as string),
    geography: nullIfEmpty(programme.geography_scope as string),
    timeline: start || target ? `${start ?? '?'} → ${target ?? '?'}` : null,
    evidence_status: nullIfEmpty((programme.evidence_status as string)?.toLowerCase()),
    open_questions: nullIfEmpty(programme.open_questions as string),
  };
}

export interface StakeholderRow {
  readonly id: string;
  readonly full_name: string;
  readonly job_title: string | null;
  readonly function_area: string | null;
  readonly linkedin_url: string | null;
  readonly email: string | null;
  readonly source_id: string | null;
  readonly classification: Classification;
  readonly confidence_score: number | null;
  readonly notes: string | null;
}

export function mapStakeholder(stakeholder: Record<string, unknown>): StakeholderRow {
  const extras = [
    nullIfEmpty(stakeholder.seniority as string) ? `Seniority: ${stakeholder.seniority}` : null,
    nullIfEmpty(stakeholder.current_status as string) ? `Status: ${stakeholder.current_status}` : null,
    nullIfEmpty(stakeholder.mandate_summary as string),
    nullIfEmpty(stakeholder.notes as string),
  ].filter(Boolean);
  const sourceIds = (stakeholder.source_ids as readonly string[] | undefined) ?? [];
  return {
    id: String(stakeholder.stakeholder_id),
    full_name: String(stakeholder.full_name ?? ''),
    job_title: nullIfEmpty(stakeholder.title as string),
    function_area: nullIfEmpty(stakeholder.department_or_cluster as string),
    linkedin_url: nullIfEmpty(stakeholder.linkedin_url as string),
    email: null,
    source_id: sourceIds[0] ?? null,
    classification: mapClassification(stakeholder.data_classification as string) === 'internal' ? 'private' : mapClassification(stakeholder.data_classification as string),
    confidence_score: toIntOrNull(stakeholder.confidence_score),
    notes: extras.length ? extras.join(' | ') : null,
  };
}

export interface ArchitectureRelationshipRow {
  readonly id: string;
  readonly source_system_id: string;
  readonly target_system_id: string;
  readonly direction: string | null;
  readonly relationship_type: string;
  readonly integration_pattern: string | null;
  readonly data_objects: readonly string[];
  readonly frequency: string | null;
  readonly status: string | null;
  readonly is_missing_link: boolean;
  readonly evidence_status: string | null;
  readonly confidence_score: number | null;
  readonly validation_question: string | null;
  readonly notes: string | null;
}

export function mapArchitectureRelationship(edge: Record<string, unknown>): ArchitectureRelationshipRow {
  const rawObjects = edge.data_objects;
  const dataObjects = typeof rawObjects === 'string'
    ? rawObjects.split(';').map((part) => part.trim()).filter(Boolean)
    : Array.isArray(rawObjects)
      ? (rawObjects as unknown[]).map(String)
      : [];
  return {
    id: String(edge.edge_id),
    source_system_id: String(edge.from_component_id),
    target_system_id: String(edge.to_component_id),
    direction: nullIfEmpty((edge.direction as string | undefined)?.toLowerCase()),
    relationship_type: String(edge.relationship_type ?? 'unknown'),
    integration_pattern: nullIfEmpty(edge.integration_pattern as string),
    data_objects: dataObjects,
    frequency: nullIfEmpty((edge.frequency as string | undefined)?.toLowerCase()),
    // The supplied schema keeps `status` and `evidence_status` as two distinct columns, but the
    // source JSON only carries one status-like field for edges (`integration_status`) — mapped
    // to `evidence_status` since it describes confirmation strength, not relationship lifecycle.
    status: null,
    is_missing_link: Boolean(edge.is_missing_link),
    evidence_status: nullIfEmpty((edge.integration_status as string | undefined)?.toLowerCase()),
    confidence_score: toIntOrNull(edge.confidence_score),
    validation_question: nullIfEmpty(edge.validation_question as string),
    notes: nullIfEmpty(edge.notes as string),
  };
}

export interface GapSystemRow {
  readonly gap_id: string;
  readonly system_id: string;
}

export function extractGapSystems(gap: Record<string, unknown>): GapSystemRow[] {
  const ids = (gap.linked_component_ids as readonly string[] | undefined) ?? [];
  return ids.map((system_id) => ({ gap_id: String(gap.gap_id), system_id }));
}

export interface ClaimSourceRow {
  readonly claim_id: string;
  readonly source_id: string;
}

export function extractClaimSources(claim: Record<string, unknown>): ClaimSourceRow[] {
  const ids = (claim.source_ids as readonly string[] | undefined) ?? [];
  return ids.map((source_id) => ({ claim_id: String(claim.claim_id), source_id }));
}

export interface SystemSourceRow {
  readonly system_id: string;
  readonly source_id: string;
  readonly is_primary: boolean;
}

export function extractSystemSources(component: Record<string, unknown>): SystemSourceRow[] {
  const ids = (component.source_ids as readonly string[] | undefined) ?? [];
  const primary = nullIfEmpty(component.primary_source_id as string);
  return ids.map((source_id) => ({ system_id: String(component.component_id), source_id, is_primary: source_id === primary }));
}

export interface ArchitectureRelationshipSourceRow {
  readonly relationship_id: string;
  readonly source_id: string;
}

export function extractArchitectureRelationshipSources(edge: Record<string, unknown>): ArchitectureRelationshipSourceRow[] {
  const ids = (edge.source_ids as readonly string[] | undefined) ?? [];
  return ids.map((source_id) => ({ relationship_id: String(edge.edge_id), source_id }));
}

export interface CommercialRelationshipSystemRow {
  readonly relationship_id: string;
  readonly system_id: string;
}

export function extractCommercialRelationshipSystems(rel: Record<string, unknown>): CommercialRelationshipSystemRow[] {
  const ids = (rel.component_ids as readonly string[] | undefined) ?? [];
  return ids.map((system_id) => ({ relationship_id: String(rel.relationship_id), system_id }));
}

export interface ProgrammeSystemRow {
  readonly programme_id: string;
  readonly system_id: string;
  readonly role: string;
}

export function extractProgrammeSystems(programme: Record<string, unknown>): ProgrammeSystemRow[] {
  const sourceIds = (programme.source_component_ids as readonly string[] | undefined) ?? [];
  const targetIds = (programme.target_component_ids as readonly string[] | undefined) ?? [];
  const programmeId = String(programme.programme_id);
  return [
    ...sourceIds.map((system_id) => ({ programme_id: programmeId, system_id, role: 'source' })),
    ...targetIds.map((system_id) => ({ programme_id: programmeId, system_id, role: 'target' })),
  ];
}

export interface OwnershipLinkRow {
  readonly id: string;
  readonly stakeholder_id: string;
  readonly subject_type: string;
  readonly subject_id: string;
  readonly ownership_role: string;
  readonly status: string;
  readonly confidence_score: number | null;
  readonly source_id: string | null;
  readonly notes: string | null;
}

export function mapOwnershipLink(link: Record<string, unknown>): OwnershipLinkRow {
  const sourceIds = (link.source_ids as readonly string[] | undefined) ?? [];
  return {
    id: String(link.ownership_link_id),
    stakeholder_id: String(link.stakeholder_id),
    subject_type: String(link.object_type ?? 'unknown'),
    subject_id: String(link.object_id),
    ownership_role: String(link.owner_role ?? 'unknown'),
    status: String(link.evidence_status ?? 'unknown').toLowerCase(),
    confidence_score: toIntOrNull(link.confidence_score),
    source_id: sourceIds[0] ?? null,
    notes: nullIfEmpty(link.notes as string),
  };
}
