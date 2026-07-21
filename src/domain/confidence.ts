import type { DimensionStat } from "./dimensionScore";
import type { DimensionCode } from "./dimensions";
import type { RoleDefinition } from "./roles";

export type ConfidenceLevel = "INSUFFICIENT_EVIDENCE" | "LOW" | "MEDIUM" | "HIGH";

export const CONFIDENCE_LABELS: Record<ConfidenceLevel, string> = {
  INSUFFICIENT_EVIDENCE: "Onvoldoende bewijs",
  LOW: "Laag",
  MEDIUM: "Middel",
  HIGH: "Hoog",
};

export interface ConfidenceInput {
  role: RoleDefinition;
  dimensionStats: Record<DimensionCode, DimensionStat>;
  answeredQuestions: number;
  plannedQuestions: number;
  concreteExampleCount: number;
  measurableExampleCount: number;
}

export interface ConfidenceResult {
  level: ConfidenceLevel;
  answeredRatio: number;
  reasons: string[];
}

/**
 * Bepaal de confidence-indicatie van de facilitator over het beoordeelde profiel
 * (sectie 7). De logica evalueert van strengste (Hoog) naar minst strenge eis,
 * met een expliciete "onvoldoende bewijs"-uitsluiting vooraf.
 */
export function computeConfidence(input: ConfidenceInput): ConfidenceResult {
  const { role, dimensionStats, answeredQuestions, plannedQuestions } = input;
  const answeredRatio =
    plannedQuestions > 0 ? answeredQuestions / plannedQuestions : 0;
  const criticalDims = role.criticalDimensions;

  const criticalWithNoObservation = criticalDims.filter(
    (d) => dimensionStats[d].observationCount === 0
  );

  if (answeredRatio < 0.8 || criticalWithNoObservation.length > 0) {
    const reasons: string[] = [];
    if (answeredRatio < 0.8) {
      reasons.push(
        `Minder dan 80% van de geplande vragen beantwoord (${Math.round(answeredRatio * 100)}%).`
      );
    }
    if (criticalWithNoObservation.length > 0) {
      reasons.push(
        `Geen observatie voor kritieke dimensie(s): ${criticalWithNoObservation.join(", ")}.`
      );
    }
    return { level: "INSUFFICIENT_EVIDENCE", answeredRatio, reasons };
  }

  const allCriticalMultiple = criticalDims.every(
    (d) => dimensionStats[d].observationCount >= 2
  );
  const atLeastThreeConcrete = input.concreteExampleCount >= 3;
  const atLeastOneMeasurable = input.measurableExampleCount >= 1;
  const highRatioMet = answeredRatio >= 0.9;

  if (allCriticalMultiple && atLeastThreeConcrete && atLeastOneMeasurable && highRatioMet) {
    return {
      level: "HIGH",
      answeredRatio,
      reasons: [
        "Alle kritieke dimensies hebben meerdere observaties.",
        "Minimaal drie concrete voorbeelden vastgelegd, waarvan minimaal één met meetbaar resultaat.",
        "Minimaal 90% van de vragen beantwoord.",
      ],
    };
  }

  const allCriticalObserved = criticalDims.every(
    (d) => dimensionStats[d].observationCount >= 1
  );
  const atLeastTwoConcrete = input.concreteExampleCount >= 2;

  if (allCriticalObserved && atLeastTwoConcrete && answeredRatio >= 0.8) {
    return {
      level: "MEDIUM",
      answeredRatio,
      reasons: [
        "Alle kritieke dimensies zijn geobserveerd.",
        "Minimaal twee concrete voorbeelden vastgelegd.",
        "Minimaal 80% van de vragen beantwoord.",
      ],
    };
  }

  const reasons: string[] = [];
  const criticalWithSingleObservation = criticalDims.filter(
    (d) => dimensionStats[d].observationCount === 1
  );
  if (criticalWithSingleObservation.length > 0) {
    reasons.push(
      `Kritieke dimensie(s) met maar één observatie: ${criticalWithSingleObservation.join(", ")}.`
    );
  }
  if (input.concreteExampleCount === 0) {
    reasons.push("Geen concreet praktijkvoorbeeld vastgelegd.");
  }
  if (reasons.length === 0) {
    reasons.push(
      "Niet voldaan aan de voorwaarden voor middel of hoog vertrouwen (bijv. minder dan twee concrete voorbeelden)."
    );
  }

  return { level: "LOW", answeredRatio, reasons };
}
