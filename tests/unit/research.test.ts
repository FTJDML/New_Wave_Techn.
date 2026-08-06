import { beforeEach, describe, expect, it } from 'vitest';
import {
  validateSourceInput,
  validateClaimInput,
  validateGapStatusChange,
  validateOwnershipLinkInput,
  validatePromotionInput,
  getAllowedGapTransitions,
} from '../../src/research/validation';
import {
  upsertSource,
  upsertClaim,
  patchGapStatus,
  upsertTask,
  upsertOwnershipLink,
  promoteObservation,
  importRows,
  previewImportRows,
  mergedSources,
  mergedClaims,
  mergedGap,
  mergedTasksForGap,
  listMaskedStakeholders,
  getMaskedStakeholder,
  ownershipLinksForSubject,
  isObservationPromoted,
  getAuditLog,
  resetOverlay,
  knownSourceIds,
} from '../../src/research/store';
import { researchGaps, technicalObservations } from '../../src/data/fullCatalogue';

beforeEach(() => {
  resetOverlay();
});

describe('validateSourceInput', () => {
  it('rejects a source missing required fields', () => {
    const result = validateSourceInput(
      { source_title: '', publisher: '', source_type: 'NOT_A_TYPE', reliability_rating_1_5: 9, data_classification: 'INTERNAL' },
      new Set(),
    );
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('accepts a well-formed source', () => {
    const result = validateSourceInput(
      { source_title: 'A title', publisher: 'A publisher', source_type: 'FIRST_PARTY', reliability_rating_1_5: 4, data_classification: 'INTERNAL' },
      new Set(),
    );
    expect(result.ok).toBe(true);
  });
});

describe('validateClaimInput', () => {
  it('rejects a claim whose subject does not resolve', () => {
    const result = validateClaimInput(
      {
        subject_type: 'COMPONENT',
        subject_id: 'CMP-DOES-NOT-EXIST',
        predicate: 'X',
        value: 'A claim',
        claim_status: 'SUPPORTED',
        confidence_score: 80,
        source_ids: ['SRC-1'],
        data_classification: 'INTERNAL',
      },
      new Set(['SRC-1']),
    );
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('does not resolve'))).toBe(true);
  });

  it('rejects a claim citing an unknown source', () => {
    const result = validateClaimInput(
      {
        subject_type: 'COMPONENT',
        subject_id: 'CMP-CTAC-XV',
        predicate: 'X',
        value: 'A claim',
        claim_status: 'SUPPORTED',
        confidence_score: 80,
        source_ids: ['SRC-UNKNOWN'],
        data_classification: 'INTERNAL',
      },
      new Set(['SRC-1']),
    );
    expect(result.ok).toBe(false);
  });
});

describe('gap status transitions', () => {
  it('allows OPEN to RESEARCHING', () => {
    expect(validateGapStatusChange('OPEN', 'RESEARCHING').ok).toBe(true);
  });

  it('rejects OPEN directly to RESOLVED', () => {
    const result = validateGapStatusChange('OPEN', 'RESOLVED', 'because');
    expect(result.ok).toBe(false);
  });

  it('requires a resolution summary to resolve', () => {
    const result = validateGapStatusChange('VALIDATING', 'RESOLVED');
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('resolution summary'))).toBe(true);
  });

  it('exposes no further transitions once resolved', () => {
    expect(getAllowedGapTransitions('RESOLVED')).toEqual([]);
  });
});

describe('validateOwnershipLinkInput', () => {
  it('requires either an existing or a new contact', () => {
    const result = validateOwnershipLinkInput({ object_type: 'DOMAIN', object_id: 'DOM-STORE', owner_role: 'BUSINESS_OWNER', status: 'HYPOTHESIS', confidence_score: 50 });
    expect(result.ok).toBe(false);
  });

  it('rejects an object id that does not resolve', () => {
    const result = validateOwnershipLinkInput({
      new_stakeholder: { full_name: 'Test Person', data_classification: 'INTERNAL_CONFIDENTIAL' },
      object_type: 'COMPONENT',
      object_id: 'CMP-DOES-NOT-EXIST',
      owner_role: 'BUSINESS_OWNER',
      status: 'HYPOTHESIS',
      confidence_score: 50,
    });
    expect(result.ok).toBe(false);
  });
});

