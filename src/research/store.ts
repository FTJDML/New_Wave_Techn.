// Local Phase 4 research-edit store. No backend exists before Phase 5 (CLAUDE.md), so every
// mutation here lands in a browser-local overlay — never in the canonical JSON bundle — and
// every mutation is appended to an audit log before the change becomes visible. Merged
// selectors (mergedSources, mergedClaims, mergedGap, ...) are what components should read
// from; the raw canonical arrays in src/data/fullCatalogue.ts never change.
import {
  evidenceSources as canonicalSources,
  claims as canonicalClaims,
  researchGaps as canonicalGaps,
  researchTasks as canonicalTasks,
  technicalObservations as canonicalObservations,
} from '@/data/fullCatalogue';
import type { Claim, EvidenceSource, ResearchGap, ResearchTask } from '@/types/catalogue';
import {
  validateClaimInput,
  validateGapStatusChange,
  validateOwnershipLinkInput,
  validatePromotionInput,
  validateSourceInput,
  validateStakeholderInput,
  validateTaskInput,
} from './validation';
import type {
  AuditEvent,
  ImportResult,
  ImportRowResult,
  MaskedStakeholder,
  NewClaimInput,
  NewOwnershipLinkInput,
  NewSourceInput,
  NewStakeholderInput,
  NewTaskInput,
  OwnershipLink,
  PromotionInput,
  StakeholderRecord,
} from './types';

const STORAGE_KEY = 'aaw-research-overlay-v1';

interface OverlayState {
  readonly sources: Record<string, EvidenceSource>;
  readonly claims: Record<string, Claim>;
  readonly gapPatches: Record<string, Partial<ResearchGap>>;
  readonly tasks: Record<string, ResearchTask>;
  readonly stakeholders: Record<string, StakeholderRecord>;
  readonly ownershipLinks: Record<string, OwnershipLink>;
  readonly promotedObservationIds: readonly string[];
  readonly auditLog: readonly AuditEvent[];
}

function emptyState(): OverlayState {
  return { sources: {}, claims: {}, gapPatches: {}, tasks: {}, stakeholders: {}, ownershipLinks: {}, promotedObservationIds: [], auditLog: [] };
}

function loadState(): OverlayState {
  if (typeof window === 'undefined') return emptyState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as Partial<OverlayState>;
    return { ...emptyState(), ...parsed };
  } catch {
    return emptyState();
  }
}

let state: OverlayState = loadState();
const listeners = new Set<() => void>();

function persist(): void {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
  for (const listener of listeners) listener();
}

