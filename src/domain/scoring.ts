import { computeDimensionStats, countConcreteExamples, type DimensionStat } from "./dimensionScore";
import { computeConfidence, type ConfidenceResult } from "./confidence";
import { computeLevel, type LevelResult } from "./levels";
import { PRACTITIONER_ROLE_IDS, ROLES, type RoleId } from "./roles";
import type { DimensionCode } from "./dimensions";
import type { AnswerRecord, AssessmentDepth, AssessmentSession, Participant } from "./types";

export interface RoleAssessment {
  roleId: RoleId;
  roleFitScore: number;
  roleFitScoreRounded: number;
  confidence: ConfidenceResult;
  level: LevelResult;
}

export interface ParticipantProfile {
  participant: Participant;
  answers: AnswerRecord[];
  dimensionStats: Record<DimensionCode, DimensionStat>;
  concreteExampleCount: number;
  measurableExampleCount: number;
  answeredQuestions: number;
  plannedQuestions: number;
  /** Role-fit resultaat voor alle vijf praktijkrollen. */
  roleAssessments: Record<RoleId, RoleAssessment>;
  /** Maximaal twee rollen met de hoogste role-fit-score, voor weergave op de resultatenpagina. */
  topMatches: RoleId[];
}

function getAnsweredCount(answers: AnswerRecord[]): number {
  return answers.filter((a) => a.answered).length;
}

export function computeParticipantProfile(
  session: AssessmentSession,
  participant: Participant
): ParticipantProfile {
  const answers = session.answers.filter((a) => a.participantId === participant.id);
  const dimensionStats = computeDimensionStats(answers);
  const { concrete, measurable } = countConcreteExamples(answers);
  const plannedQuestions = (session.questionPlan[participant.id] ?? []).length;
  const answeredQuestions = getAnsweredCount(answers);

  const roleAssessments: Partial<Record<RoleId, RoleAssessment>> = {};

  for (const roleId of PRACTITIONER_ROLE_IDS) {
    const role = ROLES[roleId];
    const confidence = computeConfidence({
      role,
      dimensionStats,
      answeredQuestions,
      plannedQuestions,
      concreteExampleCount: concrete,
      measurableExampleCount: measurable,
    });
    const level = computeLevel({
      role,
      dimensionStats,
      confidence: confidence.level,
      concreteExampleCount: concrete,
    });
    roleAssessments[roleId] = {
      roleId,
      roleFitScore: level.weightedScore,
      roleFitScoreRounded: level.weightedScoreRounded,
      confidence,
      level,
    };
  }

  const complete = roleAssessments as Record<RoleId, RoleAssessment>;

  const topMatches = [...PRACTITIONER_ROLE_IDS]
    .sort((a, b) => complete[b].roleFitScore - complete[a].roleFitScore)
    .slice(0, 2);

  return {
    participant,
    answers,
    dimensionStats,
    concreteExampleCount: concrete,
    measurableExampleCount: measurable,
    answeredQuestions,
    plannedQuestions,
    roleAssessments: complete,
    topMatches,
  };
}

export function computeAllParticipantProfiles(
  session: AssessmentSession
): ParticipantProfile[] {
  return session.participants.map((p) => computeParticipantProfile(session, p));
}

/**
 * De Team Quick Scan levert bewust géén individuele niveau-classificatie of
 * inzetadvies op (sectie 2B) — alleen een teamniveau-indruk.
 */
export function isIndividualLevelAvailable(depth: AssessmentDepth): boolean {
  return depth === "STANDARD";
}