describe('validatePromotionInput', () => {
  it('requires a justification note', () => {
    const result = validatePromotionInput({ observation_id: 'OBS-1', claim_id: 'CLM-1', note: '' }, new Set(), new Set(['CLM-1']));
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('justification'))).toBe(true);
  });
});

describe('store: sources and claims', () => {
  it('creates a source and makes it immediately readable via mergedSources', () => {
    const { result, source } = upsertSource({
      source_title: 'New source',
      publisher: 'Me',
      source_type: 'FIRST_PARTY',
      reliability_rating_1_5: 3,
      data_classification: 'INTERNAL',
    });
    expect(result.ok).toBe(true);
    expect(source).toBeDefined();
    expect(mergedSources().some((s) => s.source_id === source!.source_id)).toBe(true);
  });

  it('edits an existing canonical source without duplicating it', () => {
    const canonicalId = mergedSources()[0].source_id;
    const { result } = upsertSource(
      { source_title: 'Edited title', publisher: 'Edited publisher', source_type: 'FIRST_PARTY', reliability_rating_1_5: 5, data_classification: 'INTERNAL' },
      canonicalId,
    );
    expect(result.ok).toBe(true);
    const merged = mergedSources();
    expect(merged.filter((s) => s.source_id === canonicalId)).toHaveLength(1);
    expect(merged.find((s) => s.source_id === canonicalId)?.source_title).toBe('Edited title');
  });

  it('creates a claim that cites a known source', () => {
    const sourceId = mergedSources()[0].source_id;
    const { result, claim } = upsertClaim({
      subject_type: 'COMPONENT',
      subject_id: 'CMP-CTAC-XV',
      predicate: 'TEST',
      value: 'A test claim',
      claim_status: 'WORKING_HYPOTHESIS',
      confidence_score: 60,
      source_ids: [sourceId],
      data_classification: 'INTERNAL',
    });
    expect(result.ok).toBe(true);
    expect(mergedClaims().some((c) => c.claim_id === claim!.claim_id)).toBe(true);
  });

  it('appends an audit entry for every source and claim mutation', () => {
    const before = getAuditLog().length;
    upsertSource({ source_title: 'X', publisher: 'Y', source_type: 'FIRST_PARTY', reliability_rating_1_5: 3, data_classification: 'INTERNAL' });
    expect(getAuditLog().length).toBe(before + 1);
  });
});

describe('store: gap status and tasks', () => {
  it('moves a gap through its workflow and blocks an invalid jump', () => {
    const gap = researchGaps[0];
    const step1 = patchGapStatus(gap.gap_id, 'RESEARCHING', 'starting research');
    expect(step1.ok).toBe(true);
    expect(mergedGap(gap.gap_id)?.gap_status).toBe('RESEARCHING');

    const invalid = patchGapStatus(gap.gap_id, 'RESOLVED', 'skip ahead');
    expect(invalid.ok).toBe(false);
    expect(mergedGap(gap.gap_id)?.gap_status).toBe('RESEARCHING');
  });

  it('resolves a gap only with a resolution summary', () => {
    const gap = researchGaps[1];
    patchGapStatus(gap.gap_id, 'RESEARCHING', 'go');
    patchGapStatus(gap.gap_id, 'VALIDATING', 'go');
    const withoutSummary = patchGapStatus(gap.gap_id, 'RESOLVED', 'go');
    expect(withoutSummary.ok).toBe(false);
    const withSummary = patchGapStatus(gap.gap_id, 'RESOLVED', 'go', { resolution_summary: 'Found the vendor.' });
    expect(withSummary.ok).toBe(true);
    expect(mergedGap(gap.gap_id)?.gap_status).toBe('RESOLVED');
  });

  it('creates a research task under a gap', () => {
    const gap = researchGaps[2];
    const { result, task } = upsertTask({ gap_id: gap.gap_id, task_title: 'Do the thing', status: 'BACKLOG' });
    expect(result.ok).toBe(true);
    expect(mergedTasksForGap(gap.gap_id).some((t) => t.task_id === task!.task_id)).toBe(true);
  });
});

