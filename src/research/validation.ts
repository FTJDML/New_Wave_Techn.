// Pure validators for every Phase 4 research-edit input. Each returns { ok, errors } instead
// of throwing, so forms and the CSV import preview can show every problem at once.
import { getComponent, programmes, researchGaps } from '@/data/fullCatalogue';
import { domains } from '@/data/fullCatalogue';
import { capabilities } from '@/data/fullCatalogue';
import { CLASSIFICATIONS, GAP_STATUSES, type Classification } from './types';
import type { GapStatus, NewClaimInput, NewOwnershipLinkInput, NewSourceInput, NewStakeholderInput, NewTaskInput, PromotionInput, ValidationResult } from './types';

const SOURCE_TYPES = ['FIRST_PARTY', 'FIRST_PARTY_JOB', 'PRIVATE_SOURCE', 'PROJECT_WORKING_FILE', 'TECHNICAL_ENDPOINT', 'TECHNICAL_SCAN', 'VENDOR_CASE', 'VISUAL_EVIDENCE'];

function ok(): ValidationResult {
  return { ok: true, errors: [] };
}
function fail(errors: readonly string[]): ValidationResult {
  return { ok: false, errors };
}
function isClassification(value: string): value is Classification {
  return (CLASSIFICATIONS as readonly string[]).includes(value);
}

export function validateSourceInput(input: NewSourceInput, knownSourceIds: ReadonlySet<string>, existingId?: string): ValidationResult {
  const errors: string[] = [];
  if (!input.source_title.trim()) errors.push('Source title is required.');
  if (!input.publisher.trim()) errors.push('Publisher is required.');
  if (!SOURCE_TYPES.includes(input.source_type)) errors.push(`Source type must be one of: ${SOURCE_TYPES.join(', ')}.`);
  if (!Number.isInteger(input.reliability_rating_1_5) || input.reliability_rating_1_5 < 1 || input.reliability_rating_1_5 > 5) {
    errors.push('Reliability rating must be an integer from 1 to 5.');
  }
  if (!isClassification(input.data_classification)) errors.push(`Classification must be one of: ${CLASSIFICATIONS.join(', ')}.`);
  if (existingId && !knownSourceIds.has(existingId)) errors.push(`Cannot update unknown source id ${existingId}.`);
  return errors.length ? fail(errors) : ok();
}

export function validateClaimInput(input: NewClaimInput, knownSourceIds: ReadonlySet<string>): ValidationResult {
  const errors: string[] = [];
  const SUBJECT_TYPES = ['COMPONENT', 'PROGRAMME', 'ARCHITECTURE', 'COMMERCIAL_RELATIONSHIP'];
  if (!SUBJECT_TYPES.includes(input.subject_type)) errors.push(`Subject type must be one of: ${SUBJECT_TYPES.join(', ')}.`);
  if (!input.subject_id.trim()) errors.push('Subject id is required.');
  else if (input.subject_type === 'COMPONENT' && !getComponent(input.subject_id)) errors.push(`Subject id ${input.subject_id} does not resolve to a known component.`);
  else if (input.subject_type === 'PROGRAMME' && !programmes.some((p) => p.programme_id === input.subject_id)) {
    errors.push(`Subject id ${input.subject_id} does not resolve to a known programme.`);
  }
  if (!input.value.trim()) errors.push('Claim value is required.');
  if (!input.claim_status.trim()) errors.push('Claim status is required.');
  if (!Number.isFinite(input.confidence_score) || input.confidence_score < 0 || input.confidence_score > 100) {
    errors.push('Confidence score must be between 0 and 100.');
  }
  if (input.source_ids.length === 0) errors.push('At least one source is required.');
  for (const id of input.source_ids) {
    if (!knownSourceIds.has(id)) errors.push(`Source id ${id} does not resolve to a known evidence source.`);
  }
  if (!isClassification(input.data_classification)) errors.push(`Classification must be one of: ${CLASSIFICATIONS.join(', ')}.`);
  return errors.length ? fail(errors) : ok();
}

export function validateTaskInput(input: NewTaskInput): ValidationResult {
  const errors: string[] = [];
  if (!researchGaps.some((g) => g.gap_id === input.gap_id)) errors.push(`Gap id ${input.gap_id} does not resolve to a known gap.`);
  if (!input.task_title.trim()) errors.push('Task title is required.');
  if (!input.status.trim()) errors.push('Task status is required.');
  return errors.length ? fail(errors) : ok();
}

