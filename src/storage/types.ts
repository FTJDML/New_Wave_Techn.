import type { AssessmentSession } from "@/domain/types";

export interface SessionSummary {
  id: string;
  sessionName: string;
  projectName: string;
  facilitatorName: string;
  date: string;
  participantCount: number;
  depth: AssessmentSession["settings"]["depth"];
  updatedAt: string;
  completed: boolean;
}

/**
 * Storage abstraction: alle UI-code praat uitsluitend met deze interface.
 * De MVP-implementatie (Dexie/IndexedDB) kan later 1-op-1 vervangen worden door
 * een implementatie die met een enterprise-backend praat, zonder dat features
 * hoeven te wijzigen.
 */
export interface StorageAdapter {
  listSessions(): Promise<SessionSummary[]>;
  getSession(id: string): Promise<AssessmentSession | null>;
  saveSession(session: AssessmentSession): Promise<void>;
  deleteSession(id: string): Promise<void>;
  getActiveSessionId(): Promise<string | null>;
  setActiveSessionId(id: string | null): Promise<void>;
  hasSeenOnboarding(): Promise<boolean>;
  setSeenOnboarding(value: boolean): Promise<void>;
}
