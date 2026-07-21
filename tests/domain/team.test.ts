import { describe, expect, it } from "vitest";
import { computeParticipantProfile } from "@/domain/scoring";
import { computeStaffingMatrix, computeTeamDimensionStats } from "@/domain/team";
import { makeAnswer, makeParticipant, makeSession } from "../fixtures";
import type { ProjectNeed } from "@/domain/types";

function highScoringParticipant(pseudonym: string, primaryRole: "DATA_ENGINEER" | "DATA_ANALYST") {
  const participant = makeParticipant({ pseudonym, primaryRole });
  const answers = [
    makeAnswer(participant.id, "q1", {
      DATA: 4,
      GOV: 4,
      PROD: 4,
      AUTO: 4,
      BIZ: 4,
      ANALYTICS: 4,
      AI: 4,
      COMM: 4,
    }),
    makeAnswer(participant.id, "q2", {
      DATA: 3,
      GOV: 3,
      PROD: 3,
      AUTO: 3,
      BIZ: 3,
      ANALYTICS: 3,
      AI: 3,
      COMM: 3,
    }),
  ];
  return { participant, answers };
}

function lowScoringParticipant(pseudonym: string) {
  const participant = makeParticipant({ pseudonym, primaryRole: "DATA_ANALYST" });
  const answers = [makeAnswer(participant.id, "q1", { DATA: 1, GOV: 1, PROD: 1, AUTO: 1 })];
  return { participant, answers };
}

describe("project gap-berekening (staffing matrix)", () => {
  it("berekent gap=0 en risk NONE wanneer voldoende kandidaten worden gevonden", () => {
    const a = highScoringParticipant("Anna", "DATA_ENGINEER");
    const b = highScoringParticipant("Bram", "DATA_ENGINEER");
    const session = makeSession({
      participants: [a.participant, b.participant],
      questionPlan: { [a.participant.id]: ["q1", "q2"], [b.participant.id]: ["q1", "q2"] },
      answers: [...a.answers, ...b.answers],
    });
    const profiles = [
      computeParticipantProfile(session, a.participant),
      computeParticipantProfile(session, b.participant),
    ];
    const needs: ProjectNeed[] = [
      { id: "n1", role: "DATA_ENGINEER", level: "SENIOR", count: 2 },
    ];
    const matrix = computeStaffingMatrix(needs, profiles);
    expect(matrix[0].foundCount).toBe(2);
    expect(matrix[0].gap).toBe(0);
    expect(matrix[0].risk).toBe("NONE");
  });

  it("berekent een gap en HIGH risk wanneer er geen kandidaten zijn", () => {
    const low = lowScoringParticipant("Chris");
    const session = makeSession({
      participants: [low.participant],
      questionPlan: { [low.participant.id]: ["q1"] },
      answers: low.answers,
    });
    const profile = computeParticipantProfile(session, low.participant);
    const needs: ProjectNeed[] = [
      { id: "n1", role: "DATA_ENGINEER", level: "SENIOR", count: 1 },
    ];
    const matrix = computeStaffingMatrix(needs, [profile]);
    expect(matrix[0].foundCount).toBe(0);
    expect(matrix[0].gap).toBe(1);
    expect(matrix[0].risk).toBe("HIGH");
  });

  it("signaleert single-point-of-failure wanneer precies één kandidaat is gevonden", () => {
    const a = highScoringParticipant("Anna", "DATA_ENGINEER");
    const session = makeSession({
      participants: [a.participant],
      questionPlan: { [a.participant.id]: ["q1", "q2"] },
      answers: a.answers,
    });
    const profile = computeParticipantProfile(session, a.participant);
    const needs: ProjectNeed[] = [
      { id: "n1", role: "DATA_ENGINEER", level: "SENIOR", count: 1 },
    ];
    const matrix = computeStaffingMatrix(needs, [profile]);
    expect(matrix[0].singlePointOfFailure).toBe(true);
  });

  it("sorteert kandidaten alfabetisch", () => {
    const a = highScoringParticipant("Zeeman", "DATA_ENGINEER");
    const b = highScoringParticipant("Adams", "DATA_ENGINEER");
    const session = makeSession({
      participants: [a.participant, b.participant],
      questionPlan: { [a.participant.id]: ["q1", "q2"], [b.participant.id]: ["q1", "q2"] },
      answers: [...a.answers, ...b.answers],
    });
    const profiles = [
      computeParticipantProfile(session, a.participant),
      computeParticipantProfile(session, b.participant),
    ];
    const needs: ProjectNeed[] = [
      { id: "n1", role: "DATA_ENGINEER", level: "SENIOR", count: 2 },
    ];
    const matrix = computeStaffingMatrix(needs, profiles);
    expect(matrix[0].candidates).toEqual(["Adams", "Zeeman"]);
  });
});

describe("teamdekking per competentie", () => {
  it("markeert SINGLE_PERSON wanneer maar één deelnemer Medior-niveau (>=2,4) heeft", () => {
    const a = highScoringParticipant("Anna", "DATA_ENGINEER");
    const low = lowScoringParticipant("Chris");
    const session = makeSession({
      participants: [a.participant, low.participant],
      questionPlan: { [a.participant.id]: ["q1", "q2"], [low.participant.id]: ["q1"] },
      answers: [...a.answers, ...low.answers],
    });
    const profiles = [
      computeParticipantProfile(session, a.participant),
      computeParticipantProfile(session, low.participant),
    ];
    const stats = computeTeamDimensionStats(profiles);
    expect(stats.DATA.coverage).toBe("SINGLE_PERSON");
    expect(stats.DATA.singlePointOfFailure).toBe(true);
  });

  it("markeert INSUFFICIENT_EVIDENCE wanneer niemand een dimensie heeft laten zien", () => {
    const participant = makeParticipant({ pseudonym: "Anna", primaryRole: "DATA_ENGINEER" });
    // Alleen DATA/GOV/PROD/AUTO gescoord; BIZ/ANALYTICS/AI/COMM blijven onbeoordeeld.
    const answer = makeAnswer(participant.id, "q1", { DATA: 4, GOV: 4, PROD: 4, AUTO: 4 });
    const session = makeSession({
      participants: [participant],
      questionPlan: { [participant.id]: ["q1"] },
      answers: [answer],
    });
    const profile = computeParticipantProfile(session, participant);
    const stats = computeTeamDimensionStats([profile]);
    expect(stats.BIZ.coverage).toBe("INSUFFICIENT_EVIDENCE");
    expect(stats.AI.coverage).toBe("INSUFFICIENT_EVIDENCE");
  });
});
