import { describe, expect, it } from "vitest";
import { computeConfidence } from "@/domain/confidence";
import { computeDimensionStats } from "@/domain/dimensionScore";
import { ROLES } from "@/domain/roles";
import { makeAnswer } from "../fixtures";
import type { DimensionCode } from "@/domain/dimensions";
import type { ScoreEntry } from "@/domain/scoreScale";

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

describe("computeConfidence", () => {
  const role = ROLES.DATA_ANALYST; // kritiek: BIZ, DATA, ANALYTICS, COMM

  it("is INSUFFICIENT_EVIDENCE wanneer minder dan 80% van de vragen is beantwoord", () => {
    const stats = statsFrom({ BIZ: [3], DATA: [3], ANALYTICS: [3], COMM: [3] });
    const result = computeConfidence({
      role,
      dimensionStats: stats,
      answeredQuestions: 5,
      plannedQuestions: 10,
      concreteExampleCount: 2,
      measurableExampleCount: 0,
    });
    expect(result.level).toBe("INSUFFICIENT_EVIDENCE");
  });

  it("is INSUFFICIENT_EVIDENCE wanneer een kritieke dimensie geen observatie heeft", () => {
    const stats = statsFrom({ BIZ: [3], DATA: [3], ANALYTICS: [] });
    const result = computeConfidence({
      role,
      dimensionStats: stats,
      answeredQuestions: 9,
      plannedQuestions: 10,
      concreteExampleCount: 2,
      measurableExampleCount: 0,
    });
    expect(result.level).toBe("INSUFFICIENT_EVIDENCE");
  });

  it("is LOW wanneer geen concreet voorbeeld is vastgelegd", () => {
    const stats = statsFrom({ BIZ: [3, 3], DATA: [3, 3], ANALYTICS: [3, 3], COMM: [3, 3] });
    const result = computeConfidence({
      role,
      dimensionStats: stats,
      answeredQuestions: 10,
      plannedQuestions: 10,
      concreteExampleCount: 0,
      measurableExampleCount: 0,
    });
    expect(result.level).toBe("LOW");
  });

  it("is MEDIUM wanneer alle kritieke dims geobserveerd zijn, 2 concrete voorbeelden en >=80% beantwoord", () => {
    const stats = statsFrom({ BIZ: [3], DATA: [3], ANALYTICS: [3], COMM: [3] });
    const result = computeConfidence({
      role,
      dimensionStats: stats,
      answeredQuestions: 8,
      plannedQuestions: 10,
      concreteExampleCount: 2,
      measurableExampleCount: 0,
    });
    expect(result.level).toBe("MEDIUM");
  });

  it("is HIGH wanneer alle kritieke dims meervoudig geobserveerd zijn, >=3 concreet, >=1 meetbaar en >=90% beantwoord", () => {
    const stats = statsFrom({
      BIZ: [3, 3],
      DATA: [3, 3],
      ANALYTICS: [3, 3],
      COMM: [3, 3],
    });
    const result = computeConfidence({
      role,
      dimensionStats: stats,
      answeredQuestions: 10,
      plannedQuestions: 10,
      concreteExampleCount: 3,
      measurableExampleCount: 1,
    });
    expect(result.level).toBe("HIGH");
  });
});
