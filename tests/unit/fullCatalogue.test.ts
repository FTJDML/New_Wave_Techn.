import { describe, expect, it } from 'vitest';
import {
  domains,
  capabilities,
  vendors,
  components,
  componentCapabilities,
  architectureEdges,
  commercialRelationships,
  programmes,
  researchGaps,
  researchTasks,
  getComponent,
  getVendor,
  getDomain,
  getCapability,
  getOutgoingEdges,
  getIncomingEdges,
  getCommercialRelationshipsForVendor,
  getGapsForComponent,
  getTasksForGap,
  getProgrammesForComponent,
  getClaimsCitingSource,
} from '../../src/data/fullCatalogue';

describe('fullCatalogue referential integrity', () => {
  it('every component references a known domain', () => {
    const domainIds = new Set(domains.map((d) => d.domain_id));
    for (const c of components) {
      expect(domainIds.has(c.domain_id), `component ${c.component_id} has unknown domain ${c.domain_id}`).toBe(true);
    }
  });

  it('every component references a known vendor', () => {
    const vendorIds = new Set(vendors.map((v) => v.vendor_id));
    for (const c of components) {
      expect(vendorIds.has(c.vendor_id), `component ${c.component_id} has unknown vendor ${c.vendor_id}`).toBe(true);
    }
  });

  it('every component_capability resolves both ends', () => {
    const componentIds = new Set(components.map((c) => c.component_id));
    const capabilityIds = new Set(capabilities.map((c) => c.capability_id));
    for (const cc of componentCapabilities) {
      expect(componentIds.has(cc.component_id)).toBe(true);
      expect(capabilityIds.has(cc.capability_id)).toBe(true);
    }
  });

  it('every architecture edge resolves both endpoints', () => {
    const componentIds = new Set(components.map((c) => c.component_id));
    for (const edge of architectureEdges) {
      expect(componentIds.has(edge.from_component_id), `edge ${edge.edge_id} from ${edge.from_component_id}`).toBe(true);
      expect(componentIds.has(edge.to_component_id), `edge ${edge.edge_id} to ${edge.to_component_id}`).toBe(true);
    }
  });

  it('every commercial relationship references a known vendor and its components resolve', () => {
    const vendorIds = new Set(vendors.map((v) => v.vendor_id));
    const componentIds = new Set(components.map((c) => c.component_id));
    for (const rel of commercialRelationships) {
      expect(vendorIds.has(rel.vendor_id)).toBe(true);
      for (const id of rel.component_ids) {
        expect(componentIds.has(id), `relationship ${rel.relationship_id} component ${id}`).toBe(true);
      }
    }
  });

  it('every programme references known domain and components', () => {
    const domainIds = new Set(domains.map((d) => d.domain_id));
    const componentIds = new Set(components.map((c) => c.component_id));
    for (const p of programmes) {
      expect(domainIds.has(p.domain_id)).toBe(true);
      for (const id of [...p.source_component_ids, ...p.target_component_ids]) {
        expect(componentIds.has(id), `programme ${p.programme_id} component ${id}`).toBe(true);
      }
    }
  });

  it('every research gap references a known domain, and a known component when one is set', () => {
    // gap_component_id may be legitimately empty for cross-cutting gaps not tied to a
    // single placeholder component (e.g. "Exact SAP CAR role and interfaces").
    const domainIds = new Set(domains.map((d) => d.domain_id));
    const componentIds = new Set(components.map((c) => c.component_id));
    for (const g of researchGaps) {
      expect(domainIds.has(g.domain_id), `gap ${g.gap_id} domain ${g.domain_id}`).toBe(true);
      if (g.gap_component_id) {
        expect(componentIds.has(g.gap_component_id), `gap ${g.gap_id} component ${g.gap_component_id}`).toBe(true);
      }
    }
  });

  it('every research task references a known gap', () => {
    const gapIds = new Set(researchGaps.map((g) => g.gap_id));
    for (const t of researchTasks) {
      expect(gapIds.has(t.gap_id), `task ${t.task_id} gap ${t.gap_id}`).toBe(true);
    }
  });
});

describe('fullCatalogue accessors', () => {
  it('getComponent / getVendor / getDomain / getCapability resolve known ids and undefined for unknown', () => {
    expect(getComponent('CMP-CTAC-XV')?.display_name).toBe('Ctac XV Unified Commerce');
    expect(getComponent('CMP-DOES-NOT-EXIST')).toBeUndefined();
    expect(getVendor('VEN-SAP')?.vendor_name).toBe('SAP');
    expect(getDomain('DOM-STORE')?.domain_name).toBeTruthy();
    expect(getCapability('CAP-STORE-POS')?.capability_name).toBeTruthy();
  });

  it('getOutgoingEdges / getIncomingEdges only return edges touching the given component', () => {
    const outgoing = getOutgoingEdges('CMP-CHANNEL-STORES');
    expect(outgoing.length).toBeGreaterThan(0);
    for (const edge of outgoing) expect(edge.from_component_id).toBe('CMP-CHANNEL-STORES');

    const incoming = getIncomingEdges('CMP-CTAC-XV');
    for (const edge of incoming) expect(edge.to_component_id).toBe('CMP-CTAC-XV');
  });

  it('getCommercialRelationshipsForVendor returns only that vendor\'s relationships', () => {
    const rels = getCommercialRelationshipsForVendor('VEN-PANOSTON');
    expect(rels.length).toBeGreaterThan(0);
    for (const r of rels) expect(r.vendor_id).toBe('VEN-PANOSTON');
  });

  it('getGapsForComponent and getTasksForGap chain correctly', () => {
    const gaps = getGapsForComponent('CMP-TARGET-POS-SCO');
    expect(gaps.length).toBeGreaterThan(0);
    const tasks = getTasksForGap(gaps[0].gap_id);
    expect(tasks.every((t) => t.gap_id === gaps[0].gap_id)).toBe(true);
  });

  it('getProgrammesForComponent matches source or target components', () => {
    const progs = getProgrammesForComponent('CMP-CTAC-XV');
    expect(progs.some((p) => p.source_component_ids.includes('CMP-CTAC-XV'))).toBe(true);
  });

  it('getClaimsCitingSource returns only claims that cite the given source', () => {
    const claims = getClaimsCitingSource('SRC-CTAC-XV-RENEWAL');
    expect(claims.length).toBeGreaterThan(0);
    for (const c of claims) expect(c.source_ids).toContain('SRC-CTAC-XV-RENEWAL');
  });

  it('returns empty arrays (not throwing) for ids with no related records', () => {
    expect(getOutgoingEdges('CMP-DOES-NOT-EXIST')).toEqual([]);
    expect(getCommercialRelationshipsForVendor('VEN-DOES-NOT-EXIST')).toEqual([]);
    expect(getGapsForComponent('CMP-DOES-NOT-EXIST')).toEqual([]);
  });
});
