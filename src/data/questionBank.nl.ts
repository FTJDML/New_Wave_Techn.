import type { Question } from "./questionTypes";

/**
 * Nederlandse vragenbank — Data & AI Team Readiness Scan.
 *
 * Versiebeheer: verhoog QUESTION_BANK_VERSION bij iedere inhoudelijke wijziging
 * van vraagteksten, dimensies of scoreankers, zodat oudere sessie-exports altijd
 * traceerbaar blijven naar de vragenset waarmee ze zijn afgenomen.
 */
export const QUESTION_BANK_VERSION = "1.0.0";

const CORE_QUESTIONS: Question[] = [
  {
    id: "core-01",
    version: QUESTION_BANK_VERSION,
    kind: "CORE",
    title: "Ervaring en eigen bijdrage",
    prompt:
      "Vertel over het meest recente data- of AI-vraagstuk waaraan je zelf hebt gewerkt. Wat was het probleem, wat was jouw eigen bijdrage en wat was het resultaat?",
    followUpPrompt:
      "Welke beslissing heb jij zelf genomen en wat zou je achteraf anders doen?",
    timeBudgetSeconds: 120,
    dimensions: ["BIZ", "COMM", "AUTO"],
    quickScan: true,
    facilitator: {
      why: "Opent het gesprek en laat zien of iemand een probleem, eigen bijdrage en resultaat helder kan onderscheiden.",
      followUp: "Welke beslissing heb jij zelf genomen en wat zou je achteraf anders doen?",
      strongSignals: [
        "duidelijk probleem",
        "eigen bijdrage wordt onderscheiden van die van het team",
        "concrete keuzes",
        "resultaat of impact",
        "beperkingen",
        "reflectie",
      ],
      pitfalls: [
        "alleen teamresultaat benoemen zonder eigen rol",
        "geen concreet resultaat noemen",
        "geen reflectie op eigen handelen",
      ],
    },
  },
  {
    id: "core-02",
    version: QUESTION_BANK_VERSION,
    kind: "CORE",
    title: "Omzetdaling in winkels",
    prompt:
      "De omzet daalt in een periode met 8% in ongeveer 40 winkels. Een stakeholder vraagt om direct een dashboard. Hoe zou jij dit vraagstuk aanpakken voordat je iets bouwt?",
    followUpPrompt: "Welke eerste drie hypothesen zou je onderzoeken?",
    timeBudgetSeconds: 90,
    dimensions: ["BIZ", "ANALYTICS"],
    quickScan: true,
    facilitator: {
      why: "Test of iemand eerst het probleem verheldert in plaats van direct te gaan bouwen, en analytisch kan denken over oorzaken.",
      followUp: "Welke eerste drie hypothesen zou je onderzoeken?",
      strongSignals: [
        "definitie van omzet en periode",
        "vergelijking met baseline",
        "winkel-, product- en promotiesegmentatie",
        "hypothesen",
        "datakwaliteit",
        "seizoen- en externe effecten",
        "correlatie versus oorzaak",
        "besluit dat de analyse moet ondersteunen",
      ],
      pitfalls: [
        "direct naar dashboard/tool springen",
        "geen baseline of vergelijking noemen",
        "geen hypothesen kunnen formuleren",
      ],
    },
  },
  {
    id: "core-03",
    version: QUESTION_BANK_VERSION,
    kind: "CORE",
    title: "Data en SQL-denken",
    prompt:
      "Je hebt transacties, producten, winkels, promoties en loyaltygegevens. Hoe zou je deze data combineren om de omzetdaling te onderzoeken?",
    followUpPrompt: "Hoe voorkom je dat joins dubbele omzet veroorzaken?",
    timeBudgetSeconds: 90,
    dimensions: ["DATA"],
    quickScan: false,
    facilitator: {
      why: "Toetst begrip van grain, sleutels en join-logica — de basis van betrouwbaar data-werk.",
      followUp: "Hoe voorkom je dat joins dubbele omzet veroorzaken?",
      strongSignals: [
        "grain",
        "primaire en foreign keys",
        "joinrichting",
        "filters",
        "aggregatieniveau",
        "dubbele records",
        "nulls",
        "reconciliatie met broncijfers",
        "queryvalidatie",
      ],
      pitfalls: [
        "geen aandacht voor grain of duplicatie bij joins",
        "geen validatie van totalen",
        "geen aandacht voor nulls of ontbrekende sleutels",
      ],
    },
  },
  {
    id: "core-04",
    version: QUESTION_BANK_VERSION,
    kind: "CORE",
    title: "Datakwaliteit",
    prompt:
      "Je ontdekt dat promotiedata missende records, dubbele records en afwijkende datums bevat. Wat doe je voordat je de data gebruikt?",
    followUpPrompt: "Wanneer blokkeer je de levering en wanneer ga je door met een waarschuwing?",
    timeBudgetSeconds: 90,
    dimensions: ["DATA", "GOV", "PROD"],
    quickScan: true,
    facilitator: {
      why: "Laat zien hoe iemand omgaat met datakwaliteitsproblemen: reactief negeren, of structureel aanpakken.",
      followUp: "Wanneer blokkeer je de levering en wanneer ga je door met een waarschuwing?",
      strongSignals: [
        "impactanalyse",
        "profiling",
        "root cause",
        "duidelijke deduplicatieregels",
        "quarantaine",
        "ownership",
        "kwaliteitsregels",
        "logging",
        "monitoring",
        "transparantie naar gebruikers",
      ],
      pitfalls: [
        "data ongezien gebruiken",
        "geen onderscheid tussen blokkerende en niet-blokkerende issues",
        "geen ownership of escalatie benoemen",
      ],
    },
  },
  {
    id: "core-05",
    version: QUESTION_BANK_VERSION,
    kind: "CORE",
    title: "Pilot en causaliteit",
    prompt:
      "Een pilot met een nieuwe datagedreven aanbeveling laat 3% omzetgroei zien. Hoe bepaal je of de aanbeveling echt de oorzaak van de groei is?",
    followUpPrompt: "Wat zou je doen wanneer randomisatie niet mogelijk is?",
    timeBudgetSeconds: 90,
    dimensions: ["BIZ", "ANALYTICS"],
    quickScan: true,
    facilitator: {
      why: "Toetst begrip van causaliteit versus correlatie en experimentopzet.",
      followUp: "Wat zou je doen wanneer randomisatie niet mogelijk is?",
      strongSignals: [
        "controlegroep",
        "randomisatie",
        "pre-postvergelijking",
        "selectiebias",
        "confounders",
        "statistische onzekerheid",
        "praktische relevantie",
        "guardrailmetrics",
        "alternatieve quasi-experimentele aanpak",
      ],
      pitfalls: [
        "groei zonder meer toeschrijven aan de aanbeveling",
        "geen controlegroep of vergelijkingsbasis noemen",
        "geen aandacht voor onzekerheid",
      ],
    },
  },
  {
    id: "core-06",
    version: QUESTION_BANK_VERSION,
    kind: "CORE",
    title: "Modelmetrics",
    prompt: "Een model heeft 92% accuracy. Is dat genoeg om te besluiten dat het model goed is?",
    followUpPrompt: "Welke fouten zijn zakelijk het duurst?",
    timeBudgetSeconds: 90,
    dimensions: ["ANALYTICS", "AI"],
    quickScan: true,
    facilitator: {
      why: "Toetst of iemand verder kijkt dan een enkele metric en de zakelijke context van fouten begrijpt.",
      followUp: "Welke fouten zijn zakelijk het duurst?",
      strongSignals: [
        "klasseverdeling",
        "baseline",
        "precision en recall",
        "false positives en false negatives",
        "zakelijke foutkosten",
        "leakage",
        "testset",
        "calibratie",
        "segmentprestaties",
      ],
      pitfalls: [
        "accuracy klakkeloos als voldoende bewijs zien",
        "geen aandacht voor klasseverdeling",
        "geen koppeling naar zakelijke impact van fouten",
      ],
    },
  },
  {
    id: "core-07",
    version: QUESTION_BANK_VERSION,
    kind: "CORE",
    title: "Generatieve AI",
    prompt:
      "Je bouwt een AI-assistent die opmerkingen van winkelmanagers samenvat. Hoe zorg je dat de samenvatting betrouwbaar, veilig en bruikbaar is?",
    followUpPrompt: "Hoe test je dit vóórdat winkelmanagers de assistent gebruiken?",
    timeBudgetSeconds: 90,
    dimensions: ["AI", "GOV", "PROD"],
    quickScan: true,
    facilitator: {
      why: "Toetst verantwoord GenAI-gebruik: betrouwbaarheid, privacy en operationalisering.",
      followUp: "Hoe test je dit vóórdat winkelmanagers de assistent gebruiken?",
      strongSignals: [
        "bronverwijzingen",
        "grounding",
        "privacy",
        "toegangsrechten",
        "evaluatieset",
        "menselijke review",
        "hallucinaties",
        "fallback",
        "logging",
        "monitoring",
        "duidelijke gebruiksgrenzen",
      ],
      pitfalls: [
        "geen aandacht voor hallucinaties",
        "geen evaluatie voor livegang",
        "geen aandacht voor privacy/toegangsrechten",
      ],
    },
  },
  {
    id: "core-08",
    version: QUESTION_BANK_VERSION,
    kind: "CORE",
    title: "Naar productie en monitoring",
    prompt:
      "Een dashboard, pipeline of model werkt vandaag goed. Wat moet je regelen zodat het over zes maanden nog steeds betrouwbaar is?",
    followUpPrompt: "Welke signalen moeten automatisch een waarschuwing geven?",
    timeBudgetSeconds: 90,
    dimensions: ["GOV", "PROD"],
    quickScan: false,
    facilitator: {
      why: "Toetst denken over duurzaamheid, onderhoud en monitoring in plaats van eenmalige oplevering.",
      followUp: "Welke signalen moeten automatisch een waarschuwing geven?",
      strongSignals: [
        "data freshness",
        "volledigheid",
        "schemawijzigingen",
        "tests",
        "SLA of SLO",
        "observability",
        "data- of modeldrift",
        "alerts",
        "lineage",
        "runbook",
        "eigenaar",
        "rollback",
      ],
      pitfalls: [
        "geen aandacht voor monitoring na livegang",
        "geen eigenaar of runbook benoemen",
        "alleen technische bouw, geen operatie",
      ],
    },
  },
  {
    id: "core-09",
    version: QUESTION_BANK_VERSION,
    kind: "CORE",
    title: "Stakeholder en onrealistische urgentie",
    prompt:
      "Een stakeholder wil binnen twee weken een AI-oplossing, maar de data is nog niet betrouwbaar. Hoe pak je dit aan?",
    followUpPrompt: "Wat zou je binnen twee weken wel kunnen opleveren?",
    timeBudgetSeconds: 90,
    dimensions: ["BIZ", "COMM", "AUTO"],
    quickScan: true,
    facilitator: {
      why: "Toetst stakeholdermanagement en autonomie onder tijdsdruk en ambiguïteit.",
      followUp: "Wat zou je binnen twee weken wel kunnen opleveren?",
      strongSignals: [
        "probleem achter de vraag onderzoeken",
        "verwachtingen managen",
        "risico's uitleggen",
        "dunne verticale slice",
        "prototype versus productie",
        "besluitcriteria",
        "afhankelijkheden",
        "data readiness",
        "duidelijke escalatie",
        "documentatie van aannames",
      ],
      pitfalls: [
        "deadline klakkeloos accepteren zonder risico's te benoemen",
        "geen alternatief voorstel doen",
        "geen escalatie of transparantie over risico's",
      ],
    },
  },
  {
    id: "core-10",
    version: QUESTION_BANK_VERSION,
    kind: "CORE",
    title: "Fout, leren en anderen helpen",
    prompt:
      "Vertel over een data- of AI-aanname die achteraf onjuist bleek. Hoe ontdekte je dat en wat heb je daarna veranderd?",
    followUpPrompt: "Hoe heb je ervoor gezorgd dat anderen niet dezelfde fout maken?",
    timeBudgetSeconds: 120,
    dimensions: ["COMM", "AUTO"],
    quickScan: false,
    facilitator: {
      why: "Toetst reflectie, eigenaarschap en het vermogen om anderen te laten leren van fouten.",
      followUp: "Hoe heb je ervoor gezorgd dat anderen niet dezelfde fout maken?",
      strongSignals: [
        "concreet voorbeeld",
        "verantwoordelijkheid nemen",
        "oorzaak onderzoeken",
        "werkwijze aanpassen",
        "standaard of controle verbeteren",
        "kennis delen",
        "coachen",
        "geen schuld afschuiven",
      ],
      pitfalls: [
        "geen concreet voorbeeld kunnen geven",
        "schuld afschuiven op anderen of omstandigheden",
        "geen structurele verbetering na de fout",
      ],
    },
  },
];

