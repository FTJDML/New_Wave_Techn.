import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { ROLE_SELECT_OPTIONS } from "./roleOptions";
import { createSession } from "@/domain/sessionActions";
import { buildQuestionPlan, estimateSessionDuration } from "@/domain/questionPlan";
import { storage } from "@/storage";
import type { AssessmentDepth, InterviewOrder } from "@/domain/types";
import type { RoleId } from "@/domain/roles";
import { createId } from "@/lib/utils";

interface ParticipantDraft {
  key: string;
  pseudonym: string;
  currentJobTitle: string;
  primaryRole: RoleId;
  secondaryRole: RoleId | "";
}

interface NeedDraft {
  key: string;
  role: RoleId;
  level: "FOUNDATION" | "JUNIOR" | "MEDIOR" | "SENIOR";
  count: number;
  note: string;
}

const LEVEL_OPTIONS = [
  { value: "FOUNDATION", label: "Foundation" },
  { value: "JUNIOR", label: "Junior" },
  { value: "MEDIOR", label: "Medior" },
  { value: "SENIOR", label: "Senior" },
] as const;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function newParticipant(): ParticipantDraft {
  return {
    key: createId("draft-participant"),
    pseudonym: "",
    currentJobTitle: "",
    primaryRole: "GENERALIST",
    secondaryRole: "",
  };
}

function newNeed(): NeedDraft {
  return { key: createId("draft-need"), role: "DATA_ANALYST", level: "MEDIOR", count: 1, note: "" };
}

