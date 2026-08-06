import bundle from './action-architecture-data.json' with { type: 'json' };
import type { ArchitectureView, LogoRegistry } from '@/types/architecture';

// The JSON bundle is huge (research catalogue + curated view + backlog). We only ever
// destructure the specific slices Phase 1 needs — the rest is imported but never iterated,
// which keeps "never render the full catalogue" true by construction rather than convention.
interface RawBundle {
  readonly curatedArchitecture: {
    readonly schemaVersion: string;
    readonly view: ArchitectureView;
    readonly logoRegistry: LogoRegistry;
  };
  readonly coreSystemCatalogue: {
    readonly vendors: readonly RawVendor[];
    readonly systems: readonly RawCoreSystem[];
  };
  readonly fullResearchCatalogue: {
    readonly vendors: readonly RawVendor[];
    readonly components: readonly RawComponent[];
  };
}

interface RawVendor {
  readonly vendor_id: string;
  readonly vendor_name: string;
}

interface RawCoreSystem {
  readonly component_id: string;
  readonly display_name: string;
  readonly vendor_name?: string;
  readonly product_name?: string;
}

interface RawComponent {
  readonly component_id: string;
  readonly display_name?: string;
  readonly vendor_name?: string;
  readonly product_name?: string;
}

export const rawBundle = bundle as unknown as RawBundle;
export type { RawVendor, RawCoreSystem, RawComponent };
