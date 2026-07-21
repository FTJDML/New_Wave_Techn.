import { DexieStorageAdapter } from "./dexieAdapter";
import type { StorageAdapter } from "./types";

export type { StorageAdapter, SessionSummary } from "./types";

/**
 * Enige plek waar de storage-implementatie wordt gekozen. Vervang deze
 * singleton later door een adapter die met een enterprise-backend praat
 * (dezelfde StorageAdapter-interface implementeert) om zonder wijzigingen in
 * features van lokale opslag naar een server-backend te migreren.
 */
export const storage: StorageAdapter = new DexieStorageAdapter();
