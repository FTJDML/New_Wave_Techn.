import { DIMENSIONS, type DimensionCode } from "@/domain/dimensions";
import { SCORE_ANCHORS, NOT_OBSERVED_LABEL, type ScoreEntry } from "@/domain/scoreScale";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export function DimensionScoreInput({
  dimension,
  value,
  onChange,
}: {
  dimension: DimensionCode;
  value: ScoreEntry | undefined;
  onChange: (value: ScoreEntry) => void;
}) {
  const groupId = `score-${dimension}`;
  return (
    <fieldset className="flex flex-col gap-2 rounded-md border border-border p-3">
      <legend className="px-1 text-sm font-semibold">
        {dimension} — {DIMENSIONS[dimension].name}
      </legend>
      <RadioGroup
        value={value === undefined ? "" : String(value)}
        onValueChange={(v) => onChange((v === "NOT_OBSERVED" ? "NOT_OBSERVED" : (Number(v) as ScoreEntry)))}
        aria-label={`Score voor ${dimension}`}
        className="flex flex-col gap-1.5"
      >
        <label className="flex items-center gap-2 rounded-md p-1.5 text-sm hover:bg-muted" htmlFor={`${groupId}-none`}>
          <RadioGroupItem value="NOT_OBSERVED" id={`${groupId}-none`} />
          <span>
            <strong>Niet waargenomen</strong> — <span className="text-muted-foreground">{NOT_OBSERVED_LABEL}</span>
          </span>
        </label>
        {SCORE_ANCHORS.map((anchor) => (
          <label
            key={anchor.value}
            className="flex items-center gap-2 rounded-md p-1.5 text-sm hover:bg-muted"
            htmlFor={`${groupId}-${anchor.value}`}
          >
            <RadioGroupItem value={String(anchor.value)} id={`${groupId}-${anchor.value}`} />
            <span>
              <strong>{anchor.label}</strong> — <span className="text-muted-foreground">{anchor.summary}</span>
            </span>
          </label>
        ))}
      </RadioGroup>
    </fieldset>
  );
}
