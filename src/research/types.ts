// Phase 4 research/editing workflow types. Everything here lives client-side only (no
// backend exists before Phase 5) — see src/research/store.ts for the local persistence layer.
//
// Privacy note: `StakeholderRecord.full_name` is stored (so a future authenticated phase can
// use it) but is never exported by any read-side selector in store.ts. Every read path works
// through `MaskedStakeholder`, which omits the name entirely and substitutes an auto-generated
// label. This is enforced at the type/module level, not just by convention in a component.

export type Classification = 'PUBLIC' | 'INTERNAL' | 'INTERNAL_CONFIDENTIAL' | 'RESTRICTED';

export const CLASSIFICATIONS: readonly Classification[] = ['PUBLIC', 'INTERNAL', 'INTERNAL_CONFIDENTIAL', 'RESTRICTED'];

export interface StakeholderRecord {
  readonly stakeholder_id: string;
  readonly full_name: string;
  readonly title: string;
  readonly department_or_cluster: string;
  readonly seniority: string;
  readonly current_status: string;
  readonly mandate_summary: string;
  readonly linkedin_url: string;
  readonly evidence_status: string;
  readonly confidence_score: number;
  readonly source_ids: readonly string[];
  readonly data_classification: Classification;
  readonly notes: string;
  readonly created_at: string;
  readonly updated_at: string;
}

/** The only shape a stakeholder is ever read back as. No `full_name` field exists here. */
export type MaskedStakeholder = Omit<StakeholderRecord, 'full_name'> & { readonly label: string };

export interface OwnershipLink {
  readonly ownership_link_id: string;
  readonly stakeholder_id: string;
  readonly object_type: 'COMPONENT' | 'DOMAIN' | 'CAPABILITY' | 'PROGRAMME' | 'GAP';
  readonly object_id: string;
  readonly owner_role: string;
  readonly status: 'HYPOTHESIS' | 'CONFIRMED';
  readonly confidence_score: number;
  readonly source_ids: readonly string[];
  readonly notes: string;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface AuditEvent {
  readonly id: string;
  readonly entity_type: 'source' | 'claim' | 'gap' | 'task' | 'stakeholder' | 'ownership_link' | 'promotion' | 'import';
  readonly entity_id: string;
  readonly action: 'create' | 'update' | 'promote' | 'status_change' | 'import';
  readonly summary: string;
  readonly before: unknown;
  readonly after: unknown;
  readonly note?: string;
  readonly created_at: string;
}

export interface NewSourceInput {
  readonly source_title: string;
  readonly publisher: string;
  readonly source_type: string;
  readonly publication_date_or_year?: string;
  readonly url_or_reference?: string;
  readonly evidence_scope?: string;
  readonly reliability_rating_1_5: number;
  readonly data_classification: Classification;
  readonly notes?: string;
}

export interface NewClaimInput {
  readonly subject_type: 'COMPONENT' | 'PROGRAMME' | 'ARCHITECTURE' | 'COMMERCIAL_RELATIONSHIP';
  readonly subject_id: string;
  readonly predicate: string;
  readonly value: string;
  readonly claim_status: string;
  readonly confidence_score: number;
  readonly source_ids: readonly string[];
  readonly data_classification: Classification;
  readonly notes?: string;
}

export interface NewTaskInput {
  readonly gap_id: string;
  readonly task_title: string;
  readonly task_type?: string;
  readonly status: string;
  readonly priority?: string;
  readonly assigned_to?: string;
  readonly next_action?: string;
  readonly target_date?: string;
  readonly result_summary?: string;
}

export type GapStatus = 'OPEN' | 'RESEARCHING' | 'VALIDATING' | 'RESOLVED' | 'PARKED';
export const GAP_STATUSES: readonly GapStatus[] = ['OPEN', 'RESEARCHING', 'VALIDATING', 'RESOLVED', 'PARKED'];

export interface NewStakeholderInput {
  readonly full_name: string;
  readonly title?: string;
  readonly department_or_cluster?: string;
  readonly seniority?: string;
  readonly mandate_summary?: string;
  readonly linkedin_url?: string;
  readonly data_classification: Classification;
  readonly source_ids?: readonly string[];
  readonly notes?: string;
}

export interface NewOwnershipLinkInput {
  readonly stakeholder_id?: string;
  readonly new_stakeholder?: NewStakeholderInput;
  readonly object_type: OwnershipLink['object_type'];
  readonly object_id: string;
  readonly owner_role: string;
  readonly status: OwnershipLink['status'];
  readonly confidence_score: number;
  readonly source_ids?: readonly string[];
  readonly notes?: string;
}

export interface PromotionInput {
  readonly observation_id: string;
  readonly claim_id?: string;
  readonly new_claim?: NewClaimInput;
  readonly note: string;
}

export interface ValidationResult {
  readonly ok: boolean;
  readonly errors: readonly string[];
}

export interface ImportRowResult {
  readonly rowIndex: number;
  readonly ok: boolean;
  readonly errors: readonly string[];
  readonly id?: string;
}

export interface ImportResult {
  readonly kind: 'sources' | 'claims';
  readonly rows: readonly ImportRowResult[];
  readonly importedCount: number;
  readonly skippedCount: number;
}
