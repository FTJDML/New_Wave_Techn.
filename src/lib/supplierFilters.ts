// Derived filter facets for the Suppliers page (content-provider patch §10): provider role,
// current status, directness, domain, geography and evidence status all live on
// commercial_relationships, not on the vendor record itself, so a vendor without a
// relationship (e.g. a hardware-observation stub like Elo) simply has no value for any of
// these — never a fabricated one.
import { commercialRelationships, getComponentsForVendor, researchGaps } from '@/data/fullCatalogue';
import type { CommercialRelationship, Vendor } from '@/types/catalogue';

function relationshipsFor(vendorId: string): readonly CommercialRelationship[] {
  return commercialRelationships.filter((r) => r.vendor_id === vendorId);
}

export function vendorProviderRoles(vendor: Vendor): readonly string[] {
  return relationshipsFor(vendor.vendor_id).map((r) => r.provider_role);
}

export function vendorCurrentStatuses(vendor: Vendor): readonly string[] {
  return relationshipsFor(vendor.vendor_id).map((r) => r.current_status);
}

export function vendorDirectness(vendor: Vendor): readonly string[] {
  return relationshipsFor(vendor.vendor_id).map((r) => r.directness);
}

export function vendorGeographies(vendor: Vendor): readonly string[] {
  return relationshipsFor(vendor.vendor_id).map((r) => r.geography_scope);
}

export function vendorEvidenceStatuses(vendor: Vendor): readonly string[] {
  return relationshipsFor(vendor.vendor_id).map((r) => r.evidence_status);
}

export function vendorKnownSinceYears(vendor: Vendor): readonly string[] {
  return relationshipsFor(vendor.vendor_id)
    .map((r) => String(r.known_since_year || r.start_year || '').trim())
    .filter((y) => /^\d{4}$/.test(y));
}

export function vendorDomainIds(vendor: Vendor): readonly string[] {
  return Array.from(new Set(getComponentsForVendor(vendor.vendor_id).map((c) => c.domain_id).filter(Boolean)));
}

const OPEN_PARTNER_GAP_COMPONENT_IDS = new Set(
  researchGaps
    .filter((g) => g.domain_id === 'DOM-PARTNERS' && g.gap_status === 'OPEN')
    .flatMap((g) => g.linked_component_ids),
);

/** True when a vendor has a system with an open, unresolved delivery-partner question. */
export function vendorHasOpenProviderGap(vendor: Vendor): boolean {
  return getComponentsForVendor(vendor.vendor_id).some((c) => OPEN_PARTNER_GAP_COMPONENT_IDS.has(c.component_id));
}
