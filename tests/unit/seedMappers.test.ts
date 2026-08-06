import { describe, expect, it } from 'vitest';
import {
  mapClassification,
  mapVendor,
  mapSystem,
  mapCapability,
  mapSystemCapability,
  mapCommercialRelationship,
  mapEvidenceSource,
  mapClaim,
  mapTechnicalObservation,
  mapGap,
  mapResearchTask,
  mapProgramme,
  mapStakeholder,
  mapOwnershipLink,
  mapArchitectureRelationship,
  extractGapSystems,
  extractClaimSources,
  extractSystemSources,
  extractArchitectureRelationshipSources,
  extractCommercialRelationshipSystems,
  extractProgrammeSystems,
} from '../../supabase/seed/mappers';

describe('mapClassification', () => {
  it('maps every known classification string to its Postgres tier', () => {
    expect(mapClassification('PUBLIC')).toBe('public');
    expect(mapClassification('INTERNAL')).toBe('internal');
    expect(mapClassification('INTERNAL_CONFIDENTIAL')).toBe('private');
    expect(mapClassification('RESTRICTED')).toBe('restricted');
    expect(mapClassification('PRIVATE_SOURCE')).toBe('restricted');
  });

  it('is case-insensitive', () => {
    expect(mapClassification('public')).toBe('public');
    expect(mapClassification('Restricted')).toBe('restricted');
  });

  it('defaults unknown or missing values to internal', () => {
    expect(mapClassification(undefined)).toBe('internal');
    expect(mapClassification(null)).toBe('internal');
    expect(mapClassification('')).toBe('internal');
    expect(mapClassification('NOT_A_REAL_TIER')).toBe('internal');
  });
});

describe('mapVendor', () => {
  it('maps core fields and falls back to null for absent optional fields', () => {
    const row = mapVendor({ vendor_id: 'VEN-1', vendor_name: 'Acme Corp' }, {});
    expect(row).toEqual({
      id: 'VEN-1',
      name: 'Acme Corp',
      category: null,
      website_url: null,
      logo_strategy: null,
      logo_value: null,
      relationship_summary: null,
    });
  });

  it('prefers the logo registry entry over the vendor record logo_slug', () => {
    const row = mapVendor(
      { vendor_id: 'VEN-2', vendor_name: 'Beta Inc', logo_slug: 'beta-fallback' },
      { 'VEN-2': { strategy: 'brand-asset', slug: 'beta-real' } },
    );
    expect(row.logo_strategy).toBe('brand-asset');
    expect(row.logo_value).toBe('beta-real');
  });

  it('derives simple-icons strategy from a bare logo_slug when the registry has no entry', () => {
    const row = mapVendor({ vendor_id: 'VEN-3', vendor_name: 'Gamma LLC', logo_slug: 'gamma' }, {});
    expect(row.logo_strategy).toBe('simple-icons');
    expect(row.logo_value).toBe('gamma');
  });

  it('maps category, website and relationship summary when present', () => {
    const row = mapVendor(
      {
        vendor_id: 'VEN-4',
        vendor_name: 'Delta',
        vendor_category: 'ERP',
        website_url: 'https://delta.example',
        action_relationship_summary: 'Long-standing supplier',
      },
      {},
    );
    expect(row.category).toBe('ERP');
    expect(row.website_url).toBe('https://delta.example');
    expect(row.relationship_summary).toBe('Long-standing supplier');
  });
});

