import { useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/shell/PageHeader';
import { parseCsv } from '@/lib/csv';
import { previewImportRows, importRows, getAuditLog } from '@/research/store';
import { useResearchStoreVersion } from '@/research/useResearchStore';
import type { ImportResult, ImportRowResult } from '@/research/types';
import formStyles from '@/components/forms/forms.module.css';
import pageStyles from './CatalogPage.module.css';
import styles from './ResearchPage.module.css';

type Tab = 'import' | 'audit';
type ImportKind = 'sources' | 'claims';

const SOURCE_TEMPLATE_COLUMNS = ['source_title', 'publisher', 'source_type', 'publication_date_or_year', 'url_or_reference', 'evidence_scope', 'reliability_rating_1_5', 'data_classification', 'notes'];
const CLAIM_TEMPLATE_COLUMNS = ['subject_type', 'subject_id', 'predicate', 'value', 'claim_status', 'confidence_score', 'source_ids (semicolon-separated)', 'data_classification', 'notes'];

function rowPreviewLabel(kind: ImportKind, row: Record<string, string>): string {
  return kind === 'sources' ? row.source_title || '(untitled)' : row.value || '(no claim value)';
}

export function ResearchPage() {
  useResearchStoreVersion();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get('tab') as Tab) || 'import';
  const setTab = (next: Tab) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', next);
    setSearchParams(params, { replace: true });
  };

  const [kind, setKind] = useState<ImportKind>('sources');
  const [rawCsv, setRawCsv] = useState('');
  const [rows, setRows] = useState<readonly Record<string, string>[]>([]);
  const [preview, setPreview] = useState<readonly ImportRowResult[] | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const templateColumns = kind === 'sources' ? SOURCE_TEMPLATE_COLUMNS : CLAIM_TEMPLATE_COLUMNS;

  const runPreview = (csvText: string) => {
    const parsed = parseCsv(csvText);
    setRows(parsed.rows);
    setPreview(previewImportRows(kind, parsed.rows));
    setImportResult(null);
  };

  const onFileChosen = async (file: File) => {
    const text = await file.text();
    setRawCsv(text);
    runPreview(text);
  };

  const confirmImport = () => {
    const result = importRows(kind, rows);
    setImportResult(result);
    setPreview(null);
  };

  const auditLog = getAuditLog();

  return (
    <div className={pageStyles.page}>
      <PageHeader title="Research" subtitle="Bulk-import evidence sources and claims via CSV, and review every local research edit in the audit history." />
      <div className={pageStyles.body}>
        <div className={pageStyles.tabs}>
          <button type="button" className={[pageStyles.tab, tab === 'import' ? pageStyles.tabActive : ''].join(' ')} onClick={() => setTab('import')}>
            CSV import
          </button>
          <button type="button" className={[pageStyles.tab, tab === 'audit' ? pageStyles.tabActive : ''].join(' ')} onClick={() => setTab('audit')}>
            Audit history ({auditLog.length})
          </button>
        </div>

        {tab === 'import' ? (
          <div>
            <div className={formStyles.field}>
              <label className={formStyles.label} htmlFor="import-kind">Import kind</label>
              <select
                id="import-kind"
                className={formStyles.select}
                value={kind}
                onChange={(e) => {
                  setKind(e.target.value as ImportKind);
                  setPreview(null);
                  setImportResult(null);
                }}
              >
                <option value="sources">Evidence sources</option>
                <option value="claims">Claims</option>
              </select>
            </div>
            <p className={formStyles.helpText}>Expected columns: {templateColumns.join(', ')}</p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              data-testid="csv-file-input"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onFileChosen(file);
              }}
            />
            <p className={formStyles.helpText}>…or paste CSV text below and click Preview.</p>
            <textarea
              className={styles.textarea}
              value={rawCsv}
              onChange={(e) => setRawCsv(e.target.value)}
              placeholder={templateColumns.join(',')}
              data-testid="csv-textarea"
            />
            <div className={formStyles.actions}>
              <button type="button" className={formStyles.primaryButton} onClick={() => runPreview(rawCsv)} data-testid="csv-preview-button">
                Preview
              </button>
            </div>

            {preview ? (
              <>
                <table className={styles.previewTable} data-testid="csv-preview-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Row</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((r) => (
                      <tr key={r.rowIndex}>
                        <td>{r.rowIndex + 1}</td>
                        <td>{rowPreviewLabel(kind, rows[r.rowIndex])}</td>
                        <td>
                          {r.ok ? (
                            <span className={styles.rowOk}>Valid</span>
                          ) : (
                            <>
                              <span className={styles.rowError}>Invalid</span>
                              <ul>
                                {r.errors.map((e) => (
                                  <li key={e} className={styles.errorText}>{e}</li>
                                ))}
                              </ul>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className={formStyles.actions}>
                  <button
                    type="button"
                    className={formStyles.primaryButton}
                    onClick={confirmImport}
                    disabled={preview.every((r) => !r.ok)}
                    data-testid="csv-confirm-import"
                  >
                    Import {preview.filter((r) => r.ok).length} valid row(s)
                  </button>
                </div>
              </>
            ) : null}

            {importResult ? (
              <p className={styles.summaryBanner} data-testid="csv-import-summary">
                Imported {importResult.importedCount} row(s), skipped {importResult.skippedCount}.
              </p>
            ) : null}
          </div>
        ) : (
          <table className={styles.auditTable} data-testid="audit-log-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Entity</th>
                <th>Action</th>
                <th>Summary</th>
              </tr>
            </thead>
            <tbody>
              {auditLog.map((event) => (
                <tr key={event.id}>
                  <td>{new Date(event.created_at).toLocaleString()}</td>
                  <td>{event.entity_type}</td>
                  <td>{event.action}</td>
                  <td>
                    {event.summary}
                    {event.note ? <div className={formStyles.helpText}>Note: {event.note}</div> : null}
                    <details className={styles.auditDetails}>
                      <summary>Before / after</summary>
                      <pre className={styles.auditDiff}>{JSON.stringify({ before: event.before, after: event.after }, null, 2)}</pre>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
