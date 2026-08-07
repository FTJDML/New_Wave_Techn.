import type { DeploymentStatus, EvidenceStatus } from '@/types/architecture';

export interface StatusMeta {
  readonly label: string;
  readonly color: string;
}

const STATUS_META: Readonly<Record<DeploymentStatus, StatusMeta>> = {
  current: { label: 'Current', color: 'var(--color-status-current)' },
  likely_current: { label: 'Likely current', color: 'var(--color-status-current)' },
  transition: { label: 'Transition', color: 'var(--color-status-transition)' },
  target: { label: 'Target', color: 'var(--color-status-target)' },
  legacy: { label: 'Legacy', color: 'var(--color-status-legacy)' },
  historical: { label: 'Historical', color: 'var(--color-status-legacy)' },
  suspected: { label: 'Suspected', color: 'var(--color-status-observed)' },
  visually_confirmed: { label: 'Visually confirmed', color: 'var(--color-status-observed)' },
  capability_confirmed: { label: 'Capability confirmed', color: 'var(--color-status-observed)' },
  unknown: { label: 'Unknown', color: 'var(--color-gap-border)' },
};

export function statusMeta(status?: DeploymentStatus): StatusMeta | undefined {
  return status ? STATUS_META[status] : undefined;
}

const EVIDENCE_META: Readonly<Record<EvidenceStatus, StatusMeta>> = {
  confirmed_first_party: { label: 'Confirmed', color: 'var(--color-status-current)' },
  confirmed_vendor_case: { label: 'Vendor case', color: 'var(--color-status-target)' },
  private_confirmation: { label: 'Private', color: 'var(--color-status-private)' },
  technically_observed: { label: 'Observed', color: 'var(--color-status-observed)' },
  inferred: { label: 'Inferred', color: 'var(--color-status-observed)' },
  mixed_confirmed_and_observed: { label: 'Mixed evidence', color: 'var(--color-status-observed)' },
  unknown: { label: 'Unknown', color: 'var(--color-gap-border)' },
};

export function evidenceMeta(evidence?: EvidenceStatus): StatusMeta | undefined {
  return evidence ? EVIDENCE_META[evidence] : undefined;
}
