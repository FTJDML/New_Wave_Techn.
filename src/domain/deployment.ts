import type { IndicativeLevel } from "./levels";

export interface DeploymentGuidance {
  level: IndicativeLevel;
  summary: string;
  conditions: string[];
}

/**
 * Transparante inzetindicaties per niveau (sectie 8). Bewust geformuleerd met
 * termen als "indicatieve readiness" en "onder voorwaarden" — nooit als
 * automatische personeelsbeslissing.
 */
export const DEPLOYMENT_GUIDANCE: Record<IndicativeLevel, DeploymentGuidance> = {
  FOUNDATION: {
    level: "FOUNDATION",
    summary: "Indicatieve readiness: leren en meelopen.",
    conditions: [
      "geschikt om te leren en mee te lopen",
      "ondersteunende werkzaamheden, onder begeleiding",
      "nog geen zelfstandig kritisch werkpakket",
    ],
  },
  JUNIOR: {
    level: "JUNIOR",
    summary: "Indicatieve readiness: mogelijke inzet op afgebakende taken, onder voorwaarden.",
    conditions: [
      "duidelijk afgebakende taken",
      "heldere instructies en acceptatiecriteria",
      "regelmatige review nodig",
      "geen zelfstandig eigenaarschap over kritieke architectuur- of governancekeuzes",
    ],
  },
  MEDIOR: {
    level: "MEDIOR",
    summary: "Indicatieve readiness: mogelijke zelfstandige inzet binnen een afgebakend domein.",
    conditions: [
      "zelfstandig eigenaar van een werkpakket",
      "kan van analyse naar bruikbaar resultaat werken",
      "peer review op belangrijke beslismomenten",
      "kan stakeholders binnen een duidelijk afgebakend domein begeleiden",
    ],
  },
  SENIOR: {
    level: "SENIOR",
    summary:
      "Indicatieve readiness: mogelijke inzet op ambigue, kritieke werkgebieden — aanvullende validatie en de uiteindelijke staffingbeslissing blijven bij bevoegde mensen.",
    conditions: [
      "kan een ambigu werkgebied structureren",
      "kan ontwerp- en kwaliteitsverantwoordelijkheid dragen",
      "kan standaarden neerzetten",
      "kan risico's en afhankelijkheden managen",
      "kan collega's coachen",
      "de uiteindelijke staffingbeslissing blijft altijd bij bevoegde mensen",
    ],
  },
};

export const INSUFFICIENT_EVIDENCE_LABEL = "Onvoldoende bewijs voor een niveau-indicatie";

export const DECISION_SUPPORT_NOTICE = "Beslissingsondersteuning — menselijke beoordeling vereist.";
