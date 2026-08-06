// Pure helpers backing the /admin "export all tables" action (AdminPage.tsx). Kept
// dependency-free so the filename and payload-shaping logic are unit-testable without a
// Supabase client — AdminPage.tsx is the only place that actually issues the network requests.

// Every table declared in supabase/migrations/0001_schema.sql, in FK-safe order (matching
// supabase/seed/seed.ts) so a restored backup could be replayed in this same order.
export const BACKUP_TABLES: readonly string[] = [
  'vendors',
  'systems',
  'capabilities',
  'system_capabilities',
  'commercial_relationships',
  'commercial_relationship_systems',
  'evidence_sources',
  'claims',
  'claim_sources',
  'system_sources',
  'architecture_relationships',
  'architecture_relationship_sources',
  'technical_observations',
  'gaps',
  'gap_systems',
  'research_tasks',
  'programmes',
  'programme_systems',
  'stakeholders',
  'ownership_links',
  'architecture_views',
  'architecture_view_groups',
  'architecture_view_nodes',
  'architecture_view_edges',
  'audit_events',
];

export interface TableFetchResult {
  readonly table: string;
  readonly rows: readonly unknown[] | null;
  readonly error: string | null;
}

export interface BackupPayload {
  readonly generatedAt: string;
  readonly tables: Record<string, readonly unknown[]>;
  readonly errors: Record<string, string>;
}

export function buildBackupPayload(generatedAt: string, results: readonly TableFetchResult[]): BackupPayload {
  const tables: Record<string, readonly unknown[]> = {};
  const errors: Record<string, string> = {};
  for (const result of results) {
    if (result.error) {
      errors[result.table] = result.error;
    } else {
      tables[result.table] = result.rows ?? [];
    }
  }
  return { generatedAt, tables, errors };
}

export function buildBackupFilename(generatedAt: string): string {
  const sanitized = generatedAt.replace(/[:.]/g, '-');
  return `action-architecture-backup-${sanitized}.json`;
}
