import type { DimensionCode } from "./dimensions";
import type { ScoreEntry } from "./scoreScale";
import type { RoleId } from "./roles";

export type AssessmentDepth = "STANDARD" | "QUICK_SCAN";
export type InterviewOrder = "ROUND_ROBIN" | "PERSON_BY_PERSON";
export type Language = "nl";

export type EvidenceQuality =
  | "NONE"
  | "GENERAL"
  | "CONCRETE"
  | "CONCRETE_MEASURABLE";

export const EVIDENCE_QUALITY_LABELS: Record<EvidenceQuality, string> = {
  NONE: "Geen concreet bewijs",
  GENERAL: "Algemeen of theoretisch antwoord",
  CONCRETE: "Concreet praktijkvoorbeeld",
  CONCRETE_MEASURABLE: "Concreet voorbeeld met meetbaar resultaat",
};

export type FacilitatorConfidence = "LOW" | "MEDIUM" | "HIGH";

export const FACILITATOR_CONFIDENCE_LABELS: Record<FacilitatorConfidence, string> = {
  LOW: "Laag",
  MEDIUM: "Middel",
  HIGH: "Hoog",
};

export type ObservationTag =
  | "STRENGTH"
  | "DEVELOPMENT"
  | "NEEDS_VALIDATION";

export const OBSERVATION_TAG_LABELS: Record<ObservationTag, string> = {
  STRENGTH: "Sterke competentie",
  DEVELOPMENT: "Mogelijk ontwikkelpunt",
  NEEDS_VALIDATION: "Aanvullende validatie nodig",
};

export interface ProjectNeed {
  id: string;
  role: RoleId;
  level: "FOUNDATION" | "JUNIOR" | "MEDIOR" | "SENIOR";
  count: number;
  note?: string;
}

export interface Participant {
  id: string;
  pseudonym: string;
  currentJobTitle?: string;
  primaryRole: RoleId;
  secondaryRole?: RoleId;
  order: number;
}

export interface AnswerRecord {
  participantId: string;
  questionId: string;
  notes: string;
  evidenceQuality: EvidenceQuality;
  /** Scores per dimensie die aan deze vraag gekoppeld is. */
  scores: Partial<Record<DimensionCode, ScoreEntry>>;
  facilitatorConfidence: FacilitatorConfidence | null;
  observationTags: ObservationTag[];
  answered: boolean;
  updatedAt: string;
}

export interface AuditLogEntry {
  id: string;
  participantId: string;
  questionId: string;
  dimension: DimensionCode;
  oldScore: ScoreEntry | null;
  newScore: ScoreEntry | null;
  timestamp: string;
  reason: string;
}

export interface ParticipantReview {
  reviewConfirmed: boolean;
  reviewConfirmedAt?: string;
  reviewNote: string;
  correctionOpportunityGiven: boolean;
}

export interface SessionSettings {
  sessionName: string;
  projectName: string;
  projectContext: string;
  facilitatorName: string;
  date: string;
  depth: AssessmentDepth;
  order: InterviewOrder;
  language: Language;
}

export interface InterviewProgress {
  currentQuestionIndex: number;
  currentParticipantIndex: number;
  questionStartedAt: string | null;
  totalStartedAt: string | null;
  completed: boolean;
}

export interface AssessmentSession {
  id: string;
  schemaVersion: number;
  questionBankVersion: string;
  settings: SessionSettings;
  participants: Participant[];
  projectNeeds: ProjectNeed[];
  /** Vragen-IDs die voor deze sessie zijn samengesteld, in volgorde. */
  questionPlan: Record<string, string[]>; // participantId -> question ids (order kan per generalist verschillen)
  answers: AnswerRecord[];
  auditLog: AuditLogEntry[];
  reviews: Record<string, ParticipantReview>; // participantId -> review
  progress: InterviewProgress;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}
