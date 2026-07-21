import {
  getCoreQuestions,
  getRoleQuestions,
  getTeamQuickScanQuestions,
  getQuestion,
} from "@/data/questionBank.nl";
import type { Question } from "@/data/questionTypes";
import type { AssessmentDepth, Participant } from "./types";
import type { DimensionCode } from "./dimensions";
import { PRACTITIONER_ROLE_IDS, ROLES, type RoleId } from "./roles";
import type { DimensionStat } from "./dimensionScore";

/** Gemiddelde extra tijd (notities + scoren) die de facilitator per vraag nodig heeft. */
export const AVERAGE_SCORING_OVERHEAD_SECONDS = 30;
/** Vaste overhead per deelnemer voor introductie en afronding. */
export const SESSION_SETUP_OVERHEAD_SECONDS = 120;

export function buildQuestionPlan(participant: Participant, depth: AssessmentDepth): string[] {
  if (depth === "QUICK_SCAN") {
    return getTeamQuickScanQuestions().map((q) => q.id);
  }

  const ids: string[] = getCoreQuestions().map((q) => q.id);

  if (participant.primaryRole !== "GENERALIST") {
    ids.push(...getRoleQuestions(participant.primaryRole).map((q) => q.id));
  }

  if (participant.secondaryRole && participant.secondaryRole !== "GENERALIST") {
    const secondaryQuestions = getRoleQuestions(participant.secondaryRole);
    if (secondaryQuestions[0]) {
      ids.push(secondaryQuestions[0].id);
    }
  }

  return ids;
}

/**
 * Voor Generalisten: bepaal, ná de kernvragen, één vervolgvraag uit elk van de
 * twee hoogst scorende technische richtingen en één vraag uit de richting met
 * het minste bewijs. Dit gebeurt dynamisch op basis van de tussentijdse scores.
 */
export function getGeneralistFollowupQuestionIds(
  dimensionStats: Record<DimensionCode, DimensionStat>,
  alreadyPlannedIds: string[]
): string[] {
  const technicalDimensions: DimensionCode[] = ["DATA", "ANALYTICS", "AI", "PROD"];

  const scored = technicalDimensions.map((dim) => ({
    dim,
    average: dimensionStats[dim].averagePrecise ?? -1,
    observed: dimensionStats[dim].observationCount,
  }));

  const highest = [...scored].sort((a, b) => b.average - a.average).slice(0, 2);
  const leastEvidence = [...scored].sort((a, b) => a.observed - b.observed)[0];

  const dimensionToRole = (dim: DimensionCode): RoleId => {
    let bestRole: RoleId = PRACTITIONER_ROLE_IDS[0];
    let bestWeight = -1;
    for (const roleId of PRACTITIONER_ROLE_IDS) {
      const weight = ROLES[roleId].weights[dim] ?? 0;
      if (weight > bestWeight) {
        bestWeight = weight;
        bestRole = roleId;
      }
    }
    return bestRole;
  };

  const candidateRoles = new Set<RoleId>([
    ...highest.map((h) => dimensionToRole(h.dim)),
    dimensionToRole(leastEvidence.dim),
  ]);

  const followupIds: string[] = [];
  for (const roleId of candidateRoles) {
    const roleQuestions = getRoleQuestions(roleId);
    const notYetPlanned = roleQuestions.find((q) => !alreadyPlannedIds.includes(q.id));
    if (notYetPlanned) followupIds.push(notYetPlanned.id);
  }
  return followupIds;
}

export function getPlannedQuestions(ids: string[]): Question[] {
  return ids.map(getQuestion);
}

export interface DurationEstimateInput {
  depth: AssessmentDepth;
  order: "ROUND_ROBIN" | "PERSON_BY_PERSON";
  participantCount: number;
  /** Representatieve vragenlijst waarop de schatting wordt gebaseerd (bv. plan van deelnemer 1). */
  sampleQuestionIds: string[];
}

export interface DurationEstimate {
  perParticipantSeconds: number;
  totalSeconds: number;
  totalMinutes: number;
  questionCount: number;
}

/**
 * Geschatte totale duur op basis van assessmentdiepte, aantal deelnemers,
 * interviewvolgorde en gemiddelde tijd per vraag (sectie 2). De interviewvolgorde
 * beïnvloedt vooral de organisatie van het gesprek, niet de totale tijdsbesteding
 * per vraag — daarom wordt dezelfde vraagtijd gebruikt voor beide volgordes.
 */
export function estimateSessionDuration(input: DurationEstimateInput): DurationEstimate {
  const questions = getPlannedQuestions(input.sampleQuestionIds);
  const perParticipantSeconds =
    questions.reduce((sum, q) => sum + q.timeBudgetSeconds + AVERAGE_SCORING_OVERHEAD_SECONDS, 0) +
    SESSION_SETUP_OVERHEAD_SECONDS;
  const totalSeconds = perParticipantSeconds * Math.max(1, input.participantCount);

  return {
    perParticipantSeconds,
    totalSeconds,
    totalMinutes: Math.round(totalSeconds / 60),
    questionCount: questions.length,
  };
}

