import type {
  AnswerRecord,
  AssessmentSession,
  EvidenceQuality,
  FacilitatorConfidence,
  Participant,
} from "@/domain/types";
import type { DimensionCode } from "@/domain/dimensions";
import type { ScoreEntry } from "@/domain/scoreScale";
import type { RoleId } from "@/domain/roles";

let counter = 0;
export function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter}`;
}

export function makeParticipant(overrides: Partial<Participant> = {}): Participant {
  return {
    id: nextId("participant"),
    pseudonym: "Deelnemer X",
    primaryRole: "DATA_ANALYST",
    order: 0,
    ...overrides,
  };
}

export function makeAnswer(
  participantId: string,
  questionId: string,
  scores: Partial<Record<DimensionCode, ScoreEntry>>,
  opts: {
    evidenceQuality?: EvidenceQuality;
    facilitatorConfidence?: FacilitatorConfidence | null;
    answered?: boolean;
  } = {}
): AnswerRecord {
  return {
    participantId,
    questionId,
    notes: "Testnotitie",
    evidenceQuality: opts.evidenceQuality ?? "CONCRETE",
    scores,
    facilitatorConfidence: opts.facilitatorConfidence ?? "MEDIUM",
    observationTags: [],
    answered: opts.answered ?? true,
    updatedAt: new Date(2026, 0, 1).toISOString(),
  };
}

export function makeSession(overrides: Partial<AssessmentSession> = {}): AssessmentSession {
  const now = new Date(2026, 0, 1).toISOString();
  return {
    id: nextId("session"),
    schemaVersion: 1,
    questionBankVersion: "1.0.0",
    settings: {
      sessionName: "Testsessie",
      projectName: "Fictief Ahold-project",
      projectContext: "Fictieve testcontext",
      facilitatorName: "FD",
      date: "2026-07-20",
      depth: "STANDARD",
      order: "ROUND_ROBIN",
      language: "nl",
    },
    participants: [],
    projectNeeds: [],
    questionPlan: {},
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
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  };
}

/**
 * Bouwt een sessie met precies één deelnemer en een vaste set antwoorden,
 * plus een question plan met `plannedCount` vragen (default = aantal antwoorden).
 */
export function buildPersonaSession(
  primaryRole: RoleId,
  dimensionScores: Partial<Record<DimensionCode, ScoreEntry[]>>,
  opts: {
    evidenceQuality?: EvidenceQuality[];
    plannedCount?: number;
    secondaryRole?: RoleId;
  } = {}
): { session: AssessmentSession; participant: Participant } {
  const participant = makeParticipant({ primaryRole, secondaryRole: opts.secondaryRole });

  const answers: AnswerRecord[] = [];
  const maxObservations = Math.max(
    ...Object.values(dimensionScores).map((arr) => (arr ? arr.length : 0)),
    1
  );

  for (let i = 0; i < maxObservations; i++) {
    const scores: Partial<Record<DimensionCode, ScoreEntry>> = {};
    for (const [dim, values] of Object.entries(dimensionScores) as [
      DimensionCode,
      ScoreEntry[] | undefined,
    ][]) {
      if (values && values[i] !== undefined) {
        scores[dim] = values[i];
      }
    }
    const evidenceQuality = opts.evidenceQuality?.[i] ?? "CONCRETE";
    answers.push(makeAnswer(participant.id, `q-${i}`, scores, { evidenceQuality }));
  }

  const plannedCount = opts.plannedCount ?? answers.length;
  const plannedIds = Array.from({ length: plannedCount }, (_, i) => `q-${i}`);

  const session = makeSession({
    participants: [participant],
    questionPlan: { [participant.id]: plannedIds },
    answers,
  });

  return { session, participant };
}
