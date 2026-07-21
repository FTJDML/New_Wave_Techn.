import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { DimensionScoreInput } from "./DimensionScoreInput";
import { FacilitatorInfoPanel } from "./FacilitatorInfoPanel";
import type { Question } from "@/data/questionTypes";
import type { AnswerRecord, EvidenceQuality, FacilitatorConfidence, ObservationTag } from "@/domain/types";
import {
  EVIDENCE_QUALITY_LABELS,
  FACILITATOR_CONFIDENCE_LABELS,
  OBSERVATION_TAG_LABELS,
} from "@/domain/types";
import type { DimensionCode } from "@/domain/dimensions";
import type { ScoreEntry } from "@/domain/scoreScale";

const EVIDENCE_OPTIONS: EvidenceQuality[] = ["NONE", "GENERAL", "CONCRETE", "CONCRETE_MEASURABLE"];
const CONFIDENCE_OPTIONS: FacilitatorConfidence[] = ["LOW", "MEDIUM", "HIGH"];
const TAG_OPTIONS: ObservationTag[] = ["STRENGTH", "DEVELOPMENT", "NEEDS_VALIDATION"];

export interface AnswerFormProps {
  question: Question;
  answer: AnswerRecord;
  onChangeNotes: (notes: string) => void;
  onChangeEvidenceQuality: (v: EvidenceQuality) => void;
  onChangeScore: (dimension: DimensionCode, value: ScoreEntry) => void;
  onChangeConfidence: (v: FacilitatorConfidence) => void;
  onToggleTag: (tag: ObservationTag) => void;
}

export function AnswerForm({
  question,
  answer,
  onChangeNotes,
  onChangeEvidenceQuality,
  onChangeScore,
  onChangeConfidence,
  onToggleTag,
}: AnswerFormProps) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold">{question.title}</h2>
        <p className="mt-1 text-base leading-relaxed">{question.prompt}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Tijdsbudget: circa {question.timeBudgetSeconds} seconden. Mogelijke doorvraag: “{question.followUpPrompt}”
        </p>
      </div>

      <FacilitatorInfoPanel question={question} />

      <Field
        label="Antwoordnotities"
        htmlFor={`notes-${question.id}`}
        hint="Korte zinnen en bullets zijn prima. Geen automatische analyse — noteer alleen wat je hoort en ziet."
      >
        <Textarea
          value={answer.notes}
          onChange={(e) => onChangeNotes(e.target.value)}
          rows={5}
          placeholder="Bijv. noemt duidelijk probleem, geen concreet voorbeeld, twijfelt over eigen bijdrage…"
        />
      </Field>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">Bewijskwaliteit</legend>
        <RadioGroup value={answer.evidenceQuality} onValueChange={(v) => onChangeEvidenceQuality(v as EvidenceQuality)}>
          {EVIDENCE_OPTIONS.map((opt) => (
            <label key={opt} className="flex items-center gap-2 rounded-md border border-border p-2 text-sm">
              <RadioGroupItem value={opt} id={`evidence-${question.id}-${opt}`} />
              {EVIDENCE_QUALITY_LABELS[opt]}
            </label>
          ))}
        </RadioGroup>
      </fieldset>

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-medium">Scores per beoordeelde competentie</h3>
        {question.dimensions.map((dim) => (
          <DimensionScoreInput
            key={dim}
            dimension={dim}
            value={answer.scores[dim]}
            onChange={(value) => onChangeScore(dim, value)}
          />
        ))}
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">Confidence van de facilitator</legend>
        <RadioGroup
          value={answer.facilitatorConfidence ?? ""}
          onValueChange={(v) => onChangeConfidence(v as FacilitatorConfidence)}
          className="flex flex-row gap-3"
        >
          {CONFIDENCE_OPTIONS.map((opt) => (
            <label key={opt} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
              <RadioGroupItem value={opt} id={`confidence-${question.id}-${opt}`} />
              {FACILITATOR_CONFIDENCE_LABELS[opt]}
            </label>
          ))}
        </RadioGroup>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">Optionele observatie</legend>
        <div className="flex flex-wrap gap-3">
          {TAG_OPTIONS.map((tag) => (
            <label key={tag} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
              <Checkbox
                checked={answer.observationTags.includes(tag)}
                onCheckedChange={() => onToggleTag(tag)}
                id={`tag-${question.id}-${tag}`}
              />
              <Label htmlFor={`tag-${question.id}-${tag}`} className="cursor-pointer font-normal">
                {OBSERVATION_TAG_LABELS[tag]}
              </Label>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
