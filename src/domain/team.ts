import { DIMENSION_CODES, type DimensionCode } from "./dimensions";
import { LEVEL_ORDER, type IndicativeLevel } from "./levels";
import { ROLES, type RoleId } from "./roles";
import type { ParticipantProfile } from "./scoring";
import type { ProjectNeed } from "./types";
import { round1 } from "@/lib/utils";

export type CoverageCategory =
  | "INSUFFICIENT_EVIDENCE"
  | "KNOWLEDGE_PRESENT"
  | "SINGLE_PERSON"
  | "SUFFICIENT_CAPACITY";

export const COVERAGE_LABELS: Record<CoverageCategory, string> = {
  INSUFFICIENT_EVIDENCE: "Onvoldoende bewijs",
  KNOWLEDGE_PRESENT: "Kennis aanwezig (nog geen Medior-niveau)",
  SINGLE_PERSON: "Kennis slechts bij één persoon aanwezig",
  SUFFICIENT_CAPACITY: "Voldoende capaciteit aanwezig",
};

const MEDIOR_THRESHOLD = 2.4;
const SENIOR_THRESHOLD = 3.25;

export interface TeamDimensionStat {
  dimension: DimensionCode;
  average: number | null;
  max: number | null;
  countAtLeastMedior: number;
  countAtLeastSenior: number;
  participantsObserved: number;
  totalParticipants: number;
  coverage: CoverageCategory;
  singlePointOfFailure: boolean;
}

export function computeTeamDimensionStats(
  profiles: ParticipantProfile[]
): Record<DimensionCode, TeamDimensionStat> {
  const result: Record<DimensionCode, TeamDimensionStat> = {} as Record<
    DimensionCode,
    TeamDimensionStat
  >;

  for (const dim of DIMENSION_CODES) {
    const perParticipantAverages = profiles
      .map((p) => p.dimensionStats[dim].averagePrecise)
      .filter((v): v is number => v !== null);

    const participantsObserved = perParticipantAverages.length;
    const average =
      participantsObserved > 0
        ? perParticipantAverages.reduce((a, b) => a + b, 0) / participantsObserved
        : null;
    const max = participantsObserved > 0 ? Math.max(...perParticipantAverages) : null;
    const countAtLeastMedior = perParticipantAverages.filter((v) => v >= MEDIOR_THRESHOLD).length;
    const countAtLeastSenior = perParticipantAverages.filter((v) => v >= SENIOR_THRESHOLD).length;

    let coverage: CoverageCategory;
    if (participantsObserved === 0) {
      coverage = "INSUFFICIENT_EVIDENCE";
    } else if (countAtLeastMedior === 0) {
      coverage = "KNOWLEDGE_PRESENT";
    } else if (countAtLeastMedior === 1) {
      coverage = "SINGLE_PERSON";
    } else {
      coverage = "SUFFICIENT_CAPACITY";
    }

    result[dim] = {
      dimension: dim,
      average: average === null ? null : round1(average),
      max: max === null ? null : round1(max),
      countAtLeastMedior,
      countAtLeastSenior,
      participantsObserved,
      totalParticipants: profiles.length,
      coverage,
      singlePointOfFailure: countAtLeastMedior === 1,
    };
  }

  return result;
}

/** Bepaalt het indicatieve niveau dat op het teamdashboard wordt gebruikt: de
 * primaire doelrol van de deelnemer, of bij Generalisten de best passende rol. */
export function getParticipantIndicativeLevel(
  profile: ParticipantProfile
): { level: IndicativeLevel | null; roleId: RoleId } {
  const roleId: RoleId =
    profile.participant.primaryRole === "GENERALIST"
      ? profile.topMatches[0]
      : profile.participant.primaryRole;
  const assessment = profile.roleAssessments[roleId];
  return { level: assessment.level.level, roleId };
}

export interface LevelDistribution {
  FOUNDATION: number;
  JUNIOR: number;
  MEDIOR: number;
  SENIOR: number;
  INSUFFICIENT_EVIDENCE: number;
}

export function computeLevelDistribution(profiles: ParticipantProfile[]): LevelDistribution {
  const dist: LevelDistribution = {
    FOUNDATION: 0,
    JUNIOR: 0,
    MEDIOR: 0,
    SENIOR: 0,
    INSUFFICIENT_EVIDENCE: 0,
  };
  for (const profile of profiles) {
    const { level } = getParticipantIndicativeLevel(profile);
    if (level === null) {
      dist.INSUFFICIENT_EVIDENCE += 1;
    } else {
      dist[level] += 1;
    }
  }
  return dist;
}

export function countAtLeastLevelForRole(
  profiles: ParticipantProfile[],
  roleId: RoleId,
  minLevel: IndicativeLevel
): number {
  const minIndex = LEVEL_ORDER.indexOf(minLevel);
  return profiles.filter((p) => {
    const level = p.roleAssessments[roleId].level.level;
    if (level === null) return false;
    return LEVEL_ORDER.indexOf(level) >= minIndex;
  }).length;
}

export type StaffingRisk = "NONE" | "MEDIUM" | "HIGH";

export interface StaffingRow {
  need: ProjectNeed;
  roleName: string;
  requiredLevel: IndicativeLevel;
  requiredCount: number;
  foundCount: number;
  gap: number;
  risk: StaffingRisk;
  singlePointOfFailure: boolean;
  candidates: string[]; // pseudoniemen, alfabetisch
  humanValidationNote: string;
}

export function computeStaffingMatrix(
  needs: ProjectNeed[],
  profiles: ParticipantProfile[]
): StaffingRow[] {
  return needs.map((need) => {
    const minIndex = LEVEL_ORDER.indexOf(need.level);
    const candidateProfiles = profiles.filter((p) => {
      const level = p.roleAssessments[need.role].level.level;
      if (level === null) return false;
      return LEVEL_ORDER.indexOf(level) >= minIndex;
    });
    const candidates = candidateProfiles
      .map((p) => p.participant.pseudonym)
      .sort((a, b) => a.localeCompare(b, "nl"));

    const foundCount = candidates.length;
    const gap = Math.max(0, need.count - foundCount);

    let risk: StaffingRisk = "NONE";
    if (gap > 0) {
      risk = gap >= 2 || foundCount === 0 ? "HIGH" : "MEDIUM";
    } else if (foundCount === 1 && need.count >= 1) {
      risk = "MEDIUM";
    }

    return {
      need,
      roleName: ROLES[need.role].name,
      requiredLevel: need.level,
      requiredCount: need.count,
      foundCount,
      gap,
      risk,
      singlePointOfFailure: foundCount === 1,
      candidates,
      humanValidationNote:
        "Geen automatische staffing recommendation — bevestig kandidaten altijd met de deelnemer en de verantwoordelijke manager.",
    };
  });
}
