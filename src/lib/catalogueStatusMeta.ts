const DEPLOYMENT_COLORS: Readonly<Record<string, string>> = {
  CURRENT: 'var(--color-status-current)',
  TRANSITION: 'var(--color-status-transition)',
  TARGET: 'var(--color-status-target)',
  LEGACY: 'var(--color-status-legacy)',
  HISTORICAL: 'var(--color-status-legacy)',
  SUSPECTED: 'var(--color-status-observed)',
  VISUALLY_CONFIRMED: 'var(--color-status-observed)',
  CAPABILITY_CONFIRMED: 'var(--color-status-observed)',
  UNKNOWN: 'var(--color-gap-border)',
};

const EVIDENCE_COLORS: Readonly<Record<string, string>> = {
  CONFIRMED_FIRST_PARTY: 'var(--color-status-current)',
  CONFIRMED_VENDOR_CASE: 'var(--color-status-target)',
  INDIRECTLY_CONFIRMED: 'var(--color-status-target)',
  PRIVATE_CONFIRMATION: 'var(--color-status-private)',
  TECHNICALLY_OBSERVED: 'var(--color-status-observed)',
  INFERRED: 'var(--color-status-observed)',
  UNKNOWN: 'var(--color-gap-border)',
};

const PRIORITY_COLORS: Readonly<Record<string, string>> = {
  P0: 'var(--color-gap-border)',
  P1: 'var(--color-status-transition)',
  P2: 'var(--color-status-observed)',
  P3: 'var(--color-status-legacy)',
};

export function deploymentStatusColor(status: string): string {
  return DEPLOYMENT_COLORS[status] ?? 'var(--color-status-legacy)';
}

export function evidenceStatusColor(status: string): string {
  return EVIDENCE_COLORS[status] ?? 'var(--color-status-legacy)';
}

export function priorityColor(priority: string): string {
  return PRIORITY_COLORS[priority] ?? 'var(--color-status-legacy)';
}
