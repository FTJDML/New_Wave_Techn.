import { ShieldCheck } from "lucide-react";
import { DECISION_SUPPORT_NOTICE } from "@/domain/deployment";
import { cn } from "@/lib/utils";

/**
 * Subtiele, terugkerende melding (sectie 13): dit is beslissingsondersteuning,
 * geen automatische personeelsbeslissing. Overal waar niveaus, rolfit of
 * inzetadvies getoond worden, hoort deze melding in de buurt te staan.
 */
export function DecisionSupportNotice({ className }: { className?: string }) {
  return (
    <p className={cn("flex items-center gap-1.5 text-xs text-muted-foreground", className)}>
      <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {DECISION_SUPPORT_NOTICE}
    </p>
  );
}
