import { describe, expect, it } from 'vitest';
import { buildStakeholderView, type OwnershipLinkRow, type StakeholderRow } from '../../src/lib/stakeholderView';

const stakeholder = (overrides: Partial<StakeholderRow> = {}): StakeholderRow => ({
  id: 'STK-1',
  full_name: 'Jane Doe',
  job_title: 'CIO',
  function_area: 'IT',
  linkedin_url: null,
  classification: 'private',
  confidence_score: 80,
  notes: null,
  ...overrides,
});

const ownershipLink = (overrides: Partial<OwnershipLinkRow> = {}): OwnershipLinkRow => ({
  id: 'OWN-1',
  stakeholder_id: 'STK-1',
  subject_type: 'DOMAIN',
  subject_id: 'DOM-COMMERCE',
  ownership_role: 'EXECUTIVE_SPONSOR',
  status: 'confirmed',
  confidence_score: 70,
  notes: null,
  ...overrides,
});

describe('buildStakeholderView', () => {
  it('sorts stakeholders alphabetically by full name', () => {
    const view = buildStakeholderView([stakeholder({ id: 'STK-1', full_name: 'Zoe Zebra' }), stakeholder({ id: 'STK-2', full_name: 'Amy Apple' })], []);
    expect(view.map((s) => s.fullName)).toEqual(['Amy Apple', 'Zoe Zebra']);
  });

  it('attaches only the ownership links belonging to each stakeholder', () => {
    const view = buildStakeholderView(
      [stakeholder({ id: 'STK-1' }), stakeholder({ id: 'STK-2', full_name: 'Other Person' })],
      [ownershipLink({ id: 'OWN-1', stakeholder_id: 'STK-1' }), ownershipLink({ id: 'OWN-2', stakeholder_id: 'STK-2' })],
    );
    const stk1 = view.find((s) => s.id === 'STK-1');
    expect(stk1?.ownershipLinks.map((l) => l.id)).toEqual(['OWN-1']);
  });

  it('resolves a DOMAIN subject to its real domain name via the public catalogue', () => {
    const view = buildStakeholderView([stakeholder()], [ownershipLink({ subject_type: 'DOMAIN', subject_id: 'DOM-COMMERCE' })]);
    expect(view[0].ownershipLinks[0].subjectLabel).toBe('Commerce & Customer');
  });

  it('resolves a COMPONENT subject to its real system display name', () => {
    const view = buildStakeholderView([stakeholder()], [ownershipLink({ subject_type: 'COMPONENT', subject_id: 'CMP-CHANNEL-STORES' })]);
    expect(view[0].ownershipLinks[0].subjectLabel).toBe('Stores & self-checkout');
  });

  it('falls back to a placeholder label for an unresolvable subject id', () => {
    const view = buildStakeholderView([stakeholder()], [ownershipLink({ subject_type: 'DOMAIN', subject_id: 'DOM-DOES-NOT-EXIST' })]);
    expect(view[0].ownershipLinks[0].subjectLabel).toContain('Unknown domain');
  });

  it('falls back to "type id" for a subject type it does not recognize', () => {
    const view = buildStakeholderView([stakeholder()], [ownershipLink({ subject_type: 'GAP', subject_id: 'GAP-001' })]);
    expect(view[0].ownershipLinks[0].subjectLabel).toBe('GAP GAP-001');
  });

  it('formats a SCREAMING_SNAKE_CASE ownership role into readable title case', () => {
    const view = buildStakeholderView([stakeholder()], [ownershipLink({ ownership_role: 'TECHNOLOGY_OWNER_OR_MANAGER' })]);
    expect(view[0].ownershipLinks[0].ownershipRole).toBe('Technology Owner Or Manager');
  });

  it('carries through every stakeholder field, including classification and confidence', () => {
    const view = buildStakeholderView([stakeholder({ classification: 'restricted', confidence_score: 55, notes: 'x' })], []);
    expect(view[0]).toMatchObject({ classification: 'restricted', confidenceScore: 55, notes: 'x' });
  });
});
