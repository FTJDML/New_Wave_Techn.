import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { AssessmentSession } from "@/domain/types";
import { storage } from "@/storage";

interface SessionContextValue {
  session: AssessmentSession;
  updateSession: (updater: (session: AssessmentSession) => AssessmentSession) => void;
  isSaving: boolean;
  lastSavedAt: string | null;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function useSessionContext(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSessionContext moet binnen een SessionProvider gebruikt worden.");
  return ctx;
}

const AUTOSAVE_DELAY_MS = 600;

export function SessionProvider({ children }: { children: ReactNode }) {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<AssessmentSession | null | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    storage.getSession(sessionId).then((s) => setSession(s));
    storage.setActiveSessionId(sessionId);
  }, [sessionId]);

  const updateSession = useCallback(
    (updater: (session: AssessmentSession) => AssessmentSession) => {
      setSession((prev) => {
        if (!prev) return prev;
        const next = updater(prev);
        setIsSaving(true);
        if (saveTimeout.current) clearTimeout(saveTimeout.current);
        saveTimeout.current = setTimeout(async () => {
          await storage.saveSession(next);
          setIsSaving(false);
          setLastSavedAt(new Date().toISOString());
        }, AUTOSAVE_DELAY_MS);
        return next;
      });
    },
    []
  );

  if (session === undefined) {
    return <p className="text-sm text-muted-foreground">Sessie laden…</p>;
  }

  if (session === null) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm text-destructive">Deze sessie kon niet worden gevonden.</p>
        <button className="underline" onClick={() => navigate("/")}>
          Terug naar sessieoverzicht
        </button>
      </div>
    );
  }

  return (
    <SessionContext.Provider value={{ session, updateSession, isSaving, lastSavedAt }}>
      {children}
    </SessionContext.Provider>
  );
}
