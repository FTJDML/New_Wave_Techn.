import { rawBundle } from './rawBundle';
import type { ArchitectureView, ArchitectureViewEdge, LogoDefinition, LogoRegistry } from '@/types/architecture';

/**
 * Connector waypoint corrections found in docs/IMPLEMENTATION_AUDIT.md §3.
 *
 * The raw curated-view JSON routes these 3 edges straight through their own domain
 * group's top-left label text. Source, target, type and label are unchanged — only the
 * polyline is redrawn through the same layout's existing inter-row gaps and group padding
 * gutters, which the audit verified introduces no new node overlap or edge crossing.
 */
const EDGE_WAYPOINT_OVERRIDES: Readonly<Record<string, readonly (readonly [number, number])[]>> = {
  e01: [
    [200, 113],
    [200, 150],
    [260, 150],
    [260, 220],
  ],
  e02: [
    [545, 113],
    [545, 220],
    [575, 220],
  ],
  e05: [
    [1245, 113],
    [1245, 130],
    [1890, 130],
    [1890, 545],
    [1600, 545],
    [1600, 560],
  ],
};

/**
 * Logo strategy overrides found in docs/IMPLEMENTATION_AUDIT.md §4.
 *
 * The data declares `simple-icons` for these two vendors, but simple-icons has no
 * Microsoft/Azure or ServiceNow mark. Per CLAUDE.md's own fallback rule, they render as
 * typographic wordmarks instead. The override lives here, not in the source JSON, so the
 * deviation stays a single visible diff and is easy to drop if simple-icons adds the marks.
 */
const LOGO_STRATEGY_OVERRIDES: Readonly<Record<string, LogoDefinition>> = {
  'VEN-MICROSOFT': { strategy: 'wordmark', text: 'Microsoft Azure' },
  'VEN-SERVICENOW': { strategy: 'wordmark', text: 'ServiceNow' },
};

function applyEdgeOverrides(edges: readonly ArchitectureViewEdge[]): readonly ArchitectureViewEdge[] {
  return edges.map((edge) => {
    const override = EDGE_WAYPOINT_OVERRIDES[edge.id];
    return override ? { ...edge, points: override } : edge;
  });
}

function buildView(): ArchitectureView {
  const raw = rawBundle.curatedArchitecture.view;
  return { ...raw, edges: applyEdgeOverrides(raw.edges) };
}

function buildLogoRegistry(): LogoRegistry {
  return { ...rawBundle.curatedArchitecture.logoRegistry, ...LOGO_STRATEGY_OVERRIDES };
}

export const totalArchitectureView: ArchitectureView = buildView();
export const logoRegistry: LogoRegistry = buildLogoRegistry();
