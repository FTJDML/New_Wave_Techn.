import { useNavigate, useSearchParams } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { storage } from "@/storage";

const POINTS = [
  "Dit is een indicatief assessment, geen gevalideerde psychometrische test.",
  "De uitkomst is geen automatische personeelsbeslissing — de uiteindelijke beoordeling en staffingbeslissing blijven bij bevoegde mensen.",
  "Alleen functierelevante competenties mogen worden beoordeeld (zie de acht competentiedimensies en de scoreankers).",
  "Antwoorden en scores blijven in deze MVP lokaal in de browser van de facilitator — er wordt niets naar een externe server verzonden.",
  "Deelnemers moeten vooraf weten waarvoor deze informatie wordt gebruikt.",
  "Deelnemers moeten de gelegenheid krijgen feitelijke onjuistheden te corrigeren.",
  "Gevoelige of beschermde persoonsgegevens (gezondheid, afkomst, leeftijd, geslacht e.d.) horen niet in de notities.",
  "Resultaten moeten door een bevoegde manager en eventueel HR worden gevalideerd voordat ze ergens toe leiden.",
];

export function OnboardingScreen() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  async function handleContinue() {
    await storage.setSeenOnboarding(true);
    navigate(params.get("next") ?? "/", { replace: true });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-primary">
            <ShieldAlert className="h-6 w-6" aria-hidden="true" />
            <CardTitle>Voordat je begint: uitgangspunten van deze scan</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-3 text-sm leading-relaxed">
            {POINTS.map((point) => (
              <li key={point} className="flex gap-2">
                <span aria-hidden="true" className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex justify-end">
            <Button onClick={handleContinue} autoFocus>
              Ik begrijp dit en ga verder
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
