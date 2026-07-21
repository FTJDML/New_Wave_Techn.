import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Trash2, Upload, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { storage, type SessionSummary } from "@/storage";
import { parseSessionExport, SessionImportError } from "@/domain/exportImport";
import { formatDate } from "@/lib/utils";

export function HomePage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionSummary[] | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SessionSummary | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    setSessions(await storage.listSessions());
  }, []);

  useEffect(() => {
    storage.hasSeenOnboarding().then((seen) => {
      if (!seen) navigate("/onboarding?next=/", { replace: true });
    });
    refresh();
  }, [navigate, refresh]);

  async function handleImportFile(file: File) {
    setImportError(null);
    try {
      const text = await file.text();
      const session = parseSessionExport(text);
      const existing = await storage.getSession(session.id);
      if (existing) {
        session.id = `${session.id}_import_${Date.now()}`;
      }
      await storage.saveSession(session);
      await refresh();
    } catch (e) {
      setImportError(
        e instanceof SessionImportError
          ? e.message
          : "Het importeren is mislukt. Controleer of dit een geldig geëxporteerd sessiebestand is."
      );
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    const session = await storage.getSession(pendingDelete.id);
    if (session) {
      await storage.deleteSession(session.id);
    }
    setPendingDelete(null);
    await refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Sessies</h1>
          <p className="text-sm text-muted-foreground">
            Fictieve teamleden, fictief project — alle gegevens blijven lokaal in deze browser.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4" aria-hidden="true" />
            Sessie importeren
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            aria-label="Sessiebestand importeren"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImportFile(file);
              e.target.value = "";
            }}
          />
          <Button onClick={() => navigate("/sessions/new")}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nieuwe sessie
          </Button>
        </div>
      </div>

      {importError && (
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {importError}
        </p>
      )}

      {sessions === null ? (
        <p className="text-sm text-muted-foreground">Sessies laden…</p>
      ) : sessions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center text-muted-foreground">
            <Users className="h-10 w-10" aria-hidden="true" />
            <p>Er zijn nog geen sessies. Maak een nieuwe sessie aan om te beginnen.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sessions.map((s) => (
            <Card key={s.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{s.sessionName}</CardTitle>
                  <Badge variant={s.depth === "QUICK_SCAN" ? "secondary" : "default"}>
                    {s.depth === "QUICK_SCAN" ? "Quick Scan" : "Standaard"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{s.projectName}</p>
              </CardHeader>
              <CardContent className="flex flex-col gap-1 text-sm text-muted-foreground">
                <span>Facilitator: {s.facilitatorName || "—"}</span>
                <span>Datum: {formatDate(s.date)}</span>
                <span>Deelnemers: {s.participantCount}</span>
                {s.completed && <Badge variant="success" className="mt-1 w-fit">Afgerond</Badge>}
              </CardContent>
              <CardFooter className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => navigate(`/sessions/${s.id}/interview`)}>
                  Interview
                </Button>
                <Button size="sm" variant="outline" onClick={() => navigate(`/sessions/${s.id}/team`)}>
                  Teamresultaten
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={`Sessie ${s.sessionName} verwijderen`}
                  onClick={() => setPendingDelete(s)}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent title="Sessie verwijderen?">
          <p className="text-sm text-muted-foreground">
            Weet je zeker dat je <strong>{pendingDelete?.sessionName}</strong> permanent wilt verwijderen? Alle
            antwoorden, scores en het wijzigingslog van deze sessie gaan verloren. Dit kan niet ongedaan worden
            gemaakt.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="outline">Annuleren</Button>
            </DialogClose>
            <Button variant="destructive" onClick={confirmDelete}>
              Definitief verwijderen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
