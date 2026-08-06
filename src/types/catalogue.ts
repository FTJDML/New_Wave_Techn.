// Canonical research-catalogue record shapes, read from fullResearchCatalogue.
// These are intentionally close to the raw JSON field names (snake_case) since they are
// display-only records for Phase 2's read-only catalogue pages — no editing in this phase.
//
// Deliberately NOT modelled here: stakeholders, ownership_links, cgi_relationships. Those
// carry personal names/roles/contact routes classified INTERNAL_CONFIDENTIAL or RESTRICTED
// and are excluded from the UI until an authenticated phase exists (CLAUDE.md §"Evidence and
// privacy guardrails"; docs/06_BUILD_SEQUENCE.md's Phase 2 list does not include them either).

export interface Domain {
  readonly domain_id: string;
  readonly domain_name: string;
  readonly parent_domain_id: string;
  readonly description: string;
  readonly display_order: number;
}

export interface Capability {
  readonly capability_id: string;
  readonly capability_name: string;
  readonly domain_id: string;
  readonly description: string;
}

export interface Vendor {
  readonly vendor_id: string;
  readonly vendor_name: string;
  readonly vendor_category: string;
  readonly website_url: string;
  readonly logo_slug: string;
  readonly action_relationship_summary: string;
}

export interface Component {
  readonly component_id: string;
  readonly component_key: string;
  readonly display_name: string;
  readonly vendor_id: string;
  readonly vendor_name: string;
  readonly product_name: string;
  readonly domain_id: string;
  readonly primary_capability_id: string;
  readonly parent_component_id: string;
  readonly core_component_id: string;
  readonly node_type: string;
  readonly architecture_role: string;
  readonly business_process: string;
  readonly description: string;
  readonly deployment_status: string;
  readonly evidence_status: string;
  readonly confidence_score: number;
  readonly confidence_band: string;
  readonly lifecycle_disposition: string;
  readonly modernity: string;
  readonly strategic_classification: string;
  readonly system_of_record: string;
  readonly criticality: string;
  readonly hosting_model: string;
  readonly deployment_model: string;
  readonly geography_scope: string;
  readonly user_groups: string;
  readonly first_known_year: string | number;
  readonly relationship_start_year: string | number;
  readonly relationship_start_precision: string;
  readonly relationship_duration_years_json: number | null;
  readonly contract_directness: string;
  readonly last_verified_date: string;
  readonly primary_source_id: string;
  readonly primary_source_url: string;
  readonly source_ids: readonly string[];
  readonly open_questions: string;
  readonly notes: string;
}

export interface ComponentCapability {
  readonly component_capability_id: string;
  readonly component_id: string;
  readonly capability_id: string;
  readonly relationship_type: string;
  readonly confidence_score: number;
  readonly source_ids: readonly string[];
}

export interface ArchitectureEdge {
  readonly edge_id: string;
  readonly from_component_id: string;
  readonly to_component_id: string;
  readonly relationship_type: string;
  readonly direction: string;
  readonly integration_status: string;
  readonly confidence_score: number;
  readonly confidence_band: string;
  readonly integration_pattern: string;
  readonly data_objects: string;
  readonly frequency: string;
  readonly business_purpose: string;
  readonly edge_style: string;
  readonly is_missing_link: boolean;
  readonly primary_source_url: string;
  readonly source_ids: readonly string[];
  readonly validation_question: string;
  readonly notes: string;
}

export interface CommercialRelationship {
  readonly relationship_id: string;
  readonly vendor_id: string;
  readonly vendor_name: string;
  readonly relationship_type: string;
  readonly scope_summary: string;
  readonly start_year: number | string;
  readonly start_precision: string;
  readonly known_since_year: number | string;
  readonly relationship_duration_years_json: number | null;
  readonly current_status: string;
  readonly lifecycle_status: string;
  readonly strategic_role: string;
  readonly geography_scope: string;
  readonly directness: string;
  readonly implementation_partner_id: string;
  readonly support_partner_id: string;
  readonly component_ids: readonly string[];
  readonly evidence_status: string;
  readonly confidence_score: number;
  readonly confidence_band: string;
  readonly source_ids: readonly string[];
  readonly primary_source_url: string;
  readonly last_verified_date: string;
  readonly open_questions: string;
  readonly notes: string;
}

export interface Programme {
  readonly programme_id: string;
  readonly programme_name: string;
  readonly domain_id: string;
  readonly status: string;
  readonly programme_type: string;
  readonly description: string;
  readonly source_component_ids: readonly string[];
  readonly target_component_ids: readonly string[];
  readonly start_date_or_year: string;
  readonly target_date_or_year: string;
  readonly geography_scope: string;
  readonly business_outcome: string;
  readonly evidence_status: string;
  readonly confidence_score: number;
  readonly source_ids: readonly string[];
  readonly open_questions: string;
}

export interface EvidenceSource {
  readonly source_id: string;
  readonly source_title: string;
  readonly publisher: string;
  readonly source_type: string;
  readonly publication_date_or_year: string;
  readonly url_or_reference: string;
  readonly evidence_scope: string;
  readonly last_verified_date: string;
  readonly reliability_rating_1_5: number;
  readonly notes: string;
}

export interface Claim {
  readonly claim_id: string;
  readonly subject_type: string;
  readonly subject_id: string;
  readonly predicate: string;
  readonly value: string;
  readonly claim_status: string;
  readonly confidence_score: number;
  readonly confidence_band: string;
  readonly date_checked: string;
  readonly valid_from: string;
  readonly valid_to: string;
  readonly source_ids: readonly string[];
  readonly data_classification: string;
  readonly notes: string;
}

export interface TechnicalObservation {
  readonly observation_id: string;
  readonly technology_name: string;
  readonly vendor_name: string;
  readonly category: string;
  readonly mapped_component_id: string;
  readonly hostname_or_scope: string;
  readonly observation_date: string;
  readonly observation_date_semantics: string;
  readonly first_seen: string;
  readonly last_seen: string;
  readonly currentness: string;
  readonly evidence_status: string;
  readonly confidence_score: number;
  readonly direct_contract_inference_allowed: boolean;
  readonly source_id: string;
  readonly notes: string;
}

export interface ResearchGap {
  readonly gap_id: string;
  readonly gap_component_id: string;
  readonly domain_id: string;
  readonly gap_title: string;
  readonly why_essential: string;
  readonly research_question: string;
  readonly current_hypothesis: string;
  readonly priority: string;
  readonly impact_area: string;
  readonly gap_status: string;
  readonly research_route: string;
  readonly target_stakeholders_or_sources: string;
  readonly evidence_needed: string;
  readonly recommended_next_action: string;
  readonly research_owner: string;
  readonly target_date: string;
  readonly created_date: string;
  readonly last_updated_date: string;
  readonly linked_component_ids: readonly string[];
  readonly linked_edge_ids: readonly string[];
  readonly source_ids: readonly string[];
  readonly resolution_summary: string;
  readonly resolved_component_id: string;
}

export interface ResearchTask {
  readonly task_id: string;
  readonly gap_id: string;
  readonly task_title: string;
  readonly task_type: string;
  readonly status: string;
  readonly priority: string;
  readonly assigned_to: string;
  readonly next_action: string;
  readonly target_date: string;
  readonly result_summary: string;
  readonly new_source_ids: readonly string[];
  readonly created_date: string;
  readonly updated_date: string;
}
