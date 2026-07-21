import type { DimensionCode } from "./dimensions";
import type { DimensionStat } from "./dimensionScore";
import type { RoleDefinition } from "./roles";
import type { ConfidenceLevel } from "./confidence";
import { round1 } from "@/lib/utils";

export type IndicativeLevel = "FOUNDATION" | "JUNIOR" | "MEDIOR" | "SENIOR";

export const LEVEL_LABELS: Record<IndicativeLevel, string> = {
  FOUNDATION: "Foundation",
  JUNIOR: "Junior",
  MEDIOR: "Medior",
  SENIOR: "Senior",
};

export const LEVEL_ORDER: IndicativeLevel[] = ["FOUNDATION", "JUNIOR", "MEDIOR", "SENIOR"];

/** Voorlopige levelgrenzen (sectie 7). */
export function levelFromScore(score: number): IndicativeLevel {
  if (score < 1.5) return "FOUNDATION";
  if (score <= 2.39) return "JUNIOR";
  if (score <= 3.24) return "MEDIOR";
  return "SENIOR";
}

export interface GateCondition {
  id: string;
  description: string;
  passed: boolean;
  detail: string;
}

export interface GateResult {
  gate: "MEDIOR" | "SENIOR";
  passed: boolean;
  conditions: GateCondition[];
}

export interface LevelComputationInput {
  role: RoleDefinition;
  dimensionStats: Record<DimensionCode, DimensionStat>;
  confidence: ConfidenceLevel;
  concreteExampleCount: number;
}

export interface LevelResult {
  /** Gewogen totaalscore (volledige precisie) waarop het ruwe niveau is gebaseerd. */
  weightedScore: number;
  weightedScoreRounded: number;
  /** Niveau volgens de scoregrenzen, vóór toepassing van gates. */
  rawLevel: IndicativeLevel;
  /** Definitief niveau na toepassing van gates, of null bij onvoldoende bewijs. */
  level: IndicativeLevel | null;
  insufficientEvidence: boolean;
  insufficientEvidenceReasons: string[];
  medior: GateResult;
  senior: GateResult;
  capped: boolean;
  capExplanation: string[];
  missingDimensions: DimensionCode[];
}

export function computeWeightedScore(
  role: RoleDefinition,
  dimensionStats: Record<DimensionCode, DimensionStat>
): { score: number; missingDimensions: DimensionCode[] } {
  let total = 0;
  let weightSum = 0;
  const missing: DimensionCode[] = [];

  for (const [dim, weight] of Object.entries(role.weights) as [DimensionCode, number][]) {
    if (!weight) continue;
    const stat = dimensionStats[dim];
    const avg = stat.averagePrecise;
    if (avg === null) {
      missing.push(dim);
      total += 0;
    } else {
      total += avg * weight;
    }
    weightSum += weight;
  }

  const score = weightSum > 0 ? total / weightSum : 0;
  return { score, missingDimensions: missing };
}

