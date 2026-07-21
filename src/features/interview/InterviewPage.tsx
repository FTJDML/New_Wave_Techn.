import { useEffect, useMemo, useState, useCallback, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, SkipForward, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { DecisionSupportNotice } from "@/components/DecisionSupportNotice";
import { useSessionContext } from "@/features/session/SessionProvider";
import { AnswerForm } from "./AnswerForm";
import { useTicker } from "./useTicker";
import {
  buildStepSequence,
  findStepPosition,
  goNextParticipant,
  goNextQuestion,
  goPrevious,
  isLastStep,
} from "./navigation";
import { getQuestion } from "@/data/questionBank.nl";
import { upsertAnswer, appendQuestionsToPlan, createEmptyAnswer } from "@/domain/sessionActions";
import { computeDimensionStats } from "@/domain/dimensionScore";
import { getGeneralistFollowupQuestionIds } from "@/domain/questionPlan";
import { formatDuration } from "@/lib/utils";
import type { DimensionCode } from "@/domain/dimensions";
import type { ScoreEntry } from "@/domain/scoreScale";

export function InterviewPage() {
  const navigate = useNavigate();
  const { session, updateSession, isSaving, lastSavedAt } = useSessionContext();
  const [pendingScoreChange, setPendingScoreChange] = useState<{
    questionId: string;
    dimension: DimensionCode;
    value: ScoreEntry;
    participantId: string;
  } | null>(null);
  const [changeReason, setChangeReason] = useState("");

  const now = useTicker(1000);

  const steps = useMemo(() => buildStepSequence(session), [session]);
  const currentPos = findStepPosition(
    steps,
    session.progress.currentParticipantIndex,
    session.progress.currentQuestionIndex
  );
  const currentStep = steps[currentPos];

  useEffect(() => {
    if (!session.progress.totalStartedAt) {
      updateSession((s) => ({ ...s, progress: { ...s.progress, totalStartedAt: new Date().toISOString() } }));
    }
  }, [session.progress.totalStartedAt, updateSession]);

  useEffect(() => {
    updateSession((s) => ({ ...s, progress: { ...s.progress, questionStartedAt: new Date().toISOString() } }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep?.participantId, currentStep?.questionId]);

  // Dynamische vervolgvragen voor Generalisten zodra de tien kernvragen zijn afgerond.
  useEffect(() => {
    for (const participant of session.participants) {
      if (participant.primaryRole !== "GENERALIST") continue;
      const plan = session.questionPlan[participant.id] ?? [];
      if (plan.length !== 10) continue;
      const answers = session.answers.filter((a) => a.participantId === participant.id);
      const coreAnswered = answers.filter((a) => a.answered).length;
      if (coreAnswered < 10) continue;
      const stats = computeDimensionStats(answers);
      const followupIds = getGeneralistFollowupQuestionIds(stats, plan);
      if (followupIds.length > 0) {
        updateSession((s) => appendQuestionsToPlan(s, participant.id, followupIds, new Date().toISOString()));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.answers]);

  const currentAnswer = useMemo(() => {
    if (!currentStep) return null;
    return (
      session.answers.find(
        (a) => a.participantId === currentStep.participantId && a.questionId === currentStep.questionId
      ) ?? createEmptyAnswer(currentStep.participantId, currentStep.questionId)
    );
  }, [session.answers, currentStep]);

  const currentParticipant = session.participants.find((p) => p.id === currentStep?.participantId);
  const isConfirmed = currentStep ? session.reviews[currentStep.participantId]?.reviewConfirmed === true : false;

  const applyScoreChange = useCallback(
    (dimension: DimensionCode, value: ScoreEntry, reason?: string) => {
      if (!currentStep) return;
      updateSession((s) =>
        upsertAnswer(
          s,
          currentStep.participantId,
          currentStep.questionId,
          { scores: { [dimension]: value }, answered: true },
          { nowIso: new Date().toISOString(), changeReason: reason }
        )
      );
    },
    [currentStep, updateSession]
  );

  function handleScoreChange(dimension: DimensionCode, value: ScoreEntry) {
    if (isConfirmed && currentStep) {
      setPendingScoreChange({ questionId: currentStep.questionId, dimension, value, participantId: currentStep.participantId });
      setChangeReason("");
      return;
    }
    applyScoreChange(dimension, value);
  }

  function confirmPendingScoreChange() {
    if (!pendingScoreChange) return;
    applyScoreChange(pendingScoreChange.dimension, pendingScoreChange.value, changeReason);
    setPendingScoreChange(null);
  }

  function updateField(patch: Partial<Parameters<typeof upsertAnswer>[3]>) {
    if (!currentStep) return;
    updateSession((s) =>
      upsertAnswer(s, currentStep.participantId, currentStep.questionId, patch, {
        nowIso: new Date().toISOString(),
      })
    );
  }

  function goNext() {
    const nextPos = goNextQuestion(steps, currentPos, session.settings.order);
    const nextStep = steps[nextPos];
    if (!nextStep) return;
    updateSession((s) => ({
      ...s,
      progress: {
        ...s.progress,
        currentParticipantIndex: nextStep.participantIndex,
        currentQuestionIndex: nextStep.questionIndex,
        completed: isLastStep(steps, currentPos) && nextPos === currentPos,
      },
    }));
  }

  function goNextPerson() {
    const nextPos = goNextParticipant(steps, currentPos, session.settings.order);
    const nextStep = steps[nextPos];
    if (!nextStep) return;
    updateSession((s) => ({
      ...s,
      progress: {
        ...s.progress,
        currentParticipantIndex: nextStep.participantIndex,
        currentQuestionIndex: nextStep.questionIndex,
      },
    }));
  }

  function goBack() {
    const prevPos = goPrevious(currentPos);
    const prevStep = steps[prevPos];
    if (!prevStep) return;
    updateSession((s) => ({
      ...s,
      progress: {
        ...s.progress,
        currentParticipantIndex: prevStep.participantIndex,
        currentQuestionIndex: prevStep.questionIndex,
      },
    }));
  }

  function markAnswered() {
    if (!currentStep) return;
    updateSession((s) =>
      upsertAnswer(s, currentStep.participantId, currentStep.questionId, { answered: true }, { nowIso: new Date().toISOString() })
    );
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key === "Enter") {
        e.preventDefault();
        markAnswered();
      } else if (e.altKey && e.shiftKey && e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      } else if (e.altKey && e.key === "ArrowRight") {
        e.preventDefault();
        goNextPerson();
      } else if (e.altKey && e.key === "ArrowLeft") {
        e.preventDefault();
        goBack();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPos, steps, session.settings.order]);

  if (!currentStep || !currentAnswer || !currentParticipant) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <p>Alle geplande vragen voor deze sessie zijn doorlopen.</p>
          <div className="flex gap-2">
            <Button onClick={() => navigate(`/sessions/${session.id}/team`)}>Naar teamresultaten</Button>
            {session.participants[0] && (
              <Button variant="outline" onClick={() => navigate(`/sessions/${session.id}/results/${session.participants[0].id}`)}>
                Individuele resultaten
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const question = getQuestion(currentStep.questionId);
  const totalSteps = steps.length;
  const progressPct = Math.round(((currentPos + 1) / Math.max(1, totalSteps)) * 100);

  const totalElapsedSec = session.progress.totalStartedAt
    ? Math.floor((now - new Date(session.progress.totalStartedAt).getTime()) / 1000)
    : 0;
  const questionElapsedSec = session.progress.questionStartedAt
    ? Math.floor((now - new Date(session.progress.questionStartedAt).getTime()) / 1000)
    : 0;
  const remainingSteps = Math.max(0, totalSteps - currentPos - 1);
  const remainingEstimateSec = remainingSteps * (question.timeBudgetSeconds + 30);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-3 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="text-xl font-semibold">{session.settings.sessionName}</h1>
              <p className="text-sm text-muted-foreground">
                Vraag {currentPos + 1} van {totalSteps} · {session.settings.depth === "QUICK_SCAN" ? "Team Quick Scan" : "Standaardassessment"}
              </p>
            </div>
            <p className="text-xs text-muted-foreground" aria-live="polite">
              {isSaving ? "Bezig met lokaal opslaan…" : lastSavedAt ? "Automatisch lokaal opgeslagen" : "Nog niet opgeslagen"}
            </p>
          </div>
          <Progress value={progressPct} label="Voortgang van de sessie" />
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <TimerStat label="Tijd deze vraag" value={formatDuration(questionElapsedSec)} />
            <TimerStat label="Totale tijd" value={formatDuration(totalElapsedSec)} />
            <TimerStat label="Geschat resterend" value={formatDuration(remainingEstimateSec)} />
            <TimerStat label="Huidige deelnemer" value={currentParticipant.pseudonym} icon={<Users className="h-4 w-4" aria-hidden="true" />} />
          </div>
          <DecisionSupportNotice />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
        <Card>
          <CardContent className="pt-5">
            <AnswerForm
              question={question}
              answer={currentAnswer}
              onChangeNotes={(notes) => updateField({ notes })}
              onChangeEvidenceQuality={(v) => updateField({ evidenceQuality: v })}
              onChangeScore={handleScoreChange}
              onChangeConfidence={(v) => updateField({ facilitatorConfidence: v })}
              onToggleTag={(tag) =>
                updateField({
                  observationTags: currentAnswer.observationTags.includes(tag)
                    ? currentAnswer.observationTags.filter((t) => t !== tag)
                    : [...currentAnswer.observationTags, tag],
                })
              }
            />

            <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
              <Button variant="outline" onClick={goBack} disabled={currentPos === 0}>
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Vorige
              </Button>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={markAnswered}>
                  Antwoord opslaan (Ctrl/Cmd + Enter)
                </Button>
                <Button variant="secondary" onClick={goNextPerson}>
                  <SkipForward className="h-4 w-4" aria-hidden="true" />
                  Volgende deelnemer
                </Button>
                <Button onClick={goNext}>
                  Volgende vraag
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:sticky lg:top-4 lg:self-start">
          <CardContent className="flex flex-col gap-2 pt-5">
            <h2 className="text-sm font-semibold">Deelnemersoverzicht</h2>
            <ul className="flex flex-col gap-1.5">
              {[...session.participants]
                .sort((a, b) => a.order - b.order)
                .map((p) => {
                  const isActive = p.id === currentParticipant.id;
                  const answeredCount = session.answers.filter((a) => a.participantId === p.id && a.answered).length;
                  const planLength = (session.questionPlan[p.id] ?? []).length;
                  return (
                    <li
                      key={p.id}
                      className={
                        "flex items-center justify-between gap-2 rounded-md border px-2.5 py-2 text-sm " +
                        (isActive ? "border-primary bg-primary/5 font-medium" : "border-border")
                      }
                    >
                      <span>{p.pseudonym}</span>
                      <Badge variant={isActive ? "default" : "outline"}>
                        {answeredCount}/{planLength}
                      </Badge>
                    </li>
                  );
                })}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Dialog open={pendingScoreChange !== null} onOpenChange={(open) => !open && setPendingScoreChange(null)}>
        <DialogContent title="Reden voor wijziging van een bevestigd resultaat">
          <p className="text-sm text-muted-foreground">
            Dit resultaat is al bevestigd als besproken met de deelnemer. Geef een korte reden voor deze wijziging —
            dit wordt vastgelegd in het wijzigingslog met oude score, nieuwe score en tijdstip.
          </p>
          <Textarea
            className="mt-3"
            value={changeReason}
            onChange={(e) => setChangeReason(e.target.value)}
            placeholder="Bijv. aanvullend voorbeeld tijdens nabespreking met deelnemer"
            aria-label="Reden voor scorewijziging"
          />
          <div className="mt-4 flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="outline" onClick={() => setPendingScoreChange(null)}>
                Annuleren
              </Button>
            </DialogClose>
            <Button onClick={confirmPendingScoreChange} disabled={!changeReason.trim()}>
              Wijziging vastleggen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TimerStat({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div className="rounded-md bg-muted p-2">
      <p className="flex items-center gap-1 text-xs text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="font-mono text-base font-semibold">{value}</p>
    </div>
  );
}