const ROLE_SPECIFIC_QUESTIONS: Question[] = [
  {
    id: "role-da-1",
    version: QUESTION_BANK_VERSION,
    kind: "ROLE_SPECIFIC",
    role: "DATA_ANALYST",
    title: "Besluitgericht dashboard",
    prompt:
      "Je maakt een dashboard voor winkelmanagers. Hoe bepaal je wat erop moet staan en hoe controleer je dat het dashboard daadwerkelijk tot betere beslissingen leidt?",
    followUpPrompt: "Hoe meet je of het dashboard daadwerkelijk wordt gebruikt en effect heeft?",
    timeBudgetSeconds: 120,
    dimensions: ["BIZ", "ANALYTICS", "COMM"],
    quickScan: false,
    facilitator: {
      why: "Toetst of de deelnemer besluitgericht ontwerpt in plaats van louter rapporteert.",
      followUp: "Hoe meet je of het dashboard daadwerkelijk wordt gebruikt en effect heeft?",
      strongSignals: [
        "doelgroep en beslissingen",
        "KPI-definities",
        "targets en vergelijkingen",
        "uitzonderingen",
        "segmentatie",
        "drill-down",
        "actiegericht ontwerp",
        "gebruikersvalidatie",
        "adoptie",
        "meten van gebruik en effect",
      ],
      pitfalls: [
        "dashboard als doel op zich zien",
        "geen koppeling naar concrete beslissingen",
        "geen validatie met gebruikers",
      ],
    },
  },
  {
    id: "role-da-2",
    version: QUESTION_BANK_VERSION,
    kind: "ROLE_SPECIFIC",
    role: "DATA_ANALYST",
    title: "Analyse van promotie-effect",
    prompt:
      "Hoe zou je met SQL en analyse bepalen of een promotie extra omzet heeft veroorzaakt?",
    followUpPrompt: "Hoe corrigeer je voor seizoenseffecten in je vergelijking?",
    timeBudgetSeconds: 120,
    dimensions: ["DATA", "ANALYTICS"],
    quickScan: false,
    facilitator: {
      why: "Combineert SQL-denken met analytische onderbouwing van effectmeting.",
      followUp: "Hoe corrigeer je voor seizoenseffecten in je vergelijking?",
      strongSignals: [
        "juiste grain",
        "vergelijkingsgroep",
        "baseline",
        "pre- en postperiode",
        "cannibalisatie",
        "seizoen",
        "promotieselectie",
        "joinvalidatie",
        "querytests",
        "zakelijke interpretatie",
      ],
      pitfalls: [
        "geen vergelijkingsgroep of baseline",
        "geen aandacht voor cannibalisatie of seizoen",
        "geen validatie van de query-uitkomst",
      ],
    },
  },
  {
    id: "role-de-1",
    version: QUESTION_BANK_VERSION,
    kind: "ROLE_SPECIFIC",
    role: "DATA_ENGINEER",
    title: "Betrouwbare dagelijkse pipeline",
    prompt:
      "Ontwerp op hoofdlijnen een dagelijkse pipeline die KPI's voor honderden winkels levert. Welke onderdelen en controles zijn nodig?",
    followUpPrompt: "Hoe zorg je dat een mislukte run niet tot verkeerde cijfers leidt?",
    timeBudgetSeconds: 120,
    dimensions: ["DATA", "GOV", "PROD"],
    quickScan: false,
    facilitator: {
      why: "Toetst end-to-end pipeline-denken inclusief betrouwbaarheid en schaalbaarheid.",
      followUp: "Hoe zorg je dat een mislukte run niet tot verkeerde cijfers leidt?",
      strongSignals: [
        "incremental loads",
        "idempotency",
        "orchestration",
        "partitionering",
        "schema contracts",
        "tests",
        "lineage",
        "observability",
        "retries",
        "backfills",
        "toegangscontrole",
        "kosten en schaalbaarheid",
      ],
      pitfalls: [
        "geen aandacht voor idempotency of retries",
        "geen tests of monitoring benoemen",
        "geen aandacht voor toegangscontrole",
      ],
    },
  },
  {
    id: "role-de-2",
    version: QUESTION_BANK_VERSION,
    kind: "ROLE_SPECIFIC",
    role: "DATA_ENGINEER",
    title: "Productie-incident",
    prompt: "Na een backfill blijken dashboards dubbele omzet te tonen. Hoe pak je dit incident aan?",
    followUpPrompt: "Welke structurele controle voorkomt dat dit weer gebeurt?",
    timeBudgetSeconds: 120,
    dimensions: ["DATA", "PROD", "COMM"],
    quickScan: false,
    facilitator: {
      why: "Toetst incidentmanagement en structureel leren van productieproblemen.",
      followUp: "Welke structurele controle voorkomt dat dit weer gebeurt?",
      strongSignals: [
        "impact en blast radius",
        "levering stoppen of terugrollen",
        "stakeholders informeren",
        "data herstellen",
        "oorzaak vinden",
        "idempotency",
        "controles toevoegen",
        "post-incident review",
        "structurele preventie",
      ],
      pitfalls: [
        "geen impactanalyse of stakeholdercommunicatie",
        "alleen symptoom oplossen, geen root cause",
        "geen structurele preventie na het incident",
      ],
    },
  },
  {
    id: "role-ds-1",
    version: QUESTION_BANK_VERSION,
    kind: "ROLE_SPECIFIC",
    role: "DATA_SCIENTIST",
    title: "Voorraadtekort voorspellen",
    prompt:
      "Je wilt voorspellen welke producten volgende week per winkel uit voorraad raken. Hoe pak je dit van probleemdefinitie tot validatie aan?",
    followUpPrompt: "Welke features zouden leakage kunnen veroorzaken?",
    timeBudgetSeconds: 120,
    dimensions: ["BIZ", "DATA", "ANALYTICS", "AI"],
    quickScan: false,
    facilitator: {
      why: "Toetst het volledige ML-traject van probleemdefinitie tot validatie.",
      followUp: "Welke features zouden leakage kunnen veroorzaken?",
      strongSignals: [
        "target en horizon",
        "labeldefinitie",
        "beschikbaarheid van features",
        "leakage",
        "time-based split",
        "winkel- en productsegmenten",
        "baseline",
        "juiste metric",
        "foutkosten",
        "explainability",
        "operationele actie",
      ],
      pitfalls: [
        "geen aandacht voor leakage of time-based split",
        "geen baseline om tegen te vergelijken",
        "geen koppeling naar operationele actie",
      ],
    },
  },
  {
    id: "role-ds-2",
    version: QUESTION_BANK_VERSION,
    kind: "ROLE_SPECIFIC",
    role: "DATA_SCIENTIST",
    title: "Model in gebruik houden",
    prompt:
      "Het voorraadmodel gaat naar productie. Hoe bepaal je of het model blijft presteren en wanneer het opnieuw getraind moet worden?",
    followUpPrompt: "Hoe zou je een retraining-trigger inrichten zonder onnodig vaak te retrainen?",
    timeBudgetSeconds: 120,
    dimensions: ["AI", "PROD", "GOV"],
    quickScan: false,
    facilitator: {
      why: "Toetst monitoring en levenscyclusdenken voor ML-modellen in productie.",
      followUp: "Hoe zou je een retraining-trigger inrichten zonder onnodig vaak te retrainen?",
      strongSignals: [
        "data drift",
        "concept drift",
        "outcome delay",
        "segmentmonitoring",
        "shadow- of canaryaanpak",
        "feedbackloop",
        "retraining trigger",
        "modelversies",
        "rollback",
        "business KPI's",
      ],
      pitfalls: [
        "geen monitoring na livegang",
        "geen aandacht voor drift",
        "geen koppeling naar business KPI's",
      ],
    },
  },
  {
    id: "role-gai-1",
    version: QUESTION_BANK_VERSION,
    kind: "ROLE_SPECIFIC",
    role: "AI_GENAI_PRACTITIONER",
    title: "Interne kennisassistent",
    prompt:
      "Ontwerp een interne GenAI-assistent die vragen beantwoordt over beleids- en procesdocumenten. Hoe zou je de oplossing opbouwen?",
    followUpPrompt: "Hoe voorkom je dat de assistent documenten toont waartoe een gebruiker geen toegang heeft?",
    timeBudgetSeconds: 120,
    dimensions: ["AI", "GOV", "PROD"],
    quickScan: false,
    facilitator: {
      why: "Toetst RAG-architectuurdenken inclusief governance en toegangsrechten.",
      followUp: "Hoe voorkom je dat de assistent documenten toont waartoe een gebruiker geen toegang heeft?",
      strongSignals: [
        "retrieval augmented generation",
        "chunking",
        "embeddings en retrieval",
        "broncitaten",
        "documentrechten",
        "metadatafilters",
        "promptontwerp",
        "contextlimieten",
        "fallback",
        "logging",
        "latency en kosten",
      ],
      pitfalls: [
        "geen aandacht voor documentrechten/toegang",
        "geen broncitaten of grounding",
        "geen aandacht voor kosten of latency",
      ],
    },
  },
  {
    id: "role-gai-2",
    version: QUESTION_BANK_VERSION,
    kind: "ROLE_SPECIFIC",
    role: "AI_GENAI_PRACTITIONER",
    title: "Evalueren en beveiligen",
    prompt: "Hoe bepaal je systematisch of een GenAI-assistent goed genoeg is voor dagelijks gebruik?",
    followUpPrompt: "Hoe zou je red-teaming inzetten voordat de assistent live gaat?",
    timeBudgetSeconds: 120,
    dimensions: ["ANALYTICS", "AI", "GOV"],
    quickScan: false,
    facilitator: {
      why: "Toetst systematische evaluatie van GenAI-oplossingen in plaats van 'los proberen'.",
      followUp: "Hoe zou je red-teaming inzetten voordat de assistent live gaat?",
      strongSignals: [
        "representatieve golden set",
        "menselijke rubric",
        "correctness",
        "groundedness",
        "hallucination rate",
        "task success",
        "weigeren bij onvoldoende bewijs",
        "red-teaming",
        "privacytests",
        "latency",
        "kosten",
        "continue evaluatie",
      ],
      pitfalls: [
        "evaluatie beperken tot losse handmatige steekproeven",
        "geen aandacht voor hallucination rate of groundedness",
        "geen doorlopende evaluatie na livegang",
      ],
    },
  },
  {
    id: "role-lead-1",
    version: QUESTION_BANK_VERSION,
    kind: "ROLE_SPECIFIC",
    role: "PRODUCT_LEAD",
    title: "Use-cases prioriteren",
    prompt: "Er zijn twintig ideeën voor data en AI, maar capaciteit voor drie. Hoe bepaal je wat als eerste wordt uitgevoerd?",
    followUpPrompt: "Welke stopcriteria zou je vooraf vastleggen?",
    timeBudgetSeconds: 120,
    dimensions: ["BIZ", "GOV", "COMM", "AUTO"],
    quickScan: false,
    facilitator: {
      why: "Toetst portfoliodenken en prioritering vanuit waarde, haalbaarheid en risico.",
      followUp: "Welke stopcriteria zou je vooraf vastleggen?",
      strongSignals: [
        "zakelijke waarde",
        "gebruiker en besluit",
        "haalbaarheid",
        "datagereedheid",
        "risico",
        "sponsor",
        "afhankelijkheden",
        "adoption",
        "meetbare outcome",
        "stopcriteria",
        "portfolio in plaats van losse ideeën",
      ],
      pitfalls: [
        "prioriteren op enthousiasme in plaats van waarde/haalbaarheid",
        "geen stopcriteria of meetbare outcome",
        "ideeën los behandelen in plaats van als portfolio",
      ],
    },
  },
  {
    id: "role-lead-2",
    version: QUESTION_BANK_VERSION,
    kind: "ROLE_SPECIFIC",
    role: "PRODUCT_LEAD",
    title: "Operating model",
    prompt:
      "Hoe organiseer je verantwoordelijkheden en samenwerking zodat data- en AI-oplossingen niet alleen worden gebouwd, maar ook duurzaam worden gebruikt?",
    followUpPrompt: "Hoe zou je adoptie meten en opvolgen na livegang?",
    timeBudgetSeconds: 120,
    dimensions: ["BIZ", "GOV", "PROD", "COMM", "AUTO"],
    quickScan: false,
    facilitator: {
      why: "Toetst operating-model-denken: rollen, ownership, standaarden en duurzame adoptie.",
      followUp: "Hoe zou je adoptie meten en opvolgen na livegang?",
      strongSignals: [
        "duidelijke rollen",
        "product ownership",
        "data ownership",
        "platform versus teams",
        "standaarden",
        "governance",
        "lifecycle",
        "monitoring",
        "training",
        "adoptie",
        "outcome metrics",
        "community of practice",
      ],
      pitfalls: [
        "alleen technische bouw benoemen, geen organisatie/adoptie",
        "geen duidelijke ownership",
        "geen aandacht voor duurzaam gebruik na livegang",
      ],
    },
  },
];