function setState(updater: (prev: OverlayState) => OverlayState): void {
  state = updater(state);
  persist();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot(): OverlayState {
  return state;
}

function newId(prefix: string): string {
  const random = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${random}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function appendAudit(entry: Omit<AuditEvent, 'id' | 'created_at'>): void {
  const event: AuditEvent = { ...entry, id: newId('AUD'), created_at: nowIso() };
  setState((prev) => ({ ...prev, auditLog: [event, ...prev.auditLog] }));
}

// ---------------------------------------------------------------------------
// Merged read selectors
// ---------------------------------------------------------------------------

export function mergedSources(): EvidenceSource[] {
  const overlay = state.sources;
  const seen = new Set<string>();
  const merged = canonicalSources.map((s) => {
    seen.add(s.source_id);
    return overlay[s.source_id] ?? s;
  });
  for (const [id, source] of Object.entries(overlay)) {
    if (!seen.has(id)) merged.push(source);
  }
  return merged;
}

export function knownSourceIds(): Set<string> {
  return new Set(mergedSources().map((s) => s.source_id));
}

export function getMergedSource(id: string): EvidenceSource | undefined {
  return mergedSources().find((s) => s.source_id === id);
}

export function mergedClaims(): Claim[] {
  const overlay = state.claims;
  const seen = new Set<string>();
  const merged = canonicalClaims.map((c) => {
    seen.add(c.claim_id);
    return overlay[c.claim_id] ?? c;
  });
  for (const [id, claim] of Object.entries(overlay)) {
    if (!seen.has(id)) merged.push(claim);
  }
  return merged;
}

export function knownClaimIds(): Set<string> {
  return new Set(mergedClaims().map((c) => c.claim_id));
}

export function mergedGap(gapId: string): ResearchGap | undefined {
  const canonical = canonicalGaps.find((g) => g.gap_id === gapId);
  if (!canonical) return undefined;
  const patch = state.gapPatches[gapId];
  return patch ? { ...canonical, ...patch } : canonical;
}

export function mergedTasksForGap(gapId: string): ResearchTask[] {
  const overlay = state.tasks;
  const seen = new Set<string>();
  const merged = canonicalTasks
    .filter((t) => t.gap_id === gapId)
    .map((t) => {
      seen.add(t.task_id);
      return overlay[t.task_id] ?? t;
    });
  for (const [id, task] of Object.entries(overlay)) {
    if (!seen.has(id) && task.gap_id === gapId) merged.push(task);
  }
  return merged;
}

export function isObservationPromoted(observationId: string): boolean {
  return state.promotedObservationIds.includes(observationId);
}

export function listMaskedStakeholders(): MaskedStakeholder[] {
  return Object.values(state.stakeholders)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map((s, index) => maskStakeholder(s, index + 1));
}

export function getMaskedStakeholder(id: string): MaskedStakeholder | undefined {
  const record = state.stakeholders[id];
  if (!record) return undefined;
  const index = listMaskedStakeholders().findIndex((m) => m.stakeholder_id === id);
  return maskStakeholder(record, index + 1);
}

function maskStakeholder(record: StakeholderRecord, ordinal: number): MaskedStakeholder {
  const { full_name, ...rest } = record;
  void full_name;
  return { ...rest, label: `Contact ${ordinal}` };
}

export function ownershipLinksForSubject(objectType: OwnershipLink['object_type'], objectId: string): OwnershipLink[] {
  return Object.values(state.ownershipLinks).filter((l) => l.object_type === objectType && l.object_id === objectId);
}

export function getAuditLog(): readonly AuditEvent[] {
  return state.auditLog;
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function upsertSource(input: NewSourceInput, existingId?: string): { result: ReturnType<typeof validateSourceInput>; source?: EvidenceSource } {
  const result = validateSourceInput(input, knownSourceIds(), existingId);
  if (!result.ok) return { result };

  const id = existingId ?? newId('SRC-LOCAL');
  const before = existingId ? getMergedSource(existingId) : undefined;
  const source: EvidenceSource = {
    source_id: id,
    source_title: input.source_title,
    publisher: input.publisher,
    source_type: input.source_type,
    publication_date_or_year: input.publication_date_or_year ?? '',
    url_or_reference: input.url_or_reference ?? '',
    evidence_scope: input.evidence_scope ?? '',
    last_verified_date: nowIso().slice(0, 10),
    reliability_rating_1_5: input.reliability_rating_1_5,
    notes: input.notes ?? '',
  };
  setState((prev) => ({ ...prev, sources: { ...prev.sources, [id]: source } }));
  appendAudit({
    entity_type: 'source',
    entity_id: id,
    action: existingId ? 'update' : 'create',
    summary: `${existingId ? 'Updated' : 'Created'} evidence source "${source.source_title}"`,
    before,
    after: source,
  });
  return { result, source };
}

export function upsertClaim(input: NewClaimInput, existingId?: string): { result: ReturnType<typeof validateClaimInput>; claim?: Claim } {
  const result = validateClaimInput(input, knownSourceIds());
  if (!result.ok) return { result };

  const id = existingId ?? newId('CLM-LOCAL');
  const before = existingId ? mergedClaims().find((c) => c.claim_id === existingId) : undefined;
  const claim: Claim = {
    claim_id: id,
    subject_type: input.subject_type,
    subject_id: input.subject_id,
    predicate: input.predicate,
    value: input.value,
    claim_status: input.claim_status,
    confidence_score: input.confidence_score,
    confidence_band: input.confidence_score >= 80 ? 'HIGH' : input.confidence_score >= 50 ? 'MEDIUM' : 'LOW',
    date_checked: nowIso().slice(0, 10),
    valid_from: '',
    valid_to: '',
    source_ids: input.source_ids,
    data_classification: input.data_classification,
    notes: input.notes ?? '',
  };
  setState((prev) => ({ ...prev, claims: { ...prev.claims, [id]: claim } }));
  appendAudit({
    entity_type: 'claim',
    entity_id: id,
    action: existingId ? 'update' : 'create',
    summary: `${existingId ? 'Updated' : 'Created'} claim on ${claim.subject_type} ${claim.subject_id}`,
    before,
    after: claim,
  });
  return { result, claim };
}

export function patchGapStatus(
  gapId: string,
  nextStatus: string,
  note: string,
  extra?: { readonly research_owner?: string; readonly resolution_summary?: string },
): ReturnType<typeof validateGapStatusChange> {
  const current = mergedGap(gapId);
  if (!current) return { ok: false, errors: [`Gap ${gapId} does not exist.`] };
  const result = validateGapStatusChange(current.gap_status, nextStatus, extra?.resolution_summary);
  if (!result.ok) return result;

  const before = current;
  const patch: Partial<ResearchGap> = {
    gap_status: nextStatus,
    last_updated_date: nowIso().slice(0, 10),
    ...(extra?.research_owner ? { research_owner: extra.research_owner } : {}),
    ...(extra?.resolution_summary ? { resolution_summary: extra.resolution_summary } : {}),
  };
  setState((prev) => ({ ...prev, gapPatches: { ...prev.gapPatches, [gapId]: { ...prev.gapPatches[gapId], ...patch } } }));
  appendAudit({
    entity_type: 'gap',
    entity_id: gapId,
    action: 'status_change',
    summary: `Gap ${gapId} moved ${before.gap_status} → ${nextStatus}`,
    before,
    after: { ...before, ...patch },
    note,
  });
  return result;
}

export function upsertTask(input: NewTaskInput, existingId?: string): { result: ReturnType<typeof validateTaskInput>; task?: ResearchTask } {
  const result = validateTaskInput(input);
  if (!result.ok) return { result };

  const id = existingId ?? newId('TSK-LOCAL');
  const before = existingId ? mergedTasksForGap(input.gap_id).find((t) => t.task_id === existingId) : undefined;
  const task: ResearchTask = {
    task_id: id,
    gap_id: input.gap_id,
    task_title: input.task_title,
    task_type: input.task_type ?? 'DISCOVERY_AND_VALIDATION',
    status: input.status,
    priority: input.priority ?? '',
    assigned_to: input.assigned_to ?? '',
    next_action: input.next_action ?? '',
    target_date: input.target_date ?? '',
    result_summary: input.result_summary ?? '',
    new_source_ids: [],
    created_date: before?.created_date ?? nowIso().slice(0, 10),
    updated_date: nowIso().slice(0, 10),
  };
  setState((prev) => ({ ...prev, tasks: { ...prev.tasks, [id]: task } }));
  appendAudit({
    entity_type: 'task',
    entity_id: id,
    action: existingId ? 'update' : 'create',
    summary: `${existingId ? 'Updated' : 'Created'} research task "${task.task_title}" on gap ${task.gap_id}`,
    before,
    after: task,
  });
  return { result, task };
}

function upsertStakeholderInternal(input: NewStakeholderInput, existingId?: string): { result: ReturnType<typeof validateStakeholderInput>; id?: string } {
  const result = validateStakeholderInput(input);
  if (!result.ok) return { result };

  const id = existingId ?? newId('STK-LOCAL');
  const record: StakeholderRecord = {
    stakeholder_id: id,
    full_name: input.full_name,
    title: input.title ?? '',
    department_or_cluster: input.department_or_cluster ?? '',
    seniority: input.seniority ?? '',
    current_status: 'ACTIVE',
    mandate_summary: input.mandate_summary ?? '',
    linkedin_url: input.linkedin_url ?? '',
    evidence_status: 'WORKING_HYPOTHESIS',
    confidence_score: 50,
    source_ids: input.source_ids ?? [],
    data_classification: input.data_classification,
    notes: input.notes ?? '',
    created_at: state.stakeholders[id]?.created_at ?? nowIso(),
    updated_at: nowIso(),
  };
  setState((prev) => ({ ...prev, stakeholders: { ...prev.stakeholders, [id]: record } }));
  appendAudit({
    entity_type: 'stakeholder',
    entity_id: id,
    action: existingId ? 'update' : 'create',
    summary: `${existingId ? 'Updated' : 'Created'} contact record (name withheld from this log — pre-authentication UI)`,
    before: undefined,
    after: { stakeholder_id: id, data_classification: record.data_classification },
  });
  return { result, id };
}

export function upsertOwnershipLink(input: NewOwnershipLinkInput, existingId?: string): { result: ReturnType<typeof validateOwnershipLinkInput>; link?: OwnershipLink } {
  const result = validateOwnershipLinkInput(input);
  if (!result.ok) return { result };

  let stakeholderId = input.stakeholder_id;
  if (!stakeholderId && input.new_stakeholder) {
    const created = upsertStakeholderInternal(input.new_stakeholder);
    if (!created.result.ok) return { result: created.result };
    stakeholderId = created.id;
  }
  if (!stakeholderId) return { result: { ok: false, errors: ['No contact selected or created.'] } };

  const id = existingId ?? newId('OWN-LOCAL');
  const before = existingId ? state.ownershipLinks[existingId] : undefined;
  const link: OwnershipLink = {
    ownership_link_id: id,
    stakeholder_id: stakeholderId,
    object_type: input.object_type,
    object_id: input.object_id,
    owner_role: input.owner_role,
    status: input.status,
    confidence_score: input.confidence_score,
    source_ids: input.source_ids ?? [],
    notes: input.notes ?? '',
    created_at: before?.created_at ?? nowIso(),
    updated_at: nowIso(),
  };
  setState((prev) => ({ ...prev, ownershipLinks: { ...prev.ownershipLinks, [id]: link } }));
  appendAudit({
    entity_type: 'ownership_link',
    entity_id: id,
    action: existingId ? 'update' : 'create',
    summary: `${existingId ? 'Updated' : 'Created'} ownership hypothesis: ${link.owner_role} on ${link.object_type} ${link.object_id}`,
    before,
    after: link,
  });
  return { result, link };
}

export function promoteObservation(input: PromotionInput): { result: ReturnType<typeof validatePromotionInput>; claimId?: string } {
  const observation = canonicalObservations.find((o) => o.observation_id === input.observation_id);
  if (!observation) return { result: { ok: false, errors: [`Observation ${input.observation_id} does not exist.`] } };

  const result = validatePromotionInput(input, knownSourceIds(), knownClaimIds());
  if (!result.ok) return { result };

  let claimId = input.claim_id;
  if (!claimId && input.new_claim) {
    const created = upsertClaim(input.new_claim);
    if (!created.result.ok) return { result: created.result };
    claimId = created.claim?.claim_id;
  }
  if (!claimId) return { result: { ok: false, errors: ['No supporting claim linked or created.'] } };

  setState((prev) => ({ ...prev, promotedObservationIds: [...prev.promotedObservationIds, input.observation_id] }));
  appendAudit({
    entity_type: 'promotion',
    entity_id: input.observation_id,
    action: 'promote',
    summary: `Promoted observation "${observation.technology_name}" on ${observation.mapped_component_id} using claim ${claimId}`,
    before: { observation_id: input.observation_id, promoted: false },
    after: { observation_id: input.observation_id, promoted: true, claim_id: claimId },
    note: input.note,
  });
  return { result, claimId };
}

function sourceInputFromRow(row: Record<string, string>): NewSourceInput {
  return {
    source_title: row.source_title ?? '',
    publisher: row.publisher ?? '',
    source_type: row.source_type ?? '',
    publication_date_or_year: row.publication_date_or_year,
    url_or_reference: row.url_or_reference,
    evidence_scope: row.evidence_scope,
    reliability_rating_1_5: Number(row.reliability_rating_1_5 ?? 0),
    data_classification: (row.data_classification as NewSourceInput['data_classification']) || 'INTERNAL',
    notes: row.notes,
  };
}

function claimInputFromRow(row: Record<string, string>): NewClaimInput {
  return {
    subject_type: (row.subject_type as NewClaimInput['subject_type']) || 'COMPONENT',
    subject_id: row.subject_id ?? '',
    predicate: row.predicate ?? '',
    value: row.value ?? '',
    claim_status: row.claim_status ?? '',
    confidence_score: Number(row.confidence_score ?? 0),
    source_ids: (row.source_ids ?? '').split(';').map((s) => s.trim()).filter(Boolean),
    data_classification: (row.data_classification as NewClaimInput['data_classification']) || 'INTERNAL',
    notes: row.notes,
  };
}

/** Dry-run validation only — no mutation, no audit entry. Used for the CSV import preview table. */
export function previewImportRows(kind: 'sources' | 'claims', rows: readonly Record<string, string>[]): readonly ImportRowResult[] {
  return rows.map((row, rowIndex) => {
    const validation =
      kind === 'sources' ? validateSourceInput(sourceInputFromRow(row), knownSourceIds()) : validateClaimInput(claimInputFromRow(row), knownSourceIds());
    return { rowIndex, ok: validation.ok, errors: validation.errors };
  });
}

export function importRows(kind: 'sources' | 'claims', rows: readonly Record<string, string>[]): ImportResult {
  const rowResults: ImportRowResult[] = rows.map((row, rowIndex) => {
    if (kind === 'sources') {
      const input = sourceInputFromRow(row);
      const validation = validateSourceInput(input, knownSourceIds());
      if (!validation.ok) return { rowIndex, ok: false, errors: validation.errors };
      const { source } = upsertSource(input);
      return { rowIndex, ok: true, errors: [], id: source?.source_id };
    }
    const input = claimInputFromRow(row);
    const validation = validateClaimInput(input, knownSourceIds());
    if (!validation.ok) return { rowIndex, ok: false, errors: validation.errors };
    const { claim } = upsertClaim(input);
    return { rowIndex, ok: true, errors: [], id: claim?.claim_id };
  });

  const importedCount = rowResults.filter((r) => r.ok).length;
  const importResult: ImportResult = { kind, rows: rowResults, importedCount, skippedCount: rowResults.length - importedCount };
  appendAudit({
    entity_type: 'import',
    entity_id: newId('IMPORT'),
    action: 'import',
    summary: `CSV import of ${kind}: ${importedCount} imported, ${importResult.skippedCount} skipped`,
    before: undefined,
    after: importResult,
  });
  return importResult;
}

export function resetOverlay(): void {
  state = emptyState();
  persist();
}
