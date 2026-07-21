import { describe, expect, it } from "vitest";
import { computeParticipantProfile } from "@/domain/scoring";
import { buildPersonaSession } from "../fixtures";

describe("role-fit-berekening en fictieve testpersonen", () => {
  it("Persona 1: duidelijke Junior Data Analyst", () => {
    const { session, participant } = buildPersonaSession(
      "DATA_ANALYST",
      {
        BIZ: [2, 2],
        DATA: [2, 2],
        GOV: [1, 2],
        ANALYTICS: [2, 2],
        AI: [1, 1],
        PROD: [1, 1],
        COMM: [2, 2],
        AUTO: [1, 2],
      },
      { evidenceQuality: ["CONCRETE", "CONCRETE"] }
    );

    const profile = computeParticipantProfile(session, participant);
    const dataAnalyst = profile.roleAssessments.DATA_ANALYST;

    expect(dataAnalyst.level.rawLevel).toBe("JUNIOR");
    expect(dataAnalyst.level.level).toBe("JUNIOR");
    expect(dataAnalyst.level.insufficientEvidence).toBe(false);
  });

  it("Persona 2: Medior Data Engineer", () => {
    const { session, participant } = buildPersonaSession(
      "DATA_ENGINEER",
      {
        BIZ: [2, 3],
        DATA: [3, 3, 3, 2],
        GOV: [2, 3],
        ANALYTICS: [2, 2],
        AI: [2, 2],
        PROD: [3, 3, 3, 2],
        COMM: [2, 3],
        AUTO: [2, 2, 2, 3],
      },
      { evidenceQuality: Array(4).fill("CONCRETE") }
    );

    const profile = computeParticipantProfile(session, participant);
    const engineer = profile.roleAssessments.DATA_ENGINEER;

    expect(engineer.level.rawLevel).toBe("MEDIOR");
    expect(engineer.level.level).toBe("MEDIOR");
    expect(engineer.level.medior.passed).toBe(true);
  });

  it("Persona 3: Senior Data/AI Lead", () => {
    const { session, participant } = buildPersonaSession(
      "PRODUCT_LEAD",
      {
        BIZ: [3, 4, 4],
        DATA: [3, 4],
        GOV: [3, 4, 4],
        ANALYTICS: [3, 4],
        AI: [3, 4],
        PROD: [3, 4],
        COMM: [3, 4, 4],
        AUTO: [3, 4, 4],
      },
      { evidenceQuality: Array(3).fill("CONCRETE_MEASURABLE") }
    );

    const profile = computeParticipantProfile(session, participant);
    const lead = profile.roleAssessments.PRODUCT_LEAD;

    expect(lead.level.rawLevel).toBe("SENIOR");
    expect(lead.confidence.level).toBe("HIGH");
    expect(lead.level.level).toBe("SENIOR");
    expect(lead.level.senior.passed).toBe(true);
  });

  it("Persona 4: hoge totaalscore maar onvoldoende governance wordt gecapt op Medior", () => {
    const { session, participant } = buildPersonaSession(
      "AI_GENAI_PRACTITIONER",
      {
        BIZ: [4, 4, 4, 3],
        DATA: [3, 4],
        GOV: [2, 2, 3, 2], // GOV is kritiek; voldoende voor Medior, ontoereikend voor Senior
        ANALYTICS: [3, 4],
        AI: [4, 4, 4, 3],
        PROD: [4, 4, 4, 3],
        COMM: [3, 4],
        AUTO: [3, 4],
      },
      { evidenceQuality: Array(4).fill("CONCRETE_MEASURABLE") }
    );

    const profile = computeParticipantProfile(session, participant);
    const aiPractitioner = profile.roleAssessments.AI_GENAI_PRACTITIONER;

    expect(aiPractitioner.level.rawLevel).toBe("SENIOR");
    expect(aiPractitioner.level.senior.passed).toBe(false);
    expect(aiPractitioner.level.level).not.toBe("SENIOR");
    expect(aiPractitioner.level.capped).toBe(true);
  });

  it("Persona 5: onvoldoende bewijs -> geen gedwongen niveau-label", () => {
    const { session, participant } = buildPersonaSession(
      "DATA_SCIENTIST",
      {
        BIZ: [3],
        DATA: [3],
        // ANALYTICS en AI (kritiek) niet waargenomen
      },
      { plannedCount: 12 }
    );

    const profile = computeParticipantProfile(session, participant);
    const scientist = profile.roleAssessments.DATA_SCIENTIST;

    expect(scientist.confidence.level).toBe("INSUFFICIENT_EVIDENCE");
    expect(scientist.level.level).toBeNull();
  });

  it("toont maximaal twee top-matches", () => {
    const { session, participant } = buildPersonaSession("GENERALIST", {
      BIZ: [3, 3],
      DATA: [3, 3],
      GOV: [3, 3],
      ANALYTICS: [3, 3],
      AI: [3, 3],
      PROD: [3, 3],
      COMM: [3, 3],
      AUTO: [3, 3],
    });
    const profile = computeParticipantProfile(session, participant);
    expect(profile.topMatches).toHaveLength(2);
  });
});
