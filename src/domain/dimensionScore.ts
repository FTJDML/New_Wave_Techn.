import type { DimensionCode } from "./dimensions";
import { DIMENSION_CODES } from "./dimensions";
import { isNumericScore, type ScoreEntry } from "./scoreScale";
import { round1 } from "@/lib/utils";
import type { AnswerRecord } from "./types";

export interface DimensionStat {
  dimension: DimensionCode;
  /** Volledige precisie, voor interne berekeningen. */
  averagePrecise: number | null;
  /** Presentatiewaarde, afgerond op één decimaal. */
  averageRounded: number | null;
  observationCount: number;
}

/**
 * Bereken per competentiedimensie het gemiddelde van alle geobserveerde scores.
 * "Niet waargenomen" wordt genegeerd. Rond alleen de presentatiewaarde af;
 * de volledige precisie blijft behouden in averagePrecise.
 */
export function computeDimensionStats(
  answers: AnswerRecord[]
): Record<DimensionCode, DimensionStat> {
  const values: Record<DimensionCode, ScoreEntry[]> = {
    BIZ: [],
    DATA: [],
    GOV: [],
    ANALYTICS: [],
    AI: [],
    PROD: [],
    COMM: [],
    AUTO: [],
  };

  for (const answer of answers) {
    for (const dim of DIMENSION_CODES) {
      const score = answer.scores[dim];
      if (score !== undefined) {
        values[dim].push(score);
      }
    }
  }

  const result: Record<DimensionCode, DimensionStat> = {} as Record<
    DimensionCode,
    DimensionStat
  >;

  for (const dim of DIMENSION_CODES) {
    const numeric = values[dim].filter(isNumericScore);
    const count = numeric.length;
    const averagePrecise =
      count > 0 ? numeric.reduce<number>((a, b) => a + b, 0) / count : null;
    result[dim] = {
      dimension: dim,
      averagePrecise,
      averageRounded: averagePrecise === null ? null : round1(averagePrecise),
      observationCount: count,
    };
  }

  return result;
}

export function countConcreteExamples(answers: AnswerRecord[]): {
  concrete: number;
  measurable: number;
} {
  let concrete = 0;
  let measurable = 0;
  for (const a of answers) {
    if (a.evidenceQuality === "CONCRETE" || a.evidenceQuality === "CONCRETE_MEASURABLE") {
      concrete += 1;
    }
    if (a.evidenceQuality === "CONCRETE_MEASURABLE") {
      measurable += 1;
    }
  }
  return { concrete, measurable };
}
