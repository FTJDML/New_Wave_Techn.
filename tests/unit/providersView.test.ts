import { describe, expect, it } from 'vitest';
import { buildProviderOverlay, buildProviderSections, buildProviderToFindGaps, formatProviderRole, MAX_OVERLAY_PROVIDER_CARDS } from '../../src/lib/providersView';
import { erpSupplyView, storeCheckoutView } from '../../src/data/deepDiveViews';
import { totalArchitectureView } from '../../src/data/curatedView';

describe('buildProviderSections', () => {
  const sections = buildProviderSections();

  it('produces exactly the 6 sections named in the content-provider patch', () => {
    expect(sections.map((s) => s.title)).toEqual([
      'Store, checkout and rollout',
      'Cloud and enterprise delivery',
      'Digital, product data and content',
      'Customer operations',
      'Supply chain and logistics',
      'People and recruitment',
    ]);
  });

  it('resolves a vendor with a real commercial relationship, including its supported systems', () => {
    const digital = sections.find((s) => s.title === 'Digital, product data and content')!;
    const mendix = digital.cards.find((c) => c.vendor.vendor_id === 'VEN-MENDIX')!;
    expect(mendix).toBeDefined();
    expect(mendix.relationship?.provider_role).toBe('SOFTWARE_PLATFORM_VENDOR');
    expect(mendix.systemNames).toContain('Mendix low-code application platform');
  });

  it('includes a candidate-affiliation vendor with no relationship record, without fabricating one', () => {
    const store = sections.find((s) => s.title === 'Store, checkout and rollout')!;
    const fourPos = store.cards.find((c) => c.vendor.vendor_id === 'VEN-4POS')!;
    expect(fourPos).toBeDefined();
    expect(fourPos.relationship).toBeNull();
    expect(fourPos.systemNames).toEqual([]);
  });

  it('includes Elo as a hardware observation with no relationship record', () => {
    const store = sections.find((s) => s.title === 'Store, checkout and rollout')!;
    const elo = store.cards.find((c) => c.vendor.vendor_id === 'VEN-ELO')!;
    expect(elo).toBeDefined();
    expect(elo.relationship).toBeNull();
  });

  it('never includes a vendor id that does not exist in the catalogue', () => {
    for (const section of sections) {
      for (const card of section.cards) {
        expect(card.vendor).toBeTruthy();
      }
    }
  });
});

describe('formatProviderRole', () => {
  it('humanizes a real provider_role value', () => {
    expect(formatProviderRole({ provider_role: 'PHYSICAL_SYSTEMS_INTEGRATOR' } as never)).toBe('Physical Systems Integrator');
  });

  it('labels a null relationship as a candidate affiliation, not a fabricated role', () => {
    expect(formatProviderRole(null)).toBe('Candidate affiliation — no relationship record');
  });
});

describe('buildProviderToFindGaps', () => {
  it('returns only gaps in the DOM-PARTNERS domain', () => {
    const gaps = buildProviderToFindGaps();
    expect(gaps.length).toBeGreaterThan(0);
    for (const gap of gaps) {
      expect(gap.domain_id).toBe('DOM-PARTNERS');
    }
  });

  it('includes the external development partners and Mendix CoE partner gaps', () => {
    const ids = buildProviderToFindGaps().map((g) => g.gap_id);
    expect(ids).toContain('GAP-068');
    expect(ids).toContain('GAP-069');
  });
});

describe('buildProviderOverlay', () => {
  it('never returns more than MAX_OVERLAY_PROVIDER_CARDS combined cards and gaps, for every canvas view', () => {
    for (const view of [totalArchitectureView, storeCheckoutView, erpSupplyView]) {
      const overlay = buildProviderOverlay(view);
      expect(overlay.cards.length + overlay.gaps.length).toBeLessThanOrEqual(MAX_OVERLAY_PROVIDER_CARDS);
    }
  });

  it('includes Ctac and Pan Oston for the Store & Checkout view, where the six-card cap is not reached', () => {
    const overlay = buildProviderOverlay(storeCheckoutView);
    const vendorIds = overlay.cards.map((c) => c.vendor.vendor_id);
    expect(vendorIds).toContain('VEN-CTAC');
    expect(vendorIds).toContain('VEN-PANOSTON');
  });

  it('only lists providers whose vendor or component is actually drawn on the ERP & Supply view', () => {
    const overlay = buildProviderOverlay(erpSupplyView);
    const visibleComponentIds = new Set(erpSupplyView.nodes.flatMap((n) => n.catalogRefs));
    for (const card of overlay.cards) {
      const relatedByVendor = card.relationship?.vendor_id === card.vendor.vendor_id;
      const relatedByComponent = card.relationship?.component_ids.some((id) => visibleComponentIds.has(id));
      expect(relatedByVendor || relatedByComponent).toBe(true);
    }
  });

  it('only lists TO-FIND provider gaps linked to a component drawn on the view', () => {
    const overlay = buildProviderOverlay(erpSupplyView);
    const visibleComponentIds = new Set(erpSupplyView.nodes.flatMap((n) => n.catalogRefs));
    for (const gap of overlay.gaps) {
      expect(gap.linked_component_ids.some((id) => visibleComponentIds.has(id))).toBe(true);
    }
  });

  it('never fabricates a provider for a view with no evidenced provider relationship among its nodes', () => {
    const emptyView = { ...storeCheckoutView, nodes: [] };
    const overlay = buildProviderOverlay(emptyView);
    expect(overlay.cards).toEqual([]);
    expect(overlay.gaps).toEqual([]);
  });
});
