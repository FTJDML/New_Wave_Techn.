import { describe, expect, it } from "vitest";
import { isIndividualLevelAvailable } from "@/domain/scoring";
import { buildQuestionPlan } from "@/domain/questionPlan";
import { makeParticipant } from "../fixtures";

describe("Team Quick Scan levert geen individueel niveau", () => {
  it("isIndividualLevelAvailable is false voor QUICK_SCAN en true voor STANDARD", () => {
    expect(isIndividualLevelAvailable("QUICK_SCAN")).toBe(false);
    expect(isIndividualLevelAvailable("STANDARD")).toBe(true);
  });

  it("bouwt voor QUICK_SCAN alleen de 6 teamvragen, zonder rolspecifieke vragen", () => {
    const participant = makeParticipant({ primaryRole: "DATA_ENGINEER" });
    const plan = buildQuestionPlan(participant, "QUICK_SCAN");
    expect(plan).toHaveLength(6);
    expect(plan.every((id) => id.startsWith("core-"))).toBe(true);
  });

  it("bouwt voor STANDARD de 10 kernvragen plus 2 rolspecifieke vragen", () => {
    const participant = makeParticipant({ primaryRole: "DATA_ENGINEER" });
    const plan = buildQuestionPlan(participant, "STANDARD");
    expect(plan).toHaveLength(12);
  });
});
