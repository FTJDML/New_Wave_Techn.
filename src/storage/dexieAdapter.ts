import { db } from "./db";
import type { StorageAdapter, SessionSummary } from "./types";
import type { AssessmentSession } from "@/domain/types";

const ACTIVE_SESSION_KEY = "activeSessionId";
const ONBOARDING_KEY = "hasSeenOnboarding";

export class DexieStorageAdapter implements StorageAdapter {
  async listSessions(): Promise<SessionSummary[]> {
    const sessions = await db.sessions.toArray();
    return sessions
      .filter((s) => !s.deletedAt)
      .map((s) => ({
        id: s.id,
        sessionName: s.settings.sessionName,
        projectName: s.settings.projectName,
        facilitatorName: s.settings.facilitatorName,
        date: s.settings.date,
        participantCount: s.participants.length,
        depth: s.settings.depth,
        updatedAt: s.updatedAt,
        completed: s.progress.completed,
      }))
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  }

  async getSession(id: string): Promise<AssessmentSession | null> {
    const session = await db.sessions.get(id);
    if (!session || session.deletedAt) return null;
    return session;
  }

  async saveSession(session: AssessmentSession): Promise<void> {
    await db.sessions.put(session);
  }

  async deleteSession(id: string): Promise<void> {
    await db.sessions.delete(id);
  }

  async getActiveSessionId(): Promise<string | null> {
    const row = await db.appState.get(ACTIVE_SESSION_KEY);
    return row?.value ?? null;
  }

  async setActiveSessionId(id: string | null): Promise<void> {
    if (id === null) {
      await db.appState.delete(ACTIVE_SESSION_KEY);
    } else {
      await db.appState.put({ key: ACTIVE_SESSION_KEY, value: id });
    }
  }

  async hasSeenOnboarding(): Promise<boolean> {
    const row = await db.appState.get(ONBOARDING_KEY);
    return row?.value === "true";
  }

  async setSeenOnboarding(value: boolean): Promise<void> {
    await db.appState.put({ key: ONBOARDING_KEY, value: value ? "true" : "false" });
  }
}
