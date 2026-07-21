/**
 * De acht competentiedimensies (sectie 5 van de specificatie).
 */
export const DIMENSION_CODES = [
  "BIZ",
  "DATA",
  "GOV",
  "ANALYTICS",
  "AI",
  "PROD",
  "COMM",
  "AUTO",
] as const;

export type DimensionCode = (typeof DIMENSION_CODES)[number];

export interface DimensionDefinition {
  code: DimensionCode;
  name: string;
  description: string;
  aspects: string[];
}

export const DIMENSIONS: Record<DimensionCode, DimensionDefinition> = {
  BIZ: {
    code: "BIZ",
    name: "Business understanding & problem framing",
    description:
      "Het probleem verhelderen, KPI's definiëren, hypothesen vormen en waarde/impact begrijpen.",
    aspects: [
      "probleem verhelderen",
      "KPI's definiëren",
      "hypothesen vormen",
      "waarde en impact begrijpen",
      "onderscheid probleem, oplossing en technologie",
    ],
  },
  DATA: {
    code: "DATA",
    name: "Data access, SQL & datamodellering",
    description:
      "Databronnen begrijpen, grain en sleutels herkennen, joins/aggregaties, SQL-denken, semantische modellen en lineage.",
    aspects: [
      "databronnen begrijpen",
      "grain en sleutels herkennen",
      "joins en aggregaties",
      "SQL-denken",
      "semantische modellen",
      "data lineage",
    ],
  },
  GOV: {
    code: "GOV",
    name: "Datakwaliteit, governance, privacy & verantwoord gebruik",
    description:
      "Datakwaliteit, ownership, toegangscontrole, dataminimalisatie, privacy, security, bias en verantwoord AI-gebruik.",
    aspects: [
      "datakwaliteit",
      "ownership",
      "toegangscontrole",
      "dataminimalisatie",
      "privacy",
      "security",
      "bias en verantwoord AI-gebruik",
    ],
  },
  ANALYTICS: {
    code: "ANALYTICS",
    name: "Analyse, statistiek & experimenteren",
    description:
      "Beschrijvende analyse, causaliteit versus correlatie, experimentopzet, statistische onzekerheid, validatie en interpretatie.",
    aspects: [
      "beschrijvende analyse",
      "causaliteit versus correlatie",
      "experimentopzet",
      "statistische onzekerheid",
      "validatie",
      "zakelijke interpretatie",
    ],
  },
  AI: {
    code: "AI",
    name: "Machine learning & generatieve AI",
    description:
      "Probleemkeuze, feature/modeldenken, evaluatiemetrics, leakage, GenAI, RAG, hallucination management en AI-evaluatie.",
    aspects: [
      "probleemkeuze",
      "feature- en modeldenken",
      "evaluatiemetrics",
      "leakage",
      "GenAI",
      "RAG",
      "hallucination management",
      "evaluatie van AI-uitvoer",
    ],
  },
  PROD: {
    code: "PROD",
    name: "Engineering, operationalisering & monitoring",
    description:
      "Betrouwbare pipelines, testen, deployment, observability, data-/modeldrift, incidentmanagement, eigenaarschap en onderhoudbaarheid.",
    aspects: [
      "betrouwbare pipelines",
      "testen",
      "deployment",
      "observability",
      "data- en modeldrift",
      "incidentmanagement",
      "eigenaarschap",
      "onderhoudbaarheid",
    ],
  },
  COMM: {
    code: "COMM",
    name: "Communicatie & stakeholdermanagement",
    description:
      "Uitleg aanpassen aan doelgroep, verwachtingen managen, inzichten vertalen naar acties, onzekerheid communiceren en constructief tegenspreken.",
    aspects: [
      "uitleg aanpassen aan doelgroep",
      "verwachtingen managen",
      "inzichten vertalen naar acties",
      "onzekerheid communiceren",
      "constructief tegenspreken",
    ],
  },
  AUTO: {
    code: "AUTO",
    name: "Autonomie, reflectie & leiderschap",
    description:
      "Zelfstandig handelen, omgaan met ambiguïteit, verantwoordelijkheid nemen, leren van fouten, collega's helpen, standaarden verbeteren en coachen.",
    aspects: [
      "zelfstandig handelen",
      "omgaan met ambiguïteit",
      "verantwoordelijkheid nemen",
      "leren van fouten",
      "collega's helpen",
      "standaarden verbeteren",
      "coachen",
    ],
  },
};

export const DIMENSION_LIST: DimensionDefinition[] =
  DIMENSION_CODES.map((c) => DIMENSIONS[c]);
