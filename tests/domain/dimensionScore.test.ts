import { describe, expect, it } from "vitest";
import { computeDimensionStats } from "@/domain/dimensionScore";
import { makeAnswer } from "../fixtures";

describe("computeDimensionStats", () => {
  it("negeert 'Niet waargenomen' bij het gemiddelde", () => {
    const answers = [
      makeAnswer("p1", "q1", { BIZ: 2 }),
      makeAnswer("p1", "q2", { BIZ: "NOT_OBSERVED" }),
      makeAnswer("p1", "q3", { BIZ: 4 }),
    ];

    const stats = computeDimensionStats(answers);

    expect(stats.BIZ.observationCount).toBe(2);
    expect(stats.BIZ.averagePrecise).toBe(3);
    expect(stats.BIZ.averageRounded).toBe(3);
  });

  it("levert null en 0 observaties op wanneer niets is waargenomen", () => {
    const answers = [makeAnswer("p1", "q1", { BIZ: "NOT_OBSERVED" })];
    const stats = computeDimensionStats(answers);
    expect(stats.BIZ.observationCount).toBe(0);
    expect(stats.BIZ.averagePrecise).toBeNull();
  });

  it("rondt alleen de presentatiewaarde af, niet de interne precisie", () => {
    const answers = [
      makeAnswer("p1", "q1", { DATA: 2 }),
      makeAnswer("p1", "q2", { DATA: 3 }),
      makeAnswer("p1", "q3", { DATA: 3 }),
    ];
    const stats = computeDimensionStats(answers);
    // gemiddelde = 8/3 = 2.6666...
    expect(stats.DATA.averagePrecise).toBeCloseTo(2.6666666, 5);
    expect(stats.DATA.averageRounded).toBe(2.7);
  });
});