export function NewSessionPage() {
  const navigate = useNavigate();

  const [sessionName, setSessionName] = useState("");
  const [projectName, setProjectName] = useState("Fictief Ahold-project");
  const [projectContext, setProjectContext] = useState("");
  const [facilitatorName, setFacilitatorName] = useState("");
  const [date, setDate] = useState(today());
  const [depth, setDepth] = useState<AssessmentDepth>("STANDARD");
  const [order, setOrder] = useState<InterviewOrder>("ROUND_ROBIN");
  const [participants, setParticipants] = useState<ParticipantDraft[]>([newParticipant()]);
  const [needs, setNeeds] = useState<NeedDraft[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const durationEstimate = useMemo(() => {
    const sampleParticipant = {
      id: "sample",
      pseudonym: "Sample",
      primaryRole: participants[0]?.primaryRole ?? "GENERALIST",
      secondaryRole:
        participants[0]?.secondaryRole && participants[0].secondaryRole !== ""
          ? participants[0].secondaryRole
          : undefined,
      order: 0,
    };
    const sampleQuestionIds = buildQuestionPlan(sampleParticipant, depth);
    return estimateSessionDuration({
      depth,
      order,
      participantCount: Math.max(1, participants.length),
      sampleQuestionIds,
    });
  }, [depth, order, participants]);

  function updateParticipant(key: string, patch: Partial<ParticipantDraft>) {
    setParticipants((prev) => prev.map((p) => (p.key === key ? { ...p, ...patch } : p)));
  }

  function updateNeed(key: string, patch: Partial<NeedDraft>) {
    setNeeds((prev) => prev.map((n) => (n.key === key ? { ...n, ...patch } : n)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationErrors: string[] = [];
    if (!sessionName.trim()) validationErrors.push("Sessienaam is verplicht.");
    if (!projectName.trim()) validationErrors.push("Projectnaam is verplicht.");
    if (!facilitatorName.trim()) validationErrors.push("Naam of initialen van de facilitator zijn verplicht.");
    const validParticipants = participants.filter((p) => p.pseudonym.trim());
    if (validParticipants.length === 0) {
      validationErrors.push("Voeg minimaal één deelnemer toe met een pseudoniem.");
    }
    const duplicatePseudonyms = validParticipants
      .map((p) => p.pseudonym.trim().toLowerCase())
      .filter((v, i, arr) => arr.indexOf(v) !== i);
    if (duplicatePseudonyms.length > 0) {
      validationErrors.push("Pseudoniemen moeten binnen deze sessie uniek zijn.");
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    const session = createSession(
      {
        sessionName: sessionName.trim(),
        projectName: projectName.trim(),
        projectContext: projectContext.trim(),
        facilitatorName: facilitatorName.trim(),
        date,
        depth,
        order,
        language: "nl",
      },
      validParticipants.map((p) => ({
        pseudonym: p.pseudonym.trim(),
        currentJobTitle: p.currentJobTitle.trim() || undefined,
        primaryRole: p.primaryRole,
        secondaryRole: p.secondaryRole === "" ? undefined : p.secondaryRole,
      })),
      needs.map((n) => ({ role: n.role, level: n.level, count: n.count, note: n.note.trim() || undefined })),
      new Date().toISOString()
    );

    await storage.saveSession(session);
    navigate(`/sessions/${session.id}/interview`);
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Nieuwe sessie</h1>
        <p className="text-sm text-muted-foreground">
          Gebruik uitsluitend fictieve namen en fictieve projectgegevens.
        </p>
      </div>

      {errors.length > 0 && (
        <Alert variant="warning">
          <ul className="list-inside list-disc">
            {errors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Sessie-instellingen</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Sessienaam" htmlFor="sessionName" required>
              <Input
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="Bijv. Readiness scan team Analytics"
              />
            </Field>
            <Field label="Projectnaam" htmlFor="projectName" required>
              <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} />
            </Field>
          </div>
          <Field label="Korte projectcontext" htmlFor="projectContext" hint="Optioneel — één of twee zinnen.">
            <Textarea
              value={projectContext}
              onChange={(e) => setProjectContext(e.target.value)}
              rows={2}
              placeholder="Bijv. fictieve pilot voor omzetanalyse in retailwinkels."
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Naam of initialen facilitator" htmlFor="facilitatorName" required>
              <Input value={facilitatorName} onChange={(e) => setFacilitatorName(e.target.value)} />
            </Field>
            <Field label="Datum" htmlFor="date" required>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium">Assessmentdiepte</legend>
            <RadioGroup value={depth} onValueChange={(v) => setDepth(v as AssessmentDepth)}>
              <label className="flex items-start gap-3 rounded-md border border-border p-3">
                <RadioGroupItem value="STANDARD" id="depth-standard" />
                <span>
                  <span className="block font-medium">Standaardassessment</span>
                  <span className="block text-sm text-muted-foreground">
                    20–25 min per deelnemer. 10 kernvragen + 2 vragen primaire rol + optioneel 1 vraag secundaire
                    rol. Individueel niveau, rolfit en inzetadvies.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-3 rounded-md border border-border p-3">
                <RadioGroupItem value="QUICK_SCAN" id="depth-quickscan" />
                <span>
                  <span className="block font-medium">Team Quick Scan</span>
                  <span className="block text-sm text-muted-foreground">
                    20–25 min totaal. 6 kernvragen, alleen teamniveau — geen individuele classificatie of
                    inzetadvies.
                  </span>
                </span>
              </label>
            </RadioGroup>
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium">Interviewvolgorde</legend>
            <RadioGroup value={order} onValueChange={(v) => setOrder(v as InterviewOrder)}>
              <label className="flex items-start gap-3 rounded-md border border-border p-3">
                <RadioGroupItem value="ROUND_ROBIN" id="order-roundrobin" />
                <span>
                  <span className="block font-medium">Round-robin</span>
                  <span className="block text-sm text-muted-foreground">
                    Eén vraag per keer, loop door alle deelnemers, ga daarna naar de volgende vraag.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-3 rounded-md border border-border p-3">
                <RadioGroupItem value="PERSON_BY_PERSON" id="order-person" />
                <span>
                  <span className="block font-medium">Persoon voor persoon</span>
                  <span className="block text-sm text-muted-foreground">
                    Rond eerst alle vragen voor deelnemer 1 af, ga daarna naar deelnemer 2.
                  </span>
                </span>
              </label>
            </RadioGroup>
          </fieldset>

          <Field label="Taal" htmlFor="language">
            <Input id="language" value="Nederlands" disabled readOnly />
          </Field>

          <Alert variant="info">
            Geschatte totale duur: <strong>{durationEstimate.totalMinutes} minuten</strong> (
            {durationEstimate.questionCount} vragen × {participants.length || 1} deelnemer(s), inclusief tijd voor
            notities en scoren).
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Deelnemers</CardTitle>
          <CardDescription>
            Gebruik een pseudoniem in plaats van de echte naam van de deelnemer.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {participants.map((p, index) => (
            <div key={p.key} className="flex flex-col gap-3 rounded-md border border-border p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Deelnemer {index + 1}</span>
                {participants.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label={`Deelnemer ${index + 1} verwijderen`}
                    onClick={() => setParticipants((prev) => prev.filter((x) => x.key !== p.key))}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Pseudoniem" htmlFor={`pseudonym-${p.key}`} required>
                  <Input
                    value={p.pseudonym}
                    onChange={(e) => updateParticipant(p.key, { pseudonym: e.target.value })}
                    placeholder="Bijv. Deelnemer A"
                  />
                </Field>
                <Field label="Huidige functietitel" htmlFor={`title-${p.key}`} hint="Optioneel">
                  <Input
                    value={p.currentJobTitle}
                    onChange={(e) => updateParticipant(p.key, { currentJobTitle: e.target.value })}
                  />
                </Field>
              </div>
              {depth === "STANDARD" && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Primaire doelrol" htmlFor={`primary-${p.key}`}>
                    <Select
                      value={p.primaryRole}
                      onValueChange={(v) => updateParticipant(p.key, { primaryRole: v as RoleId })}
                    >
                      <SelectTrigger id={`primary-${p.key}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLE_SELECT_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Secundaire doelrol" htmlFor={`secondary-${p.key}`} hint="Optioneel">
                    <Select
                      value={p.secondaryRole || "__none__"}
                      onValueChange={(v) =>
                        updateParticipant(p.key, { secondaryRole: v === "__none__" ? "" : (v as RoleId) })
                      }
                    >
                      <SelectTrigger id={`secondary-${p.key}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Geen</SelectItem>
                        {ROLE_SELECT_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => setParticipants((prev) => [...prev, newParticipant()])}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Deelnemer toevoegen
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Projectbehoeften</CardTitle>
          <CardDescription>
            Optioneel. Wordt later vergeleken met de aangetroffen teamdekking — er wordt nooit automatisch iemand
            toegewezen.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {needs.map((n, index) => (
            <div key={n.key} className="flex flex-col gap-3 rounded-md border border-border p-3 sm:flex-row sm:items-end">
              <Field label="Rol" htmlFor={`need-role-${n.key}`} className="flex-1">
                <Select value={n.role} onValueChange={(v) => updateNeed(n.key, { role: v as RoleId })}>
                  <SelectTrigger id={`need-role-${n.key}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_SELECT_OPTIONS.filter((o) => o.value !== "GENERALIST").map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Niveau" htmlFor={`need-level-${n.key}`}>
                <Select
                  value={n.level}
                  onValueChange={(v) => updateNeed(n.key, { level: v as NeedDraft["level"] })}
                >
                  <SelectTrigger id={`need-level-${n.key}`} className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEVEL_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Aantal" htmlFor={`need-count-${n.key}`} className="w-24">
                <Input
                  type="number"
                  min={1}
                  value={n.count}
                  onChange={(e) => updateNeed(n.key, { count: Math.max(1, Number(e.target.value) || 1) })}
                />
              </Field>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={`Projectbehoefte ${index + 1} verwijderen`}
                onClick={() => setNeeds((prev) => prev.filter((x) => x.key !== n.key))}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={() => setNeeds((prev) => [...prev, newNeed()])}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Projectbehoefte toevoegen
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => navigate("/")}>
          Annuleren
        </Button>
        <Button type="submit">Sessie starten</Button>
      </div>
    </form>
  );
}
