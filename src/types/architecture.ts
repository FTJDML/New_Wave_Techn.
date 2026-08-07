// Presentation-layer contracts, ported from 04_DATA_MODEL_SCHEMA_AND_RESEARCH_PROTOCOL.md.
// These describe the curated view only — canonical research-catalogue records are read
// through catalogueIndex.ts and are intentionally untyped here beyond what the drawer needs.

export type DeploymentStatus =
  | 'current'
  | 'likely_current'
  | 'transition'
  | 'target'
  | 'legacy'
  | 'historical'
  | 'suspected'
  | 'visually_confirmed'
  | 'capability_confirmed'
  | 'unknown';

export type EvidenceStatus =
  | 'confirmed_first_party'
  | 'confirmed_vendor_case'
  | 'private_confirmation'
  | 'technically_observed'
  | 'inferred'
  | 'mixed_confirmed_and_observed'
  | 'unknown';

export type ViewNodeKind = 'channel' | 'core' | 'hub' | 'satellite' | 'signal' | 'transition' | 'gap';

export type ViewEdgeType =
  | 'business-flow'
  | 'integration'
  | 'data-flow'
  | 'physical-integration'
  | 'migration'
  | 'migration-and-integration'
  | 'probable-integration'
  | 'missing-link';

export type GapPriority = 'P0' | 'P1' | 'P2' | 'P3';

export interface CanvasSize {
  readonly width: number;
  readonly height: number;
  readonly background: string;
  readonly initialScale: number;
  readonly minScale: number;
  readonly maxScale: number;
}

export interface ArchitectureGroup {
  readonly id: string;
  readonly label: string;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

export interface ArchitectureViewNode {
  readonly id: string;
  readonly kind: ViewNodeKind;
  readonly groupId: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly vendorId?: string;
  readonly catalogRefs: readonly string[];
  readonly status?: DeploymentStatus;
  readonly evidence?: EvidenceStatus;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly modules?: readonly string[];
  readonly gapPriority?: GapPriority;
}

export interface ArchitectureViewEdge {
  readonly id: string;
  readonly source: string;
  readonly target: string;
  readonly type: ViewEdgeType;
  readonly label?: string;
  readonly points: readonly (readonly [number, number])[];
  readonly dashed?: boolean;
  readonly canonicalRelationshipIds?: readonly string[];
}

export interface ArchitectureViewRules {
  readonly autoLayout: false;
  readonly draggableNodes: false;
  readonly showMinimap: false;
  readonly renderAllCatalogRecords: false;
  readonly edgeRouting: 'explicit-waypoints-only';
  readonly edgesBehindNodes: true;
  readonly maxVisibleTopLevelCards: number;
  readonly maxVisibleGaps: number;
  readonly hideEdgeLabelsUntilHover: boolean;
}

export interface ArchitectureView {
  readonly id: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly canvas: CanvasSize;
  readonly rules: ArchitectureViewRules;
  readonly groups: readonly ArchitectureGroup[];
  readonly nodes: readonly ArchitectureViewNode[];
  readonly edges: readonly ArchitectureViewEdge[];
}

export type LogoStrategy = 'simple-icons' | 'asset' | 'wordmark';

export interface LogoDefinition {
  readonly strategy: LogoStrategy;
  readonly slug?: string;
  readonly assetPath?: string;
  readonly text?: string;
}

export type LogoRegistry = Readonly<Record<string, LogoDefinition>>;

/** Minimal shape read from the canonical catalogue for the read-only drawer. */
export interface CatalogueRecordSummary {
  readonly id: string;
  readonly displayName: string;
  readonly vendorName?: string;
  readonly productName?: string;
  readonly source: 'core' | 'full';
}