export const ALL_QUESTIONS: Question[] = [...CORE_QUESTIONS, ...ROLE_SPECIFIC_QUESTIONS];

export const QUESTION_BY_ID: Record<string, Question> = Object.fromEntries(
  ALL_QUESTIONS.map((q) => [q.id, q])
);

export function getQuestion(id: string): Question {
  const q = QUESTION_BY_ID[id];
  if (!q) throw new Error(`Onbekende vraag-id: ${id}`);
  return q;
}

export function getCoreQuestions(): Question[] {
  return CORE_QUESTIONS;
}

export function getRoleQuestions(role: string): Question[] {
  return ROLE_SPECIFIC_QUESTIONS.filter((q) => q.role === role);
}

/**
 * De spec vraagt om "6 geselecteerde kernvragen" voor de Team Quick Scan, terwijl
 * de individuele quick-scan-vlaggen op de 10 kernvragen er 7 als "ja" markeren.
 * Voor de Team Quick Scan gebruiken we daarom een vaste selectie van 6 vragen met
 * maximale dekking van de acht competentiedimensies (alle 8 dimensies aan bod).
 */
export const TEAM_QUICK_SCAN_QUESTION_IDS = [
  "core-01",
  "core-02",
  "core-04",
  "core-06",
  "core-07",
  "core-09",
];

export function getTeamQuickScanQuestions(): Question[] {
  return TEAM_QUICK_SCAN_QUESTION_IDS.map(getQuestion);
}