describe('mapSystem', () => {
  it('maps a typical component to a system row, lowercasing status fields', () => {
    const row = mapSystem({
      component_id: 'SYS-1',
      display_name: 'Order Management',
      domain_id: 'DOM-COMMERCE',
      architecture_role: 'CORE',
      deployment_status: 'LIVE',
      evidence_status: 'CONFIRMED',
      confidence_score: '85',
      first_known_year: 2015,
      last_verified_date: '2025-01-01',
    });
    expect(row.id).toBe('SYS-1');
    expect(row.name).toBe('Order Management');
    expect(row.deployment_status).toBe('live');
    expect(row.evidence_status).toBe('confirmed');
    expect(row.confidence_score).toBe(85);
    expect(row.first_known_year).toBe(2015);
    expect(row.classification).toBe('internal');
  });

  it('falls back to component_id for name and DOM-UNKNOWN for domain when absent', () => {
    const row = mapSystem({ component_id: 'SYS-2' });
    expect(row.name).toBe('SYS-2');
    expect(row.domain_id).toBe('DOM-UNKNOWN');
    expect(row.architecture_role).toBe('unknown');
    expect(row.deployment_status).toBe('unknown');
  });

  it('classifies a privately-confirmed system as private', () => {
    const row = mapSystem({ component_id: 'SYS-3', evidence_status: 'PRIVATE_CONFIRMATION' });
    expect(row.classification).toBe('private');
  });

  it('never reads any stakeholder-name field — systems carry no such field in the schema', () => {
    const row = mapSystem({ component_id: 'SYS-4', target_stakeholders_or_sources: 'Jane Doe, Confidential Contact' });
    expect(JSON.stringify(row)).not.toContain('Jane Doe');
  });
});

describe('mapCapability', () => {
  it('maps a capability record', () => {
    const row = mapCapability({ capability_id: 'CAP-1', capability_name: 'Order Capture', domain_id: 'DOM-COMMERCE', description: 'Captures orders' });
    expect(row).toEqual({ id: 'CAP-1', name: 'Order Capture', domain_id: 'DOM-COMMERCE', description: 'Captures orders' });
  });

  it('nulls out an absent description', () => {
    const row = mapCapability({ capability_id: 'CAP-2', capability_name: 'Returns', domain_id: 'DOM-COMMERCE' });
    expect(row.description).toBeNull();
  });
});

describe('mapSystemCapability', () => {
  it('marks PRIMARY relationship_type as is_primary', () => {
    const row = mapSystemCapability({ component_id: 'SYS-1', capability_id: 'CAP-1', relationship_type: 'PRIMARY' });
    expect(row.is_primary).toBe(true);
  });

  it('treats any other or absent relationship_type as not primary', () => {
    expect(mapSystemCapability({ component_id: 'SYS-1', capability_id: 'CAP-1', relationship_type: 'SECONDARY' }).is_primary).toBe(false);
    expect(mapSystemCapability({ component_id: 'SYS-1', capability_id: 'CAP-1' }).is_primary).toBe(false);
  });
});

describe('mapCommercialRelationship', () => {
  it('maps a full relationship record, lowercasing status-like fields', () => {
    const row = mapCommercialRelationship({
      relationship_id: 'REL-1',
      vendor_id: 'VEN-1',
      relationship_type: 'LICENSE',
      start_year: 2010,
      start_precision: 'EXACT',
      evidence_status: 'CONFIRMED',
      confidence_score: 90,
    });
    expect(row.id).toBe('REL-1');
    expect(row.vendor_id).toBe('VEN-1');
    expect(row.start_precision).toBe('exact');
    expect(row.evidence_status).toBe('confirmed');
    expect(row.confidence_score).toBe(90);
    expect(row.classification).toBe('internal');
  });

  it('defaults relationship_type and start_precision when absent', () => {
    const row = mapCommercialRelationship({ relationship_id: 'REL-2', vendor_id: 'VEN-1' });
    expect(row.relationship_type).toBe('unknown');
    expect(row.start_precision).toBe('unknown');
    expect(row.evidence_status).toBeNull();
  });
});

describe('mapEvidenceSource', () => {
  it('maps a public source and derives publication_date from a bare year', () => {
    const row = mapEvidenceSource({
      source_id: 'SRC-1',
      source_title: 'Vendor press release',
      source_type: 'PRESS_RELEASE',
      publication_date_or_year: 2022,
    });
    expect(row.id).toBe('SRC-1');
    expect(row.publication_date).toBe('2022-01-01');
    expect(row.classification).toBe('internal');
  });

  it('classifies a PRIVATE_SOURCE as restricted', () => {
    const row = mapEvidenceSource({ source_id: 'SRC-2', source_title: 'Confidential interview', source_type: 'PRIVATE_SOURCE' });
    expect(row.classification).toBe('restricted');
  });

  it('folds evidence_scope into notes rather than dropping it', () => {
    const row = mapEvidenceSource({ source_id: 'SRC-3', source_title: 'Report', source_type: 'REPORT', evidence_scope: 'covers EU only', notes: 'also see appendix' });
    expect(row.notes).toBe('covers EU only | also see appendix');
  });

  it('uses notes alone when evidence_scope is absent, and null when both are absent', () => {
    expect(mapEvidenceSource({ source_id: 'SRC-4', source_title: 'Report', source_type: 'REPORT', notes: 'x' }).notes).toBe('x');
    expect(mapEvidenceSource({ source_id: 'SRC-5', source_title: 'Report', source_type: 'REPORT' }).notes).toBeNull();
  });
});