function evaluateMediorGate(
  role: RoleDefinition,
  dimensionStats: Record<DimensionCode, DimensionStat>,
  insufficientEvidence: boolean
): GateResult {
  const conditions: GateCondition[] = [];

  for (const dim of role.criticalDimensions) {
    const stat = dimensionStats[dim];
    const avg = stat.averagePrecise;
    const passed = avg !== null && avg >= 2.0;
    conditions.push({
      id: `medior-critical-${dim}`,
      description: `Kritieke dimensie ${dim} ≥ 2,0`,
      passed,
      detail:
        avg === null
          ? `${dim} is niet waargenomen.`
          : `${dim} gemiddeld ${round1(avg)} (${stat.observationCount} observatie(s)).`,
    });
  }

  const autoStat = dimensionStats.AUTO;
  const autoPassed = autoStat.averagePrecise !== null && autoStat.averagePrecise >= 2.0;
  conditions.push({
    id: "medior-auto",
    description: "AUTO (autonomie) ≥ 2,0",
    passed: autoPassed,
    detail:
      autoStat.averagePrecise === null
        ? "AUTO is niet waargenomen."
        : `AUTO gemiddeld ${round1(autoStat.averagePrecise)} (${autoStat.observationCount} observatie(s)).`,
  });

  conditions.push({
    id: "medior-evidence",
    description: "Voldoende observatiebewijs beschikbaar",
    passed: !insufficientEvidence,
    detail: insufficientEvidence
      ? "Er is onvoldoende bewijs verzameld om dit gate te beoordelen."
      : "Er is voldoende observatiebewijs verzameld.",
  });

  if (role.requiresAnyTechnicalDimension) {
    const dims = role.requiresAnyTechnicalDimension;
    const passed = dims.some((d) => {
      const avg = dimensionStats[d].averagePrecise;
      return avg !== null && avg >= 2.0;
    });
    conditions.push({
      id: "medior-technical-dimension",
      description: `Minimaal één technische dimensie (${dims.join("/")}) ≥ 2,0`,
      passed,
      detail: dims
        .map((d) => `${d}: ${dimensionStats[d].averagePrecise === null ? "niet waargenomen" : round1(dimensionStats[d].averagePrecise as number)}`)
        .join(", "),
    });
  }

  const passed = conditions.every((c) => c.passed);
  return { gate: "MEDIOR", passed, conditions };
}

function evaluateSeniorGate(
  role: RoleDefinition,
  dimensionStats: Record<DimensionCode, DimensionStat>,
  confidence: ConfidenceLevel,
  concreteExampleCount: number
): GateResult {
  const conditions: GateCondition[] = [];

  for (const dim of role.criticalDimensions) {
    const stat = dimensionStats[dim];
    const avg = stat.averagePrecise;
    const passed = avg !== null && avg >= 3.0;
    conditions.push({
      id: `senior-critical-${dim}`,
      description: `Kritieke dimensie ${dim} ≥ 3,0`,
      passed,
      detail:
        avg === null
          ? `${dim} is niet waargenomen.`
          : `${dim} gemiddeld ${round1(avg)} (${stat.observationCount} observatie(s)).`,
    });

    conditions.push({
      id: `senior-critical-observed-${dim}`,
      description: `Kritieke dimensie ${dim} is waargenomen`,
      passed: stat.observationCount > 0,
      detail:
        stat.observationCount > 0
          ? `${dim} heeft ${stat.observationCount} observatie(s).`
          : `${dim} is niet waargenomen.`,
    });
  }

  const autoStat = dimensionStats.AUTO;
  const autoPassed = autoStat.averagePrecise !== null && autoStat.averagePrecise >= 3.0;
  conditions.push({
    id: "senior-auto",
    description: "AUTO (autonomie) ≥ 3,0",
    passed: autoPassed,
    detail:
      autoStat.averagePrecise === null
        ? "AUTO is niet waargenomen."
        : `AUTO gemiddeld ${round1(autoStat.averagePrecise)} (${autoStat.observationCount} observatie(s)).`,
  });

  const govMin = role.seniorGovMin ?? 2.5;
  const govStat = dimensionStats.GOV;
  const govPassed = govStat.averagePrecise !== null && govStat.averagePrecise >= govMin;
  conditions.push({
    id: "senior-gov",
    description: `GOV (governance) ≥ ${round1(govMin).toString().replace(".", ",")}`,
    passed: govPassed,
    detail:
      govStat.averagePrecise === null
        ? "GOV is niet waargenomen."
        : `GOV gemiddeld ${round1(govStat.averagePrecise)} (${govStat.observationCount} observatie(s)).`,
  });

  if (role.requiresAnyTechnicalDimension) {
    const dims = role.requiresAnyTechnicalDimension;
    const passed = dims.some((d) => {
      const avg = dimensionStats[d].averagePrecise;
      return avg !== null && avg >= 3.0;
    });
    conditions.push({
      id: "senior-technical-dimension",
      description: `Minimaal één technische dimensie (${dims.join("/")}) ≥ 3,0`,
      passed,
      detail: dims
        .map((d) => `${d}: ${dimensionStats[d].averagePrecise === null ? "niet waargenomen" : round1(dimensionStats[d].averagePrecise as number)}`)
        .join(", "),
    });
  }

  const confidencePassed = confidence === "MEDIUM" || confidence === "HIGH";
  conditions.push({
    id: "senior-confidence",
    description: "Confidence minimaal 'middel'",
    passed: confidencePassed,
    detail: `Huidige confidence: ${confidence}.`,
  });

  const examplesPassed = concreteExampleCount >= 2;
  conditions.push({
    id: "senior-examples",
    description: "Minimaal twee concrete praktijkvoorbeelden vastgelegd",
    passed: examplesPassed,
    detail: `${concreteExampleCount} concreet(e) voorbeeld(en) vastgelegd.`,
  });

  const passed = conditions.every((c) => c.passed);
  return { gate: "SENIOR", passed, conditions };
}

