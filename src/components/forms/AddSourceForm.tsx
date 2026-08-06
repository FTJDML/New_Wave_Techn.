import { useState } from 'react';
import { upsertSource } from '@/research/store';
import { CLASSIFICATIONS, type NewSourceInput } from '@/research/types';
import type { EvidenceSource } from '@/types/catalogue';
import { humanize } from '@/lib/formatting';
import styles from './forms.module.css';

const SOURCE_TYPES = ['FIRST_PARTY', 'FIRST_PARTY_JOB', 'PRIVATE_SOURCE', 'PROJECT_WORKING_FILE', 'TECHNICAL_ENDPOINT', 'TECHNICAL_SCAN', 'VENDOR_CASE', 'VISUAL_EVIDENCE'];

function emptyForm(): NewSourceInput {
  return {
    source_title: '',
    publisher: '',
    source_type: SOURCE_TYPES[0],
    publication_date_or_year: '',
    url_or_reference: '',
    evidence_scope: '',
    reliability_rating_1_5: 3,
    data_classification: 'INTERNAL',
    notes: '',
  };
}

function formFromExisting(source: EvidenceSource): NewSourceInput {
  return {
    source_title: source.source_title,
    publisher: source.publisher,
    source_type: source.source_type,
    publication_date_or_year: source.publication_date_or_year,
    url_or_reference: source.url_or_reference,
    evidence_scope: source.evidence_scope,
    reliability_rating_1_5: source.reliability_rating_1_5 || 3,
    data_classification: 'INTERNAL',
    notes: source.notes,
  };
}

interface AddSourceFormProps {
  readonly existing?: EvidenceSource;
  readonly onSaved?: (sourceId: string) => void;
}

/** Add mode (no `existing`) renders a collapsed "+ Add" toggle. Edit mode (`existing` set) renders open, always, with a "Save changes" button — used from EvidenceSourceDrawer. */
export function AddSourceForm({ existing, onSaved }: AddSourceFormProps) {
  const [open, setOpen] = useState(Boolean(existing));
  const [form, setForm] = useState<NewSourceInput>(() => (existing ? formFromExisting(existing) : emptyForm()));
  const [errors, setErrors] = useState<readonly string[]>([]);

  if (!open) {
    return (
      <button type="button" className={styles.toggleButton} onClick={() => setOpen(true)} data-testid="add-source-toggle">
        + Add evidence source
      </button>
    );
  }

  const submit = () => {
    const { result, source } = upsertSource(form, existing?.source_id);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors([]);
    if (!existing) {
      setForm(emptyForm());
      setOpen(false);
    }
    if (source) onSaved?.(source.source_id);
  };

  return (
    <div className={styles.panel} data-testid="add-source-panel">
      <div className={styles.grid}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="source-title">Title</label>
          <input id="source-title" className={styles.input} value={form.source_title} onChange={(e) => setForm({ ...form, source_title: e.target.value })} />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="source-publisher">Publisher</label>
          <input id="source-publisher" className={styles.input} value={form.publisher} onChange={(e) => setForm({ ...form, publisher: e.target.value })} />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="source-type">Source type</label>
          <select id="source-type" className={styles.select} value={form.source_type} onChange={(e) => setForm({ ...form, source_type: e.target.value })}>
            {SOURCE_TYPES.map((t) => (
              <option key={t} value={t}>{humanize(t)}</option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="source-reliability">Reliability (1-5)</label>
          <input
            id="source-reliability"
            type="number"
            min={1}
            max={5}
            className={styles.input}
            value={form.reliability_rating_1_5}
            onChange={(e) => setForm({ ...form, reliability_rating_1_5: Number(e.target.value) })}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="source-url">URL or reference</label>
          <input id="source-url" className={styles.input} value={form.url_or_reference} onChange={(e) => setForm({ ...form, url_or_reference: e.target.value })} />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="source-classification">Classification</label>
          <select
            id="source-classification"
            className={styles.select}
            value={form.data_classification}
            onChange={(e) => setForm({ ...form, data_classification: e.target.value as NewSourceInput['data_classification'] })}
          >
            {CLASSIFICATIONS.map((c) => (
              <option key={c} value={c}>{humanize(c)}</option>
            ))}
          </select>
        </div>
        <div className={[styles.field, styles.fieldWide].join(' ')}>
          <label className={styles.label} htmlFor="source-scope">Evidence scope</label>
          <textarea id="source-scope" className={styles.textarea} value={form.evidence_scope} onChange={(e) => setForm({ ...form, evidence_scope: e.target.value })} />
        </div>
      </div>
      {errors.length > 0 ? (
        <ul className={styles.errorList} data-testid="add-source-errors">
          {errors.map((e) => (
            <li key={e} className={styles.errorItem}>{e}</li>
          ))}
        </ul>
      ) : null}
      <div className={styles.actions}>
        <button type="button" className={styles.primaryButton} onClick={submit} data-testid="add-source-submit">
          {existing ? 'Save changes' : 'Save source'}
        </button>
        {!existing ? (
          <button type="button" className={styles.secondaryButton} onClick={() => { setOpen(false); setErrors([]); }}>Cancel</button>
        ) : null}
      </div>
    </div>
  );
}