describe('mapClaim', () => {
  it('maps a claim record and its classification', () => {
    const row = mapClaim({
      claim_id: 'CLM-1',
      subject_type: 'system',
      subject_id: 'SYS-1',
      predicate: 'hosts',
      value: 'AWS',
      claim_status: 'confirmed',
      confidence_score: 70,
      data_classification: 'RESTRICTED',
    });
    expect(row.id).toBe('CLM-1');
    expect(row.status).toBe('confirmed');
    expect(row.confidence_score).toBe(70);
    expect(row.classification).toBe('restricted');
  });
});

describe('mapTechnicalObservation', () => {
  it('maps an observation and coerces direct_contract_inference_allowed to boolean', () => {
    const row = mapTechnicalObservation({
      observation_id: 'OBS-1',
      technology_name: 'nginx',
      mapped_component_id: 'SYS-1',
      direct_contract_inference_allowed: 'true',
    });
    expect(row.id).toBe('OBS-1');
    expect(row.mapped_system_id).toBe('SYS-1');
    expect(row.direct_contract_inference_allowed).toBe(true);
  });

  it('defaults direct_contract_inference_allowed to false when absent', () => {
    const row = mapTechnicalObservation({ observation_id: 'OBS-2', technology_name: 'apache' });
    expect(row.direct_contract_inference_allowed).toBe(false);
  });
});

describe('mapGap', () => {
  it('maps a gap record end to end', () => {
    const row = mapGap({
      gap_id: 'GAP-1',
      gap_title: 'Unknown integration pattern',
      domain_id: 'DOM-COMMERCE',
      research_question: 'How do these systems talk?',
      priority: 'P1',
      gap_status: 'RESOLVED',
      last_updated_date: '2025-06-01',
      resolution_summary: 'Confirmed via vendor interview',
    });
    expect(row.id).toBe('GAP-1');
    expect(row.status).toBe('resolved');
    expect(row.resolved_at).toBe('2025-06-01');
    expect(row.resolution_summary).toBe('Confirmed via vendor interview');
  });

  it('only sets resolved_at when status is resolved', () => {
    const row = mapGap({ gap_id: 'GAP-2', research_question: 'q', gap_status: 'OPEN', last_updated_date: '2025-06-01' });
    expect(row.resolved_at).toBeNull();
  });

  it('defaults domain_id, priority and status when absent', () => {
    const row = mapGap({ gap_id: 'GAP-3', research_question: 'q' });
    expect(row.domain_id).toBe('DOM-UNKNOWN');
    expect(row.priority).toBe('P3');
    expect(row.status).toBe('open');
  });

  it('never surfaces target_stakeholders_or_sources content anywhere in the mapped row', () => {
    const row = mapGap({
      gap_id: 'GAP-4',
      research_question: 'q',
      target_stakeholders_or_sources: 'Jane Doe (jane@example.com), Confidential Contact at Vendor X',
    });
    const serialized = JSON.stringify(row);
    expect(serialized).not.toContain('Jane Doe');
    expect(serialized).not.toContain('Confidential Contact');
  });
});

