/**
 * Generieke scoreankers (sectie 6). Dezelfde schaal wordt gebruikt voor iedere
 * beoordeelde competentie, bij iedere vraag.
 */

export const NOT_OBSERVED = "NOT_OBSERVED" as const;

export type ScoreValue = 0 | 1 | 2 | 3 | 4;
export type ScoreEntry = ScoreValue | typeof NOT_OBSERVED;

export interface ScoreAnchor {
  value: ScoreValue;
  label: string;
  summary: string;
  criteria: string[];
}

export const SCORE_ANCHORS: ScoreAnchor[] = [
  {
    value: 0,
    label: "0 — Geen bruikbaar bewijs",
    summary: "Geen bruikbaar bewijs voor deze competentie.",
    criteria: [
      "antwoord is niet relevant",
      "fundamenteel incorrect",
      "belangrijke risico's worden niet herkend",
      "de deelnemer kan geen aanpak beschrijven",
    ],
  },
  {
    value: 1,
    label: "1 — Foundation / awareness",
    summary: "Kent termen, maar het antwoord blijft theoretisch of oppervlakkig.",
    criteria: [
      "kent enkele termen",
      "antwoord blijft theoretisch of oppervlakkig",
      "heeft veel sturing nodig",
      "noemt stappen zonder duidelijke samenhang",
      "geeft geen concreet eigen voorbeeld",
    ],
  },
  {
    value: 2,
    label: "2 — Junior practitioner",
    summary: "Kan een afgebakende taak uitvoeren met begeleiding.",
    criteria: [
      "kan een afgebakende taak uitvoeren",
      "beschrijft een grotendeels logische aanpak",
      "kent enkele basiscontroles",
      "heeft begeleiding of regelmatige review nodig",
      "kan een eenvoudig praktijkvoorbeeld geven",
    ],
  },
  {
    value: 3,
    label: "3 — Medior practitioner",
    summary: "Kan zelfstandig een werkpakket uitvoeren en bouwt validatie in.",
    criteria: [
      "kan zelfstandig een werkpakket uitvoeren",
      "werkt gestructureerd van probleem naar resultaat",
      "herkent trade-offs en risico's",
      "bouwt validatie en kwaliteitscontroles in",
      "kan keuzes onderbouwen met concrete voorbeelden",
    ],
  },
  {
    value: 4,
    label: "4 — Senior practitioner",
    summary: "Structureert ambigue problemen end-to-end en zet standaarden neer.",
    criteria: [
      "kan een ambigu probleem structureren",
      "denkt end-to-end en systeemgericht",
      "verbindt techniek, waarde, risico en governance",
      "maakt bewuste trade-offs",
      "voorkomt structurele problemen",
      "zet standaarden neer",
      "kan anderen begeleiden of coachen",
    ],
  },
];

export const NOT_OBSERVED_LABEL =
  "Niet waargenomen — de vraag of het antwoord gaf onvoldoende informatie om deze competentie te beoordelen.";

export const SCORING_EXCLUSIONS = [
  "spreektempo",
  "accent",
  "extraversie",
  "zelfvertrouwen",
  "lengte van het antwoord",
  "functietitel",
  "aantal dienstjaren",
  "leeftijd",
  "geslacht",
  "afkomst",
  "gezondheid",
  "andere beschermde of niet-functierelevante kenmerken",
];

export function isNumericScore(v: ScoreEntry | undefined | null): v is ScoreValue {
  return typeof v === "number";
}