describe('store: ownership hypotheses never expose a stakeholder name', () => {
  it('creates a masked contact whose label never contains the real name', () => {
    const secretName = 'Zzyzx Confidential Person';
    const { result, link } = upsertOwnershipLink({
      new_stakeholder: { full_name: secretName, title: 'CTO', data_classification: 'INTERNAL_CONFIDENTIAL' },
      object_type: 'DOMAIN',
      object_id: researchGaps[0].domain_id,
      owner_role: 'TECHNOLOGY_OWNER_OR_MANAGER',
      status: 'HYPOTHESIS',
      confidence_score: 70,
    });
    expect(result.ok).toBe(true);
    expect(link).toBeDefined();

    const masked = getMaskedStakeholder(link!.stakeholder_id);
    expect(masked).toBeDefined();
    expect(masked).not.toHaveProperty('full_name');
    expect(JSON.stringify(masked)).not.toContain(secretName);
    expect(masked!.label).not.toContain(secretName);

    const allMasked = listMaskedStakeholders();
    expect(JSON.stringify(allMasked)).not.toContain(secretName);

    const links = ownershipLinksForSubject('DOMAIN', researchGaps[0].domain_id);
    expect(links.some((l) => l.ownership_link_id === link!.ownership_link_id)).toBe(true);

    const auditText = JSON.stringify(getAuditLog());
    expect(auditText).not.toContain(secretName);
  });
});

describe('store: observation promotion', () => {
  it('never promotes without a justification note or a supporting claim', () => {
    const observation = technicalObservations[0];
    const missingNote = promoteObservation({ observation_id: observation.observation_id, claim_id: 'CLM-0001', note: '' });
    expect(missingNote.result.ok).toBe(false);
    expect(isObservationPromoted(observation.observation_id)).toBe(false);
  });

  it('promotes once a claim and note are provided', () => {
    const observation = technicalObservations[0];
    const outcome = promoteObservation({ observation_id: observation.observation_id, claim_id: 'CLM-0001', note: 'Confirmed via job posting.' });
    expect(outcome.result.ok).toBe(true);
    expect(isObservationPromoted(observation.observation_id)).toBe(true);
  });
});

describe('store: CSV import', () => {
  const rows = [
    { source_title: 'Imported Source', publisher: 'Pub', source_type: 'FIRST_PARTY', reliability_rating_1_5: '4', data_classification: 'INTERNAL' },
    { source_title: '', publisher: '', source_type: 'NOT_REAL', reliability_rating_1_5: '9', data_classification: 'INTERNAL' },
  ];

  it('previews without mutating anything', () => {
    const beforeCount = mergedSources().length;
    const preview = previewImportRows('sources', rows);
    expect(preview).toHaveLength(2);
    expect(preview[0].ok).toBe(true);
    expect(preview[1].ok).toBe(false);
    expect(mergedSources().length).toBe(beforeCount);
  });

  it('imports only the valid rows and logs the batch', () => {
    const beforeCount = mergedSources().length;
    const result = importRows('sources', rows);
    expect(result.importedCount).toBe(1);
    expect(result.skippedCount).toBe(1);
    expect(mergedSources().length).toBe(beforeCount + 1);
    expect(getAuditLog().some((e) => e.entity_type === 'import')).toBe(true);
  });
});

describe('knownSourceIds', () => {
  it('reflects both canonical and newly created sources', () => {
    const before = knownSourceIds();
    const { source } = upsertSource({ source_title: 'Z', publisher: 'Z', source_type: 'FIRST_PARTY', reliability_rating_1_5: 3, data_classification: 'INTERNAL' });
    const after = knownSourceIds();
    expect(after.size).toBe(before.size + 1);
    expect(after.has(source!.source_id)).toBe(true);
  });
});
