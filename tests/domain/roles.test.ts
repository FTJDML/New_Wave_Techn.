import { describe, expect, it } from "vitest";
import { PRACTITIONER_ROLE_IDS, ROLES, roleWeightsSumTo1 } from "@/domain/roles";

describe("role weights", () => {
  it("tellen op tot 1 voor iedere praktijkrol", () => {
    for (const roleId of PRACTITIONER_ROLE_IDS) {
      expect(roleWeightsSumTo1(ROLES[roleId])).toBe(true);
    }
  });

  it("bevatten alle acht dimensies per rol", () => {
    for (const roleId of PRACTITIONER_ROLE_IDS) {
      const weights = ROLES[roleId].weights;
      expect(Object.keys(weights)).toHaveLength(8);
    }
  });
});