describe('mapResearchTask', () => {
  it('joins task_type and next_action into description', () => {
    const row = mapResearchTask({ task_id: 'TASK-1', task_title: 'Confirm hosting', task_type: 'INTERVIEW', next_action: 'Schedule call' });
    expect(row.description).toBe('INTERVIEW — Schedule call');
  });

  it('produces a null description when both parts are absent', () => {
    const row = mapResearchTask({ task_id: 'TASK-2', task_title: 'Follow up' });
    expect(row.description).toBeNull();
  });

  it('lowercases status and defaults it to open', () => {
    expect(mapResearchTask({ task_id: 'TASK-3', task_title: 't', status: 'IN_PROGRESS' }).status).toBe('in_progress');
    expect(mapResearchTask({ task_id: 'TASK-4', task_title: 't' }).status).toBe('open');
  });
});

describe('mapProgramme', () => {
  it('builds a timeline string from start/target dates', () => {
    const row = mapProgramme({ programme_id: 'PROG-1', programme_name: 'Cloud Migration', start_date_or_year: 2023, target_date_or_year: 2026 });
    expect(row.timeline).toBe('2023 → 2026');
  });

  it('uses ? placeholders when only one side of the timeline is known', () => {
    const row = mapProgramme({ programme_id: 'PROG-2', programme_name: 'X', start_date_or_year: 2023 });
    expect(row.timeline).toBe('2023 → ?');
  });

  it('leaves timeline null when neither date is known', () => {
    const row = mapProgramme({ programme_id: 'PROG-3', programme_name: 'X' });
    expect(row.timeline).toBeNull();
  });

  it('falls back to business_outcome for scope when description is absent', () => {
    const row = mapProgramme({ programme_id: 'PROG-4', programme_name: 'X', business_outcome: 'Reduce cost' });
    expect(row.scope).toBe('Reduce cost');
  });
});

describe('mapStakeholder', () => {
  it('maps identifying and contact fields, and always nulls out email', () => {
    const row = mapStakeholder({
      stakeholder_id: 'STK-1',
      full_name: 'Jane Doe',
      title: 'CIO',
      department_or_cluster: 'IT',
      linkedin_url: 'https://linkedin.com/in/janedoe',
      email: 'jane@example.com',
      source_ids: ['SRC-1', 'SRC-2'],
    });
    expect(row.id).toBe('STK-1');
    expect(row.full_name).toBe('Jane Doe');
    expect(row.job_title).toBe('CIO');
    expect(row.function_area).toBe('IT');
    expect(row.email).toBeNull();
    expect(row.source_id).toBe('SRC-1');
  });

  it('folds seniority, current_status and mandate_summary into notes', () => {
    const row = mapStakeholder({
      stakeholder_id: 'STK-2',
      full_name: 'John Roe',
      seniority: 'Senior',
      current_status: 'Active',
      mandate_summary: 'Owns the ERP roadmap',
    });
    expect(row.notes).toBe('Seniority: Senior | Status: Active | Owns the ERP roadmap');
  });

  it('defaults classification to private, not the schema-generic internal', () => {
    const row = mapStakeholder({ stakeholder_id: 'STK-3', full_name: 'No Classification Given' });
    expect(row.classification).toBe('private');
  });

  it('respects an explicit non-internal classification', () => {
    const row = mapStakeholder({ stakeholder_id: 'STK-4', full_name: 'Restricted Person', data_classification: 'RESTRICTED' });
    expect(row.classification).toBe('restricted');
  });
});

describe('mapArchitectureRelationship', () => {
  it('maps an edge record, splitting the semicolon-delimited data_objects string', () => {
    const row = mapArchitectureRelationship({
      edge_id: 'EDGE-1',
      from_component_id: 'SYS-1',
      to_component_id: 'SYS-2',
      direction: 'FORWARD',
      relationship_type: 'integration',
      integration_pattern: 'API',
      data_objects: 'basket; price; receipt',
      frequency: 'REAL_TIME',
      integration_status: 'CONFIRMED',
      confidence_score: 98,
      is_missing_link: false,
    });
    expect(row.id).toBe('EDGE-1');
    expect(row.source_system_id).toBe('SYS-1');
    expect(row.target_system_id).toBe('SYS-2');
    expect(row.direction).toBe('forward');
    expect(row.data_objects).toEqual(['basket', 'price', 'receipt']);
    expect(row.frequency).toBe('real_time');
    expect(row.evidence_status).toBe('confirmed');
    expect(row.is_missing_link).toBe(false);
  });

  it('defaults data_objects to an empty array when absent', () => {
    const row = mapArchitectureRelationship({ edge_id: 'EDGE-2', from_component_id: 'SYS-1', to_component_id: 'SYS-2' });
    expect(row.data_objects).toEqual([]);
    expect(row.relationship_type).toBe('unknown');
    expect(row.is_missing_link).toBe(false);
  });
});

