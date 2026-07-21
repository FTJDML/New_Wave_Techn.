import { describe, expect, it } from "vitest";
import { levelFromScore, computeLevel } from "@/domain/levels";
import { computeDimensionStats } from "@/domain/dimensionScore";
import { ROLES } from "@/domain/roles";
import { makeAnswer } from "../fixtures";
import type { DimensionCode } from "@/domain/dimensions";
import type { ScoreEntry } from "@/domain/scoreScale";

describe("levelFromScore (levelgrenzen)", () => {
  it("classificeert Foundation onder 1,50", () => {
    expect(levelFromScore(0)).toBe("FOUNDATION");
    expect(levelFromScore(1.49)).toBe("FOUNDATION");
  });
  it("classificeert Junior van 1,50 tot en met 2,39", () => {
    expect(levelFromScore(1.5)).toBe("JUNIOR");
    expect(levelFromScore(2.39)).toBe("JUNIOR");
  });
  it("classificeert Medior van 2,40 tot en met 3,24", () => {
    expect(levelFromScore(2.4)).toBe("MEDIOR");
    expect(levelFromScore(3.24)).toBe("MEDIOR");
  });
  it("classificeert Senior van 3,25 tot en met 4,00", () => {
    expect(levelFromScore(3.25)).toBe("SENIOR");
    expect(levelFromScore(4)).toBe("SENIOR");
  });
});

function statsFrom(scores: Partial<Record<DimensionCode, number[]>>) {
  const answers = (Object.entries(scores) as [DimensionCode, number[]][]).flatMap(
    ([dim, values]) =>
      values.map((v, i) =>
        makeAnswer("p1", `${dim}-${i}`, { [dim]: v as ScoreEntry } as Partial<
          Record<DimensionCode, ScoreEntry>
        >)
      )
  );
  return computeDimensionStats(answers);
}

describe("Medior-gates", () => {
  it("slaagt wanneer alle kritieke dimensies en AUTO minimaal 2,0 zijn met voldoende bewijs", () => {
    const role = ROLES.DATA_ANALYST; // kritiek: BIZ, DATA, ANALYTICS, COMM
    const stats = statsFrom({
      BIZ: [2.5, 2.5],
      DATA: [2.2, 2.2],
      ANALYTICS: [2.4, 2.4],
      COMM: [2.1, 2.1],
      AUTO: [2.0, 2.0],
      GOV: [2.0],
      AI: [2.0],
      PROD: [2.0],
    });
    const result = computeLevel({
      role,
      dimensionStats: stats,
      confidence: "MEDIUM",
      concreteExampleCount: 2,
    });
    expect(result.medior.passed).toBe(true);
  });

  it("faalt wanneer een kritieke dimensie onder 2,0 zit", () => {
    const role = ROLES.DATA_ANALYST;
    const stats = statsFrom({
      BIZ: [1.0, 1.0],
      DATA: [2.5, 2.5],
      ANALYTICS: [2.5, 2.5],
      COMM: [2.5, 2.5],
      AUTO: [2.5],
    });
    const result = computeLevel({
      role,
      dimensionStats: stats,
      confidence: "MEDIUM",
      concreteExampleCount: 2,
    });
    expect(result.medior.passed).toBe(false);
    const bizCondition = result.medior.conditions.find((c) => c.id === "medior-critical-BIZ");
    expect(bizCondition?.passed).toBe(false);
  });

  it("faalt wanneer AUTO onder 2,0 zit", () => {
    const role = ROLES.DATA_ANALYST;
    const stats = statsFrom({
      BIZ: [2.5, 2.5],
      DATA: [2.5, 2.5],
      ANALYTICS: [2.5, 2.5],
      COMM: [2.5, 2.5],
      AUTO: [1.0],
    });
    const result = computeLevel({
      role,
      dimensionStats: stats,
      confidence: "MEDIUM",
      concreteExampleCount: 2,
    });
    expect(result.medior.passed).toBe(false);
  });
});

describe("Senior-gates", () => {
  const role = ROLES.DATA_ENGINEER; // kritiek: DATA, GOV, PROD

  it("slaagt wanneer alle voorwaarden zijn vervuld", () => {
    const stats = statsFrom({
      DATA: [3.5, 3.5],
      GOV: [3.0, 3.0],
      PROD: [3.5, 3.5],
      AUTO: [3.2, 3.2],
      BIZ: [3.0],
      ANALYTICS: [3.0],
      AI: [3.0],
      COMM: [3.0],
    });
    const result = computeLevel({
      role,
      dimensionStats: stats,
      confidence: "HIGH",
      concreteExampleCount: 3,
    });
    expect(result.senior.passed).toBe(true);
  });

  it("faalt wanneer GOV onder 2,5 blijft", () => {
    const stats = statsFrom({
      DATA: [3.5, 3.5],
      GOV: [2.0, 2.0],
      PROD: [3.5, 3.5],
      AUTO: [3.2, 3.2],
    });
    const result = computeLevel({
      role,
      dimensionStats: stats,
      confidence: "HIGH",
      concreteExampleCount: 3,
    });
    expect(result.senior.passed).toBe(false);
    expect(result.senior.conditions.find((c) => c.id === "senior-gov")?.passed).toBe(false);
  });

  it("faalt wanneer confidence lager is dan middel", () => {
    const stats = statsFrom({
      DATA: [3.5, 3.5],
      GOV: [3.0, 3.0],
      PROD: [3.5, 3.5],
      AUTO: [3.2, 3.2],
    });
    const result = computeLevel({
      role,
      dimensionStats: stats,
      confidence: "LOW",
      concreteExampleCount: 3,
    });
    expect(result.senior.passed).toBe(false);
  });

  it("faalt wanneer er minder dan twee concrete voorbeelden zijn", () => {
    const stats = statsFrom({
      DATA: [3.5, 3.5],
      GOV: [3.0, 3.0],
      PROD: [3.5, 3.5],
      AUTO: [3.2, 3.2],
    });
    const result = computeLevel({
      role,
      dimensionStats: stats,
      confidence: "HIGH",
      concreteExampleCount: 1,
    });
    expect(result.senior.passed).toBe(false);
  });

  it("cap: een Senior-score zonder gehaalde Senior-gate wordt gecapt op Medior, met uitleg", () => {
    // Weighted score wijst op Senior (alle dims hoog), maar confidence is te laag.
    const stats = statsFrom({
      DATA: [3.8, 3.8],
      GOV: [3.6, 3.6],
      PROD: [3.8, 3.8],
      AUTO: [3.6, 3.6],
      BIZ: [3.6],
      ANALYTICS: [3.6],
      AI: [3.6],
      COMM: [3.6],
    });
    const result = computeLevel({
      role,
      dimensionStats: stats,
      confidence: "LOW",
      concreteExampleCount: 3,
    });
    expect(result.rawLevel).toBe("SENIOR");
    expect(result.level).toBe("MEDIOR");
    expect(result.capped).toBe(true);
    expect(result.capExplanation.length).toBeGreaterThan(0);
  });
});

describe("Onvoldoende bewijs", () => {
  it("levert level=null op wanneer confidence INSUFFICIENT_EVIDENCE is", () => {
    const role = ROLES.DATA_SCIENTIST;
    const stats = statsFrom({ BIZ: [3.0], DATA: [3.0] }); // AI en ANALYTICS niet waargenomen
    const result = computeLevel({
      role,
      dimensionStats: stats,
      confidence: "INSUFFICIENT_EVIDENCE",
      concreteExampleCount: 0,
    });
    expect(result.level).toBeNull();
    expect(result.insufficientEvidence).toBe(true);
  });
});
