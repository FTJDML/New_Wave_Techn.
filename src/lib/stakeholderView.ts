// Pure transform: raw Supabase `stakeholders` / `ownership_links` rows → a display-ready
// view-model. Kept dependency-free (no supabase-js import) so it's unit-testable with plain
// fixture arrays — StakeholdersPage.tsx is the only caller that actually talks to the network.
import { getComponent, getDomain } from '@/data/fullCatalogue';

export interface StakeholderRow {
  readonly id: string;
  readonly full_name: string;
  readonly job_title: string | null;
  readonly function_area: string | null;
  readonly linkedin_url: string | null;
  readonly classification: string;
  readonly confidence_score: number | null;
  readonly notes: string | null;
}

export interface OwnershipLinkRow {
  readonly id: string;
  readonly stakeholder_id: string;
  readonly subject_type: string;
  readonly subject_id: string;
  readonly ownership_role: string;
  readonly status: string;
  readonly confidence_score: number | null;
  readonly notes: string | null;
}

export interface OwnershipDisplay {
  readonly id: string;
  readonly ownershipRole: string;
  readonly status: string;
  readonly confidenceScore: number | null;
  readonly subjectLabel: string;
  readonly notes: string | null;
}

export interface StakeholderDisplay {
  readonly id: string;
  readonly fullName: string;
  readonly jobTitle: string | null;
  readonly functionArea: string | null;
  readonly linkedinUrl: string | null;
  readonly classification: string;
  readonly confidenceScore: number | null;
  readonly notes: string | null;
  readonly ownershipLinks: readonly OwnershipDisplay[];
}

function resolveSubjectLabel(subjectType: string, subjectId: string): string {
  switch (subjectType.toUpperCase()) {
    case 'COMPONENT':
    case 'SYSTEM': {
      const component = getComponent(subjectId);
      return component ? component.display_name : `Unknown system (${subjectId})`;
    }
    case 'DOMAIN': {
      const domain = getDomain(subjectId);
      return domain ? domain.domain_name : `Unknown domain (${subjectId})`;
    }
    default:
      return `${subjectType} ${subjectId}`;
  }
}

function formatRole(role: string): string {
  return role
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function buildStakeholderView(stakeholders: readonly StakeholderRow[], ownershipLinks: readonly OwnershipLinkRow[]): readonly StakeholderDisplay[] {
  return stakeholders
    .map((stakeholder) => ({
      id: stakeholder.id,
      fullName: stakeholder.full_name,
      jobTitle: stakeholder.job_title,
      functionArea: stakeholder.function_area,
      linkedinUrl: stakeholder.linkedin_url,
      classification: stakeholder.classification,
      confidenceScore: stakeholder.confidence_score,
      notes: stakeholder.notes,
      ownershipLinks: ownershipLinks
        .filter((link) => link.stakeholder_id === stakeholder.id)
        .map((link) => ({
          id: link.id,
          ownershipRole: formatRole(link.ownership_role),
          status: link.status,
          confidenceScore: link.confidence_score,
          subjectLabel: resolveSubjectLabel(link.subject_type, link.subject_id),
          notes: link.notes,
        })),
    }))
    .sort((a, b) => a.fullName.localeCompare(b.fullName));
}
