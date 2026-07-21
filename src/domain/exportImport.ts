import { z } from "zod";
import { DIMENSION_CODES } from "./dimensions";
import { ROLE_IDS } from "./roles";
import type { AssessmentSession } from "./types";

const scoreEntrySchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal("NOT_OBSERVED"),
]);

const dimensionCodeSchema = z.enum(DIMENSION_CODES);
const roleIdSchema = z.enum(ROLE_IDS);

const scoresSchema = z.record(dimensionCodeSchema, scoreEntrySchema);

const answerRecordSchema = z.object({
  participantId: z.string(),
  questionId: z.string(),
  notes: z.string(),
  evidenceQuality: z.enum(["NONE", "GENERAL", "CONCRETE", "CONCRETE_MEASURABLE"]),
  scores: scoresSchema,
  facilitatorConfidence: z.enum(["LOW", "MEDIUM", "HIGH"]).nullable(),
  observationTags: z.array(z.enum(["STRENGTH", "DEVELOPMENT", "NEEDS_VALIDATION"])),
  answered: z.boolean(),
  updatedAt: z.string(),
});

const auditLogEntrySchema = z.object({
  id: z.string(),
  participantId: z.string(),
  questionId: z.string(),
  dimension: dimensionCodeSchema,
  oldScore: scoreEntrySchema.nullable(),
  newScore: scoreEntrySchema.nullable(),
  timestamp: z.string(),
  reason: z.string(),
});

const participantReviewSchema = z.object({
  reviewConfirmed: z.boolean(),
  reviewConfirmedAt: z.string().optional(),
  reviewNote: z.string(),
  correctionOpportunityGiven: z.boolean(),
});

const projectNeedSchema = z.object({
  id: z.string(),
  role: roleIdSchema,
  level: z.enum(["FOUNDATION", "JUNIOR", "MEDIOR", "SENIOR"]),
  count: z.number().int().nonnegative(),
  note: z.string().optional(),
});

const participantSchema = z.object({
  id: z.string(),
  pseudonym: z.string(),
  currentJobTitle: z.string().optional(),
  primaryRole: roleIdSchema,
  secondaryRole: roleIdSchema.optional(),
  order: z.number().int().nonnegative(),
});

const sessionSettingsSchema = z.object({
  sessionName: z.string(),
  projectName: z.string(),
  projectContext: z.string(),
  facilitatorName: z.string(),
  date: z.string(),
  depth: z.enum(["STANDARD", "QUICK_SCAN"]),
  order: z.enum(["ROUND_ROBIN", "PERSON_BY_PERSON"]),
  language: z.literal("nl"),
});

const interviewProgressSchema = z.object({
  currentQuestionIndex: z.number().int().nonnegative(),
  currentParticipantIndex: z.number().int().nonnegative(),
  questionStartedAt: z.string().nullable(),
  totalStartedAt: z.string().nullable(),
  completed: z.boolean(),
});

export const assessmentSessionSchema = z.object({
  id: z.string(),
  schemaVersion: z.number(),
  questionBankVersion: z.string(),
  settings: sessionSettingsSchema,
  participants: z.array(participantSchema),
  projectNeeds: z.array(projectNeedSchema),
  questionPlan: z.record(z.string(), z.array(z.string())),
  answers: z.array(answerRecordSchema),
  auditLog: z.array(auditLogEntrySchema),
  reviews: z.record(z.string(), participantReviewSchema),
  progress: interviewProgressSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable().optional(),
});

export function serializeSessionExport(session: AssessmentSession): string {
  return JSON.stringify(session, null, 2);
}

export class SessionImportError extends Error {}

export function parseSessionExport(raw: string): AssessmentSession {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new SessionImportError(
      "Het bestand is geen geldig JSON-bestand. Controleer of het een eerder geëxporteerde sessie is."
    );
  }

  const result = assessmentSessionSchema.safeParse(json);
  if (!result.success) {
    throw new SessionImportError(
      `Het bestand voldoet niet aan het verwachte sessieformaat: ${result.error.issues
        .slice(0, 3)
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ")}`
    );
  }

  return result.data as AssessmentSession;
}
