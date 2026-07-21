import { useState } from "react";
import { ChevronDown, Info } from "lucide-react";
import { DIMENSIONS } from "@/domain/dimensions";
import { SCORE_ANCHORS, NOT_OBSERVED_LABEL } from "@/domain/scoreScale";
import type { Question } from "@/data/questionTypes";
import { cn } from "@/lib/utils";

export function FacilitatorInfoPanel({ question }: { question: Question }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-md border border-border">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="flex items-center gap-2">
          <Info className="h-4 w-4 text-primary" aria-hidden="true" />
          Facilitatorinformatie
        </span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>
      {open && (
        <div className="flex flex-col gap-4 border-t border-border px-4 py-4 text-sm">
          <div>
            <h4 className="mb-1 font-semibold">Waarom deze vraag</h4>
            <p className="text-muted-foreground">{question.facilitator.why}</p>
          </div>
          <div>
            <h4 className="mb-1 font-semibold">Mogelijke doorvraag</h4>
            <p className="text-muted-foreground">{question.facilitator.followUp}</p>
          </div>
          <div>
            <h4 className="mb-1 font-semibold">Beoordeelde competenties</h4>
            <ul className="list-inside list-disc text-muted-foreground">
              {question.dimensions.map((d) => (
                <li key={d}>
                  {d} — {DIMENSIONS[d].name}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-1 font-semibold">Signalen van een sterk antwoord</h4>
            <ul className="list-inside list-disc text-muted-foreground">
              {question.facilitator.strongSignals.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-1 font-semibold">Veelvoorkomende valkuilen</h4>
            <ul className="list-inside list-disc text-muted-foreground">
              {question.facilitator.pitfalls.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-1 font-semibold">Generieke scoreankers</h4>
            <ul className="flex flex-col gap-1 text-muted-foreground">
              <li>
                <strong>Niet waargenomen</strong> — {NOT_OBSERVED_LABEL}
              </li>
              {SCORE_ANCHORS.map((anchor) => (
                <li key={anchor.value}>
                  <strong>{anchor.label}</strong> — {anchor.summary}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
