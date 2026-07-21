import { describe, expect, it } from "vitest";
import { createSession, upsertAnswer } from "@/domain/sessionActions";
import { serializeSessionExport, parseSessionExport } from "@/domain/exportImport";

describe("JSON import/export roundtrip", () => {
  it("levert na export en import weer een identieke sessie op", () => {
    let session = createSession(
      {
        sessionName: "Roundtrip-sessie",
        projectName: "Fictief Ahold-project",
        projectContext: "Testcontext",
        facilitatorName: "FD",
        date: "2026-07-20",
        depth: "STANDARD",
        order: "PERSON_BY_PERSON",
        language: "nl",
      },
      [
        { pseudonym: "Deelnemer 1", primaryRole: "DATA_ANALYST" },
        { pseudonym: "Deelnemer 2", primaryRole: "DATA_ENGINEER" },
      ],
      [{ role: "DATA_ENGINEER", level: "SENIOR", count: 1 }],
      "2026-07-20T10:00:00.000Z"
    );

    session = upsertAnswer(
      session,
      session.participants[0].id,
      "core-01",
      { scores: { BIZ: 3 }, notes: "Notitie", answered: true },
      { nowIso: "2026-07-20T10:05:00.000Z" }
    );

    const exported = serializeSessionExport(session);
    const parsed = parseSessionExport(exported);

    expect(parsed).toEqual(session);
  });

  it("weigert ongeldige JSON met een duidelijke foutmelding", () => {
    expect(() => parseSessionExport("{ niet geldig")).toThrow();
  });

  it("weigert JSON dat niet aan het sessieschema voldoet", () => {
    expect(() => parseSessionExport(JSON.stringify({ foo: "bar" }))).toThrow();
  });
});
