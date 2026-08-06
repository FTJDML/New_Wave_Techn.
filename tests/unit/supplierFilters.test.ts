import { describe, expect, it } from 'vitest';
import {
  vendorProviderRoles,
  vendorCurrentStatuses,
  vendorDirectness,
  vendorGeographies,
  vendorEvidenceStatuses,
  vendorKnownSinceYears,
  vendorDomainIds,
  vendorHasOpenProviderGap,
} from '../../src/lib/supplierFilters';
import { getVendor } from '../../src/data/fullCatalogue';

describe('supplierFilters', () => {
  const ctac = getVendor('VEN-CTAC')!;
  const elo = getVendor('VEN-ELO')!;
  const mendix = getVendor('VEN-MENDIX')!;
  const stibo = getVendor('VEN-STIBO')!;

  it('derives provider role, status, directness, geography and evidence from the vendor\'s own commercial_relationships', () => {
    expect(vendorProviderRoles(ctac)).toContain('SOFTWARE_PLATFORM_VENDOR');
    expect(vendorCurrentStatuses(ctac).length).toBeGreaterThan(0);
    expect(vendorDirectness(ctac).length).toBeGreaterThan(0);
    expect(vendorGeographies(ctac).length).toBeGreaterThan(0);
    expect(vendorEvidenceStatuses(ctac).length).toBeGreaterThan(0);
  });

  it('never fabricates a filter value for a vendor with no commercial_relationships record', () => {
    expect(vendorProviderRoles(elo)).toEqual([]);
    expect(vendorCurrentStatuses(elo)).toEqual([]);
    expect(vendorHasOpenProviderGap(elo)).toBe(false);
  });

  it('flags Mendix and Stibo as having an open provider-discovery gap (GAP-069, GAP-070)', () => {
    expect(vendorHasOpenProviderGap(mendix)).toBe(true);
    expect(vendorHasOpenProviderGap(stibo)).toBe(true);
  });

  it('derives domain ids from the vendor\'s own components, not a hardcoded list', () => {
    expect(vendorDomainIds(ctac)).toContain('DOM-STORE');
  });

  it('only returns 4-digit years for known-since filtering', () => {
    for (const vendor of [ctac, mendix, stibo]) {
      for (const year of vendorKnownSinceYears(vendor)) {
        expect(year).toMatch(/^\d{4}$/);
      }
    }
  });
});
