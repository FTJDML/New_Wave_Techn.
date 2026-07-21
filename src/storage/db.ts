import Dexie, { type Table } from "dexie";
import type { AssessmentSession } from "@/domain/types";

export interface AppStateRow {
  key: string;
  value: string;
}

export class ReadinessScanDB extends Dexie {
  sessions!: Table<AssessmentSession, string>;
  appState!: Table<AppStateRow, string>;

  constructor() {
    super("data-ai-team-readiness-scan");
    this.version(1).stores({
      sessions: "id, updatedAt, deletedAt",
      appState: "key",
    });
  }
}

export const db = new ReadinessScanDB();
