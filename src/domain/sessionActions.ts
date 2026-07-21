import { createId } from "@/lib/utils";
import { QUESTION_BANK_VERSION } from "@/data/questionBank.nl";
import { buildQuestionPlan } from "./questionPlan";
import type {
  AnswerRecord,
  AssessmentSession,
  Participant,
  ProjectNeed,
  SessionSettings,
} from "./types";
import type { DimensionCode } from "./dimensions";
import type { ScoreEntry } from "./scoreScale";

export function createEmptyAnswer(participantId: string, questionId: string): AnswerRecord {
  return {
    participantId,
    questionId,
    notes: "",
    evidenceQuality: "NONE",
    scores: {},
    facilitatorConfidence: null,
    observationTags: [],
    answered: false,
    updatedAt: new Date().toISOString(),
  };
}

export function createSession(
  settings: SessionSettings,
  participants: Omit<Participant, "id" | "order">[],
  projectNeeds: Omit<ProjectNeed, "id">[],
  nowIso: string
): AssessmentSession {
  const fullParticipants: Participant[] = participants.map((p, index) => ({
    ...p,
    id: createId("participant"),
    order: index,
  }));

  const questionPlan: Record<string, string[]> = {};
  for (const participant of fullParticipants) {
    questionPlan[participant.id] = buildQuestionPlan(participant, settings.depth);
  }

  return {
    id: createId("session"),
    schemaVersion: 1,
    questionBankVersion: QUESTION_BANK_VERSION,
    settings,
    participants: fullParticipants,
    projectNeeds: projectNeeds.map((n) => ({ ...n, id: createId("need") })),
    questionPlan,
    answers: [],
    auditLog: [],
    reviews: {},
    progress: {
      currentQuestionIndex: 0,
      currentParticipantIndex: 0,
      questionStartedAt: null,
      totalStartedAt: null,
      completed: false,
    },
    createdAt: nowIso,
    updatedAt: nowIso,
    deletedAt: null,
  };
}

function findAnswer(
  session: AssessmentSession,
  participantId: string,
  questionId: string
): AnswerRecord | undefined {
  return session.answers.find(
    (a) => a.participantId === participantId && a.questionId === questionId
  );
}

export interface UpsertAnswerOptions {
  /** Verplicht wanneer een score van een reeds bevestigd ("besproken") resultaat wijzigt. */
  changeReason?: string;
  nowIso: string;
}

/**
 * Werk een antwoord bij. Wanneer de deelnemer al als "besproken resultaat" is
 * bevestigd en een score daadwerkelijk wijzigt, wordt dit vastgelegd in het
 * wijzigingslog met oude score, nieuwe score, tijdstip en reden (sectie 13).
 */
export function upsertAnswer(
  session: AssessmentSession,
  participantId: string,
  questionId: string,
  patch: Partial<Pick<AnswerRecord, "notes" | "evidenceQuality" | "facilitatorConfidence" | "observationTags" | "answered">> & {
    scores?: Partial<Record<DimensionCode, ScoreEntry>>;
  },
  options: UpsertAnswerOptions
): AssessmentSession {
  const existing = findAnswer(session, participantId, questionId);
  const base = existing ?? createEmptyAnswer(participantId, questionId);
  const isConfirmed = session.reviews[participantId]?.reviewConfirmed === true;

  const newAuditEntries = [];

  if (patch.scores) {
    for (const [dim, newScore] of Object.entries(patch.scores) as [DimensionCode, ScoreEntry][]) {
      const oldScore = base.scores[dim] ?? null;
      if (isConfirmed && oldScore !== newScore) {
        newAuditEntries.push({
          id: createId("audit"),
          participantId,
          questionId,
          dimension: dim,
          oldScore,
          newScore,
          timestamp: options.nowIso,
          reason: options.changeReason?.trim() || "Geen reden opgegeven",
        });
      }
    }
  }

  const updatedAnswer: AnswerRecord = {
    ...base,
    ...patch,
    scores: { ...base.scores, ...(patch.scores ?? {}) },
    updatedAt: options.nowIso,
  };

  const answers = existing
    ? session.answers.map((a) => (a === existing ? updatedAnswer : a))
    : [...session.answers, updatedAnswer];

  return {
    ...session,
    answers,
    auditLog: [...session.auditLog, ...newAuditEntries],
    updatedAt: options.nowIso,
  };
}

export function setParticipantReview(
  session: AssessmentSession,
  participantId: string,
  patch: { reviewNote?: string; correctionOpportunityGiven?: boolean; reviewConfirmed?: boolean },
  nowIso: string
): AssessmentSession {
  const existing = session.reviews[participantId] ?? {
    reviewConfirmed: false,
    reviewNote: "",
    correctionOpportunityGiven: false,
  };

  const updated = {
    ...existing,
    ...patch,
    reviewConfirmedAt:
      patch.reviewConfirmed === true ? nowIso : existing.reviewConfirmedAt,
  };

  return {
    ...session,
    reviews: { ...session.reviews, [participantId]: updated },
    updatedAt: nowIso,
  };
}

export function appendQuestionsToPlan(
  session: AssessmentSession,
  participantId: string,
  questionIds: string[],
  nowIso: string
): AssessmentSession {
  const current = session.questionPlan[participantId] ?? [];
  const additions = questionIds.filter((id) => !current.includes(id));
  if (additions.length === 0) return session;
  return {
    ...session,
    questionPlan: {
      ...session.questionPlan,
      [participantId]: [...current, ...additions],
    },
    updatedAt: nowIso,
  };
}

export function softDeleteSession(session: AssessmentSession, nowIso: string): AssessmentSession {
  return { ...session, deletedAt: nowIso, updatedAt: nowIso };
}