export function computeLevel(input: LevelComputationInput): LevelResult {
  const { role, dimensionStats, confidence, concreteExampleCount } = input;
  const { score: weightedScore, missingDimensions } = computeWeightedScore(role, dimensionStats);
  const rawLevel = levelFromScore(weightedScore);

  const insufficientEvidence = confidence === "INSUFFICIENT_EVIDENCE";
  const insufficientEvidenceReasons = insufficientEvidence
    ? [
        "Er is onvoldoende bewijs verzameld om een betrouwbare niveau-indicatie te geven.",
      ]
    : [];

  const medior = evaluateMediorGate(role, dimensionStats, insufficientEvidence);
  const senior = evaluateSeniorGate(role, dimensionStats, confidence, concreteExampleCount);

  if (insufficientEvidence) {
    return {
      weightedScore,
      weightedScoreRounded: round1(weightedScore),
      rawLevel,
      level: null,
      insufficientEvidence: true,
      insufficientEvidenceReasons,
      medior,
      senior,
      capped: false,
      capExplanation: [],
      missingDimensions,
    };
  }

  let level: IndicativeLevel = rawLevel;
  let capped = false;
  const capExplanation: string[] = [];

  if (rawLevel === "SENIOR") {
    if (senior.passed) {
      level = "SENIOR";
    } else if (medior.passed) {
      level = "MEDIOR";
      capped = true;
      capExplanation.push(
        "De gewogen score wijst op Senior, maar niet alle Senior-gates zijn gehaald. Resultaat is daarom gecapt op Medior."
      );
      capExplanation.push(
        ...senior.conditions.filter((c) => !c.passed).map((c) => `Niet gehaald: ${c.description} — ${c.detail}`)
      );
    } else {
      level = "JUNIOR";
      capped = true;
      capExplanation.push(
        "De gewogen score wijst op Senior, maar zowel de Senior- als de Medior-gates zijn niet gehaald. Resultaat is daarom gecapt op Junior."
      );
      capExplanation.push(
        ...senior.conditions.filter((c) => !c.passed).map((c) => `Senior-gate niet gehaald: ${c.description} — ${c.detail}`)
      );
      capExplanation.push(
        ...medior.conditions.filter((c) => !c.passed).map((c) => `Medior-gate niet gehaald: ${c.description} — ${c.detail}`)
      );
    }
  } else if (rawLevel === "MEDIOR") {
    if (medior.passed) {
      level = "MEDIOR";
    } else {
      level = "JUNIOR";
      capped = true;
      capExplanation.push(
        "De gewogen score wijst op Medior, maar niet alle Medior-gates zijn gehaald. Resultaat is daarom gecapt op Junior."
      );
      capExplanation.push(
        ...medior.conditions.filter((c) => !c.passed).map((c) => `Niet gehaald: ${c.description} — ${c.detail}`)
      );
    }
  }

  return {
    weightedScore,
    weightedScoreRounded: round1(weightedScore),
    rawLevel,
    level,
    insufficientEvidence: false,
    insufficientEvidenceReasons,
    medior,
    senior,
    capped,
    capExplanation,
    missingDimensions,
  };
}