describe('join-table extractors', () => {
  it('extractGapSystems maps linked_component_ids to gap/system pairs', () => {
    expect(extractGapSystems({ gap_id: 'GAP-1', linked_component_ids: ['SYS-1', 'SYS-2'] })).toEqual([
      { gap_id: 'GAP-1', system_id: 'SYS-1' },
      { gap_id: 'GAP-1', system_id: 'SYS-2' },
    ]);
  });

  it('extractGapSystems returns an empty array when no components are linked', () => {
    expect(extractGapSystems({ gap_id: 'GAP-2' })).toEqual([]);
  });

  it('extractClaimSources maps source_ids to claim/source pairs', () => {
    expect(extractClaimSources({ claim_id: 'CLM-1', source_ids: ['SRC-1', 'SRC-2'] })).toEqual([
      { claim_id: 'CLM-1', source_id: 'SRC-1' },
      { claim_id: 'CLM-1', source_id: 'SRC-2' },
    ]);
  });

  it('extractSystemSources flags the primary_source_id entry as is_primary', () => {
    const rows = extractSystemSources({ component_id: 'SYS-1', source_ids: ['SRC-1', 'SRC-2'], primary_source_id: 'SRC-2' });
    expect(rows).toEqual([
      { system_id: 'SYS-1', source_id: 'SRC-1', is_primary: false },
      { system_id: 'SYS-1', source_id: 'SRC-2', is_primary: true },
    ]);
  });

  it('extractArchitectureRelationshipSources maps an edge source_ids array', () => {
    expect(extractArchitectureRelationshipSources({ edge_id: 'EDGE-1', source_ids: ['SRC-1'] })).toEqual([{ relationship_id: 'EDGE-1', source_id: 'SRC-1' }]);
  });

  it('extractCommercialRelationshipSystems maps component_ids to relationship/system pairs', () => {
    expect(extractCommercialRelationshipSystems({ relationship_id: 'REL-1', component_ids: ['SYS-1', 'SYS-2'] })).toEqual([
      { relationship_id: 'REL-1', system_id: 'SYS-1' },
      { relationship_id: 'REL-1', system_id: 'SYS-2' },
    ]);
  });

  it('extractProgrammeSystems tags source components as role "source" and target components as role "target"', () => {
    const rows = extractProgrammeSystems({ programme_id: 'PROG-1', source_component_ids: ['SYS-1'], target_component_ids: ['SYS-2', 'SYS-3'] });
    expect(rows).toEqual([
      { programme_id: 'PROG-1', system_id: 'SYS-1', role: 'source' },
      { programme_id: 'PROG-1', system_id: 'SYS-2', role: 'target' },
      { programme_id: 'PROG-1', system_id: 'SYS-3', role: 'target' },
    ]);
  });
});

describe('mapOwnershipLink', () => {
  it('maps an ownership link and lowercases its status', () => {
    const row = mapOwnershipLink({
      ownership_link_id: 'OWN-1',
      stakeholder_id: 'STK-1',
      object_type: 'system',
      object_id: 'SYS-1',
      owner_role: 'business_owner',
      evidence_status: 'CONFIRMED',
      source_ids: ['SRC-1'],
    });
    expect(row.id).toBe('OWN-1');
    expect(row.subject_type).toBe('system');
    expect(row.subject_id).toBe('SYS-1');
    expect(row.status).toBe('confirmed');
    expect(row.source_id).toBe('SRC-1');
  });

  it('defaults subject_type/status to unknown when absent', () => {
    const row = mapOwnershipLink({ ownership_link_id: 'OWN-2', stakeholder_id: 'STK-1', object_id: 'SYS-1' });
    expect(row.subject_type).toBe('unknown');
    expect(row.status).toBe('unknown');
  });
});
