import { useState } from 'react';
import { PageHeader } from '@/components/shell/PageHeader';
import { supabase } from '@/lib/supabaseClient';
import { BACKUP_TABLES, buildBackupFilename, buildBackupPayload, type TableFetchResult } from '@/lib/backup';
import styles from './AdminPage.module.css';

type ExportState = { readonly status: 'idle' } | { readonly status: 'running' } | { readonly status: 'error'; readonly message: string } | { readonly status: 'done'; readonly filename: string; readonly errorCount: number };

export function AdminPage() {
  const [state, setState] = useState<ExportState>({ status: 'idle' });

  async function runExport() {
    const client = supabase;
    if (!client) {
      setState({ status: 'error', message: 'Supabase client is not initialized.' });
      return;
    }
    setState({ status: 'running' });

    const results: TableFetchResult[] = await Promise.all(
      BACKUP_TABLES.map(async (table) => {
        const { data, error } = await client.from(table).select('*');
        return { table, rows: data, error: error?.message ?? null };
      }),
    );

    const generatedAt = new Date().toISOString();
    const payload = buildBackupPayload(generatedAt, results);
    const filename = buildBackupFilename(generatedAt);

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);

    setState({ status: 'done', filename, errorCount: Object.keys(payload.errors).length });
  }

  return (
    <div className={styles.page}>
      <PageHeader title="Admin" subtitle="Export a full backup of every Supabase table to a single JSON file." />

      <div className={styles.panel}>
        <p className={styles.description}>
          Downloads one JSON file containing every row from all {BACKUP_TABLES.length} tables in <code>supabase/migrations/0001_schema.sql</code>,
          fetched with your authenticated session (so RLS applies exactly as it would for any signed-in researcher). Nothing is written back —
          this is read-only.
        </p>
        <button type="button" className={styles.exportButton} onClick={runExport} disabled={state.status === 'running'}>
          {state.status === 'running' ? 'Exporting…' : 'Export all tables to JSON'}
        </button>

        {state.status === 'error' ? <p className={styles.error}>Export failed: {state.message}</p> : null}
        {state.status === 'done' ? (
          <p className={styles.success}>
            Downloaded <code>{state.filename}</code>
            {state.errorCount > 0 ? ` — ${state.errorCount} table(s) failed to fetch and were recorded under "errors" instead of "tables".` : '.'}
          </p>
        ) : null}
      </div>
    </div>
  );
}
