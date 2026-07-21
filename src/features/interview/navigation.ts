import type { AssessmentSession, InterviewOrder } from "@/domain/types";

export interface InterviewStep {
  participantId: string;
  participantIndex: number;
  questionIndex: number;
  questionId: string;
}

/**
 * Bouwt de lineaire volgorde van interviewstappen op basis van de gekozen
 * interviewvolgorde (sectie 2). Deelnemers kunnen een verschillend aantal
 * vragen hebben (bijv. Generalisten met dynamische vervolgvragen, of een
 * optionele secundaire-rolvraag) — stappen die voor een deelnemer niet
 * bestaan worden overgeslagen.
 */
export function buildStepSequence(session: AssessmentSession): InterviewStep[] {
  const participants = [...session.participants].sort((a, b) => a.order - b.order);
  const steps: InterviewStep[] = [];

  if (session.settings.order === "PERSON_BY_PERSON") {
    for (const p of participants) {
      const plan = session.questionPlan[p.id] ?? [];
      plan.forEach((questionId, questionIndex) => {
        steps.push({ participantId: p.id, participantIndex: p.order, questionIndex, questionId });
      });
    }
    return steps;
  }

  const maxLen = participants.reduce(
    (max, p) => Math.max(max, (session.questionPlan[p.id] ?? []).length),
    0
  );
  for (let questionIndex = 0; questionIndex < maxLen; questionIndex++) {
    for (const p of participants) {
      const plan = session.questionPlan[p.id] ?? [];
      if (questionIndex < plan.length) {
        steps.push({ participantId: p.id, participantIndex: p.order, questionIndex, questionId: plan[questionIndex] });
      }
    }
  }
  return steps;
}

export function findStepPosition(
  steps: InterviewStep[],
  participantIndex: number,
  questionIndex: number
): number {
  const pos = steps.findIndex(
    (s) => s.participantIndex === participantIndex && s.questionIndex === questionIndex
  );
  return pos >= 0 ? pos : 0;
}

export function goPrevious(currentPos: number): number {
  return Math.max(0, currentPos - 1);
}

export function goNextQuestion(
  steps: InterviewStep[],
  currentPos: number,
  order: InterviewOrder
): number {
  const current = steps[currentPos];
  if (!current) return currentPos;

  if (order === "PERSON_BY_PERSON") {
    const next = steps[currentPos + 1];
    if (next && next.participantIndex === current.participantIndex) {
      return currentPos + 1;
    }
    return currentPos;
  }

  const nextIndex = steps.findIndex(
    (s, i) => i > currentPos && s.questionIndex > current.questionIndex
  );
  return nextIndex >= 0 ? nextIndex : currentPos;
}

export function goNextParticipant(
  steps: InterviewStep[],
  currentPos: number,
  order: InterviewOrder
): number {
  const current = steps[currentPos];
  if (!current) return currentPos;

  if (order === "ROUND_ROBIN") {
    const sameSlot = steps.filter((s) => s.questionIndex === current.questionIndex);
    const idxWithinSlot = sameSlot.findIndex((s) => s.participantIndex === current.participantIndex);
    const next = sameSlot[(idxWithinSlot + 1) % sameSlot.length];
    return steps.findIndex((s) => s === next);
  }

  const nextIndex = steps.findIndex(
    (s, i) => i > currentPos && s.participantIndex !== current.participantIndex
  );
  return nextIndex >= 0 ? nextIndex : currentPos;
}

export function isLastStep(steps: InterviewStep[], currentPos: number): boolean {
  return currentPos >= steps.length - 1;
}
