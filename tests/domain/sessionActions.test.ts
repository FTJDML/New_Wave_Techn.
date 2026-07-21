import { describe, expect, it } from "vitest";
import { createSession, setParticipantReview, upsertAnswer } from "@/domain/sessionActions";

describe("scorewijzigingen en auditlog", () => {
  it("legt geen auditlog-entry vast vóór bevestiging van het resultaat", () => {
    let session = createSession(
      {
        sessionName: "Test",
        projectName: "Project",
        projectContext: "Context",
        facilitatorName: "FD",
        date: "2026-07-20",
        depth: "STANDARD",
        order: "ROUND_ROBIN",
        language: "nl",
      },
      [{ pseudonym: "Deelnemer 1", primaryRole: "DATA_ANALYST" }],
      [],
      "2026-07-20T10:00:00.000Z"
    );
    const participantId = session.participants[0].id;

    session = upsertAnswer(
      session,
      participantId,
      "core-01",
      { scores: { BIZ: 2 } },
      { nowIso: "2026-07-20T10:05:00.000Z" }
    );
    session = upsertAnswer(
      session,
      participantId,
      "core-01",
      { scores: { BIZ: 3 } },
      { nowIso: "2026-07-20T10:06:00.000Z" }
    );

    expect(session.auditLog).toHaveLength(0);
    expect(session.answers[0].scores.BIZ).toBe(3);
  });

  it("legt oude score, nieuwe score, tijdstip en reden vast wanneer een bevestigd resultaat wijzigt", () => {
    let session = createSession(
      {
        sessionName: "Test",
        projectName: "Project",
        projectContext: "Context",
        facilitatorName: "FD",
        date: "2026-07-20",
        depth: "STANDARD",
        order: "ROUND_ROBIN",
        language: "nl",
      },
      [{ pseudonym: "Deelnemer 1", primaryRole: "DATA_ANALYST" }],
      [],
      "2026-07-20T10:00:00.000Z"
    );
    const participantId = session.participants[0].id;

    session = upsertAnswer(
      session,
      participantId,
      "core-01",
      { scores: { BIZ: 2 } },
      { nowIso: "2026-07-20T10:05:00.000Z" }
    );

    session = setParticipantReview(
      session,
      participantId,
      { reviewConfirmed: true, reviewNote: "Besproken met deelnemer", correctionOpportunityGiven: true },
      "2026-07-20T10:10:00.000Z"
    );

    session = upsertAnswer(
      session,
      participantId,
      "core-01",
      { scores: { BIZ: 4 } },
      { nowIso: "2026-07-20T10:15:00.000Z", changeReason: "Aanvullend voorbeeld tijdens review" }
    );

    expect(session.auditLog).toHaveLength(1);
    const entry = session.auditLog[0];
    expect(entry.oldScore).toBe(2);
    expect(entry.newScore).toBe(4);
    expect(entry.timestamp).toBe("2026-07-20T10:15:00.000Z");
    expect(entry.reason).toBe("Aanvullend voorbeeld tijdens review");
    expect(entry.dimension).toBe("BIZ");
  });

  it("legt geen entry vast wanneer de score niet daadwerkelijk verandert", () => {
    let session = createSession(
      {
        sessionName: "Test",
        projectName: "Project",
        projectContext: "Context",
        facilitatorName: "FD",
        date: "2026-07-20",
        depth: "STANDARD",
        order: "ROUND_ROBIN",
        language: "nl",
      },
      [{ pseudonym: "Deelnemer 1", primaryRole: "DATA_ANALYST" }],
      [],
      "2026-07-20T10:00:00.000Z"
    );
    const participantId = session.participants[0].id;

    session = upsertAnswer(
      session,
      participantId,
      "core-01",
      { scores: { BIZ: 3 } },
      { nowIso: "2026-07-20T10:05:00.000Z" }
    );
    session = setParticipantReview(
      session,
      participantId,
      { reviewConfirmed: true },
      "2026-07-20T10:10:00.000Z"
    );
    session = upsertAnswer(
      session,
      participantId,
      "core-01",
      { scores: { BIZ: 3 } },
      { nowIso: "2026-07-20T10:15:00.000Z" }
    );

    expect(session.auditLog).toHaveLength(0);
  });
});