const ALLOWED_GAP_TRANSITIONS: Readonly<Record<GapStatus, readonly GapStatus[]>> = {
  OPEN: ['RESEARCHING', 'PARKED'],
  RESEARCHING: ['VALIDATING', 'PARKED', 'OPEN'],
  VALIDATING: ['RESOLVED', 'RESEARCHING', 'PARKED'],
  RESOLVED: [],
  PARKED: ['OPEN', 'RESEARCHING'],
};

export function getAllowedGapTransitions(currentStatus: string): readonly GapStatus[] {
  const current = GAP_STATUSES.includes(currentStatus as GapStatus) ? (currentStatus as GapStatus) : 'OPEN';
  return ALLOWED_GAP_TRANSITIONS[current];
}

export function validateGapStatusChange(currentStatus: string, nextStatus: string, resolutionSummary?: string): ValidationResult {
  const errors: string[] = [];
  const current = GAP_STATUSES.includes(currentStatus as GapStatus) ? (currentStatus as GapStatus) : 'OPEN';
  if (!GAP_STATUSES.includes(nextStatus as GapStatus)) errors.push(`Status must be one of: ${GAP_STATUSES.join(', ')}.`);
  else if (!ALLOWED_GAP_TRANSITIONS[current].includes(nextStatus as GapStatus)) {
    errors.push(`Cannot move a gap from ${current} directly to ${nextStatus}. Allowed next steps: ${ALLOWED_GAP_TRANSITIONS[current].join(', ') || 'none — already resolved'}.`);
  }
  if (nextStatus === 'RESOLVED' && !resolutionSummary?.trim()) errors.push('A resolution summary is required to resolve a gap.');
  return errors.length ? fail(errors) : ok();
}

export function validateStakeholderInput(input: NewStakeholderInput): ValidationResult {
  const errors: string[] = [];
  if (!input.full_name.trim()) errors.push('A name is required to create a contact record.');
  if (!isClassification(input.data_classification)) errors.push(`Classification must be one of: ${CLASSIFICATIONS.join(', ')}.`);
  return errors.length ? fail(errors) : ok();
}

export function validateOwnershipLinkInput(input: NewOwnershipLinkInput): ValidationResult {
  const errors: string[] = [];
  if (!input.stakeholder_id && !input.new_stakeholder) errors.push('Select an existing contact or provide a new one.');
  if (input.new_stakeholder) {
    const nested = validateStakeholderInput(input.new_stakeholder);
    errors.push(...nested.errors);
  }
  const OBJECT_TYPES = ['COMPONENT', 'DOMAIN', 'CAPABILITY', 'PROGRAMME', 'GAP'];
  if (!OBJECT_TYPES.includes(input.object_type)) errors.push(`Object type must be one of: ${OBJECT_TYPES.join(', ')}.`);
  if (!input.object_id.trim()) errors.push('Object id is required.');
  else if (input.object_type === 'COMPONENT' && !getComponent(input.object_id)) errors.push(`Object id ${input.object_id} does not resolve to a known component.`);
  else if (input.object_type === 'DOMAIN' && !domains.some((d) => d.domain_id === input.object_id)) errors.push(`Object id ${input.object_id} does not resolve to a known domain.`);
  else if (input.object_type === 'CAPABILITY' && !capabilities.some((c) => c.capability_id === input.object_id)) errors.push(`Object id ${input.object_id} does not resolve to a known capability.`);
  else if (input.object_type === 'PROGRAMME' && !programmes.some((p) => p.programme_id === input.object_id)) errors.push(`Object id ${input.object_id} does not resolve to a known programme.`);
  else if (input.object_type === 'GAP' && !researchGaps.some((g) => g.gap_id === input.object_id)) errors.push(`Object id ${input.object_id} does not resolve to a known gap.`);
  if (!input.owner_role.trim()) errors.push('Owner role is required.');
  if (!Number.isFinite(input.confidence_score) || input.confidence_score < 0 || input.confidence_score > 100) {
    errors.push('Confidence score must be between 0 and 100.');
  }
  return errors.length ? fail(errors) : ok();
}

export function validatePromotionInput(input: PromotionInput, knownSourceIds: ReadonlySet<string>, knownClaimIds: ReadonlySet<string>): ValidationResult {
  const errors: string[] = [];
  if (!input.note.trim()) errors.push('A justification note is required — an observation is never promoted automatically.');
  if (!input.claim_id && !input.new_claim) errors.push('Link an existing claim or provide a new one that supports this promotion.');
  if (input.claim_id && !knownClaimIds.has(input.claim_id)) errors.push(`Claim id ${input.claim_id} does not resolve to a known claim.`);
  if (input.new_claim) {
    const nested = validateClaimInput(input.new_claim, knownSourceIds);
    errors.push(...nested.errors);
  }
  return errors.length ? fail(errors) : ok();
}
