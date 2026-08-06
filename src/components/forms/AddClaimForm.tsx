import { useState } from 'react';
import { upsertClaim, mergedSources } from '@/research/store';
import { useResearchStoreVersion } from '@/research/useResearchStore';
import { CLASSIFICATIONS, type NewClaimInput } from '@/research/types';
import { humanize } from '@/lib/formatting';
import styles from './forms.module.css';

const SUBJECT_TYPES: readonly NewClaimInput['subject_type'][] = ['COMPONENT', 'PROGRAMME', 'ARCHITECTURE', 'COMMERCIAL_RELATIONSHIP'];

function emptyForm(defaults?: Partial<NewClaimInput>): NewClaimInput {
  return {
    subject_type: 'COMPONENT',
    subject_id: '',
    predicate: 'DEPLOYMENT_OR_RELATIONSHIP',
    value: '',
    claim_status: 'WORKING_HYPOTHESIS',
    confidence_score: 50,
    source_ids: [],
    data_classification: 'INTERNAL',
    notes: '',
    ...defaults,
  };
}

export function AddClaimForm({ defaultSubjectId, onCreated }: { readonly defaultSubjectId?: string; readonly onCreated?: (claimId: string) => void }) {
  useResearchStoreVersion();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<NewClaimInput>(() => emptyForm(defaultSubjectId ? { subject_id: defaultSubjectId } : undefined));
  const [errors, setErrors] = useState<readonly string[]>([]);
  const sources = mergedSources();

  if (!open) {
    return (
      <button type="button" className={styles.toggleButton} onClick={() => setOpen(true)} data-testid="add-claim-toggle">
        + Add claim
      </button>
    );
  }

  const toggleSource = (id: string) => {
    setForm((prev) => ({
      ...prev,
      source_ids: prev.source_ids.includes(id) ? prev.source_ids.filter((s) => s !== id) : [...prev.source_ids, id],
    }));
  };

  const submit = () => {
    const { result, claim } = upsertClaim(form);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors([]);
    setForm(emptyForm(defaultSubjectId ? { subject_id: defaultSubjectId } : undefined));
    setOpen(false);
    if (claim) onCreated?.(claim.claim_id);
  };

  return (
    <div className={styles.panel} data-testid="add-claim-panel">
      <div className={styles.grid}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="claim-subject-type">Subject type</label>
          <select
            id="claim-subject-type"
            className={styles.select}
            value={form.subject_type}
            onChange={(e) => setForm({ ...form, subject_type: e.target.value as NewClaimInput['subject_type'] })}
          >
            {SUBJECT_TYPES.map((t) => (
              <option key={t} value={t}>{humanize(t)}</option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="claim-subject-id">Subject id</label>
          <input id="claim-subject-id" className={styles.input} value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })} />
        </div>
        <div className={[styles.field, styles.fieldWide].join(' ')}>
          <label className={styles.label} htmlFor="claim-value">Claim</label>
          <textarea id="claim-value" className={styles.textarea} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="claim-status">Status</label>
          <input id="claim-status" className={styles.input} value={form.claim_status} onChange={(e) => setForm({ ...form, claim_status: e.target.value })} />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="claim-confidence">Confidence (0-100)</label>
          <input
            id="claim-confidence"
            type="number"
            min={0}
            max={100}
            className={styles.input}
            value={form.confidence_score}
            onChange={(e) => setForm({ ...form, confidence_score: Number(e.target.value) })}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="claim-classification">Classification</label>
          <select
            id="claim-classification"
            className={styles.select}
            value={form.data_classification}
            onChange={(e) => setForm({ ...form, data_classification: e.target.value as NewClaimInput['data_classification'] })}
          >
            {CLASSIFICATIONS.map((c) => (
              <option key={c} value={c}>{humanize(c)}</option>
            ))}
          </select>
        </div>
        <div className={[styles.field, styles.fieldWide].join(' ')}>
          <span className={styles.label}>Supporting sources</span>
          <div className={styles.checkboxRow} data-testid="claim-source-checkboxes">
            {sources.map((s) => (
              <label key={s.source_id} className={styles.checkboxLabel}>
                <input type="checkbox" checked={form.source_ids.includes(s.source_id)} onChange={() => toggleSource(s.source_id)} />
                {s.source_title}
              </label>
            ))}
          </div>
        </div>
      </div>
      {errors.length > 0 ? (
        <ul className={styles.errorList} data-testid="add-claim-errors">
          {errors.map((e) => (
            <li key={e} className={styles.errorItem}>{e}</li>
          ))}
        </ul>
      ) : null}
      <div className={styles.actions}>
        <button type="button" className={styles.primaryButton} onClick={submit} data-testid="add-claim-submit">Save claim</button>
        <button type="button" className={styles.secondaryButton} onClick={() => { setOpen(false); setErrors([]); }}>Cancel</button>
      </div>
    </div>
  );
}
