import { useState } from 'react';
import type { TechnicalObservation } from '@/types/catalogue';
import { promoteObservation, mergedClaims, isObservationPromoted } from '@/research/store';
import { useResearchStoreVersion } from '@/research/useResearchStore';
import { AddClaimForm } from './AddClaimForm';
import styles from './forms.module.css';

interface PromoteObservationFormProps {
  readonly observation: TechnicalObservation;
  readonly componentId: string;
}

/**
 * A technical observation is never promoted automatically (CLAUDE.md, 04_DATA_MODEL...md).
 * Promotion requires an explicit, justified review: link (or create) a supporting claim and
 * state why the promotion is warranted. Both are logged to the audit trail.
 */
export function PromoteObservationForm({ observation, componentId }: PromoteObservationFormProps) {
  useResearchStoreVersion();
  const [open, setOpen] = useState(false);
  const [claimId, setClaimId] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<readonly string[]>([]);

  const promoted = isObservationPromoted(observation.observation_id);
  const candidateClaims = mergedClaims().filter((c) => c.subject_id === componentId);

  if (promoted) {
    return <span className={styles.successNote} data-testid={`promoted-${observation.observation_id}`}>✓ Promoted after review</span>;
  }

  if (!open) {
    return (
      <button type="button" className={styles.toggleButton} onClick={() => setOpen(true)} data-testid={`promote-toggle-${observation.observation_id}`}>
        Review &amp; promote
      </button>
    );
  }

  const submit = () => {
    const { result } = promoteObservation({ observation_id: observation.observation_id, claim_id: claimId || undefined, note });
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors([]);
    setOpen(false);
  };

  return (
    <div className={styles.panel} data-testid={`promote-panel-${observation.observation_id}`}>
      <p className={styles.helpText}>
        A technical observation may never be converted automatically into a confirmed relationship. Link the claim that justifies promoting "{observation.technology_name}",
        or add one below, and explain why.
      </p>
      <div className={styles.field}>
        <label className={styles.label} htmlFor={`promote-claim-${observation.observation_id}`}>Supporting claim</label>
        <select
          id={`promote-claim-${observation.observation_id}`}
          className={styles.select}
          value={claimId}
          onChange={(e) => setClaimId(e.target.value)}
        >
          <option value="">— select an existing claim —</option>
          {candidateClaims.map((c) => (
            <option key={c.claim_id} value={c.claim_id}>{c.value}</option>
          ))}
        </select>
      </div>
      <p className={styles.helpText}>No claim yet? Add one first, then come back and select it above.</p>
      <AddClaimForm defaultSubjectId={componentId} onCreated={(id) => setClaimId(id)} />
      <div className={[styles.field, styles.fieldWide, styles.spacedTop].join(' ')}>
        <label className={styles.label} htmlFor={`promote-note-${observation.observation_id}`}>Justification</label>
        <textarea id={`promote-note-${observation.observation_id}`} className={styles.textarea} value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      {errors.length > 0 ? (
        <ul className={styles.errorList} data-testid={`promote-errors-${observation.observation_id}`}>
          {errors.map((e) => (
            <li key={e} className={styles.errorItem}>{e}</li>
          ))}
        </ul>
      ) : null}
      <div className={styles.actions}>
        <button type="button" className={styles.primaryButton} onClick={submit} data-testid={`promote-submit-${observation.observation_id}`}>Promote</button>
        <button type="button" className={styles.secondaryButton} onClick={() => { setOpen(false); setErrors([]); }}>Cancel</button>
      </div>
    </div>
  );
}
