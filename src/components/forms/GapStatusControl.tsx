import { useState } from 'react';
import type { ResearchGap } from '@/types/catalogue';
import { patchGapStatus } from '@/research/store';
import { getAllowedGapTransitions } from '@/research/validation';
import { humanize } from '@/lib/formatting';
import styles from './forms.module.css';

export function GapStatusControl({ gap }: { readonly gap: ResearchGap }) {
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [errors, setErrors] = useState<readonly string[]>([]);

  const allowedNext = getAllowedGapTransitions(gap.gap_status);

  const confirm = () => {
    if (!pendingStatus) return;
    const outcome = patchGapStatus(gap.gap_id, pendingStatus, note, { resolution_summary: resolutionSummary || undefined });
    if (!outcome.ok) {
      setErrors(outcome.errors);
      return;
    }
    setErrors([]);
    setPendingStatus(null);
    setNote('');
    setResolutionSummary('');
  };

  return (
    <div data-testid="gap-status-control">
      <div className={styles.actions}>
        {allowedNext.map((status) => (
          <button
            key={status}
            type="button"
            className={pendingStatus === status ? styles.primaryButton : styles.secondaryButton}
            onClick={() => setPendingStatus(status)}
            data-testid={`gap-status-${status}`}
          >
            Move to {humanize(status)}
          </button>
        ))}
        {allowedNext.length === 0 ? <span className={styles.helpText}>No further transitions — this gap is resolved.</span> : null}
      </div>

      {pendingStatus ? (
        <div className={[styles.panel, styles.spacedTop].join(' ')} data-testid="gap-status-confirm">
          {pendingStatus === 'RESOLVED' ? (
            <div className={styles.field}>
              <label className={styles.label} htmlFor="gap-resolution-summary">Resolution summary (required)</label>
              <textarea id="gap-resolution-summary" className={styles.textarea} value={resolutionSummary} onChange={(e) => setResolutionSummary(e.target.value)} />
            </div>
          ) : null}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="gap-status-note">Note (why this move)</label>
            <textarea id="gap-status-note" className={styles.textarea} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          {errors.length > 0 ? (
            <ul className={styles.errorList} data-testid="gap-status-errors">
              {errors.map((e) => (
                <li key={e} className={styles.errorItem}>{e}</li>
              ))}
            </ul>
          ) : null}
          <div className={styles.actions}>
            <button type="button" className={styles.primaryButton} onClick={confirm} data-testid="gap-status-confirm-submit">
              Confirm move to {humanize(pendingStatus)}
            </button>
            <button type="button" className={styles.secondaryButton} onClick={() => { setPendingStatus(null); setErrors([]); }}>Cancel</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
