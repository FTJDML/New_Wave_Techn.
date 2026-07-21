import type { DimensionCode } from "./dimensions";

export const ROLE_IDS = [
  "DATA_ANALYST",
  "DATA_ENGINEER",
  "DATA_SCIENTIST",
  "AI_GENAI_PRACTITIONER",
  "PRODUCT_LEAD",
  "GENERALIST",
] as const;

export type RoleId = (typeof ROLE_IDS)[number];

export interface RoleDefinition {
  id: RoleId;
  name: string;
  shortName: string;
  weights: Partial<Record<DimensionCode, number>>;
  criticalDimensions: DimensionCode[];
  /** Alleen van toepassing op de Product Lead-rol: minimaal één technische dimensie op passend niveau. */
  requiresAnyTechnicalDimension?: DimensionCode[];
  /** Voor deze rol geldt een strengere GOV-gate op Senior-niveau. */
  seniorGovMin?: number;
}

export const ROLES: Record<RoleId, RoleDefinition> = {
  DATA_ANALYST: {
    id: "DATA_ANALYST",
    name: "Data Analyst / BI Analyst",
    shortName: "Data Analyst",
    weights: {
      BIZ: 0.2,
      DATA: 0.2,
      GOV: 0.1,
      ANALYTICS: 0.2,
      AI: 0.05,
      PROD: 0.05,
      COMM: 0.15,
      AUTO: 0.05,
    },
    criticalDimensions: ["BIZ", "DATA", "ANALYTICS", "COMM"],
  },
  DATA_ENGINEER: {
    id: "DATA_ENGINEER",
    name: "Analytics Engineer / Data Engineer",
    shortName: "Data Engineer",
    weights: {
      BIZ: 0.1,
      DATA: 0.25,
      GOV: 0.15,
      ANALYTICS: 0.05,
      AI: 0.05,
      PROD: 0.25,
      COMM: 0.05,
      AUTO: 0.1,
    },
    criticalDimensions: ["DATA", "GOV", "PROD"],
  },
  DATA_SCIENTIST: {
    id: "DATA_SCIENTIST",
    name: "Data Scientist / ML Practitioner",
    shortName: "Data Scientist",
    weights: {
      BIZ: 0.1,
      DATA: 0.15,
      GOV: 0.1,
      ANALYTICS: 0.2,
      AI: 0.25,
      PROD: 0.1,
      COMM: 0.05,
      AUTO: 0.05,
    },
    criticalDimensions: ["BIZ", "DATA", "ANALYTICS", "AI"],
  },
  AI_GENAI_PRACTITIONER: {
    id: "AI_GENAI_PRACTITIONER",
    name: "AI / GenAI Practitioner",
    shortName: "AI/GenAI Practitioner",
    weights: {
      BIZ: 0.15,
      DATA: 0.1,
      GOV: 0.15,
      ANALYTICS: 0.1,
      AI: 0.25,
      PROD: 0.15,
      COMM: 0.05,
      AUTO: 0.05,
    },
    criticalDimensions: ["BIZ", "GOV", "AI", "PROD"],
  },
  PRODUCT_LEAD: {
    id: "PRODUCT_LEAD",
    name: "Data & AI Product Lead",
    shortName: "Product Lead",
    weights: {
      BIZ: 0.2,
      DATA: 0.1,
      GOV: 0.15,
      ANALYTICS: 0.1,
      AI: 0.1,
      PROD: 0.1,
      COMM: 0.15,
      AUTO: 0.1,
    },
    criticalDimensions: ["BIZ", "GOV", "COMM", "AUTO"],
    requiresAnyTechnicalDimension: ["DATA", "ANALYTICS", "AI", "PROD"],
    seniorGovMin: 3.0,
  },
  GENERALIST: {
    id: "GENERALIST",
    name: "Generalist / nog onbekend",
    shortName: "Generalist",
    // Generalist heeft geen eigen weging; rolfit wordt bepaald t.o.v. de vijf praktijkrollen.
    weights: {},
    criticalDimensions: [],
  },
};

export const PRACTITIONER_ROLE_IDS: RoleId[] = [
  "DATA_ANALYST",
  "DATA_ENGINEER",
  "DATA_SCIENTIST",
  "AI_GENAI_PRACTITIONER",
  "PRODUCT_LEAD",
];

export function getRole(id: RoleId): RoleDefinition {
  return ROLES[id];
}

/** Controleert of alle role weights optellen tot 1 (binnen afrondingsmarge). */
export function roleWeightsSumTo1(role: RoleDefinition): boolean {
  const sum = Object.values(role.weights).reduce((a, b) => a + (b ?? 0), 0);
  return Math.abs(sum - 1) < 1e-9;
}
