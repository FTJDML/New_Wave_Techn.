import { useState } from 'react';
import { upsertOwnershipLink, ownershipLinksForSubject, listMaskedStakeholders, getMaskedStakeholder } from '@/research/store';
import { useResearchStoreVersion } from '@/research/useResearchStore';
import { CLASSIFICATIONS, type Classification, type NewOwnershipLinkInput, type OwnershipLink } from '@/research/types';
import { humanize } from '@/lib/formatting';
import styles from './forms.module.css';

interface OwnershipSectionProps {
  readonly objectType: OwnershipLink['object_type'];
  readonly objectId: string;
}

function emptyForm(objectType: OwnershipLink['object_type'], objectId: string): NewOwnershipLinkInput {
  return {
    stakeholder_id: '',
    object_type: objectType,
    object_id: objectId,
    owner_role: '',
    status: 'HYPOTHESIS',
    confidence_score: 50,
    notes: '',
  };
}

/**
 * Renders ownership hypotheses without ever showing a stakeholder's real name — every read
 * path goes through `MaskedStakeholder`, which has no `full_name` field at all. New contacts
 * can be created here (the name is written once, then never read back by this UI).
 */
export function OwnershipSection({ objectType, objectId }: OwnershipSectionProps) {
  useResearchStoreVersion();
  const [open, setOpen] = useState(false);
  const [creatingContact, setCreatingContact] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactTitle, setNewContactTitle] = useState('');
  const [newContactClassification, setNewContactClassification] = useState<Classification>('INTERNAL_CONFIDENTIAL');
  const [form, setForm] = useState<NewOwnershipLinkInput>(() => emptyForm(objectType, objectId));
  const [errors, setErrors] = useState<readonly string[]>([]);

  const links = ownershipLinksForSubject(objectType, objectId);
  const contacts = listMaskedStakeholders();

  const submit = () => {
    const input: NewOwnershipLinkInput = creatingContact
      ? { ...form, stakeholder_id: undefined, new_stakeholder: { full_name: newContactName, title: newContactTitle, data_classification: newContactClassification } }
      : form;
    const { result } = upsertOwnershipLink(input);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors([]);
    setForm(emptyForm(objectType, objectId));
    setNewContactName('');
    setNewContactTitle('');
    setCreatingContact(false);
    setOpen(false);
  };

  return (
    <div data-testid="ownership-section">
      {links.length > 0 ? (
        <ul className={styles.ownershipList} data-testid="ownership-link-list">
          {links.map((link) => {
            const contact = getMaskedStakeholder(link.stakeholder_id);
            return (
              <li key={link.ownership_link_id} className={styles.ownershipItem}>
                <strong>{humanize(link.owner_role)}</strong> — {contact?.label ?? 'Unknown contact'} · {humanize(link.status)} · confidence {link.confidence_score}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className={styles.helpText}>No ownership hypotheses recorded yet.</p>
      )}

      {!open ? (
        <button type="button" className={styles.toggleButton} onClick={() => setOpen(true)} data-testid="add-ownership-toggle">
          + Add ownership hypothesis
        </button>
      ) : (
        <div className={styles.panel} data-testid="add-ownership-panel">
          <div className={styles.grid}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="ownership-contact">Contact</label>
              {!creatingContact ? (
                <select
                  id="ownership-contact"
                  className={styles.select}
                  value={form.stakeholder_id}
                  onChange={(e) => setForm({ ...form, stakeholder_id: e.target.value })}
                >
                  <option value="">— select a contact —</option>
                  {contacts.map((c) => (
                    <option key={c.stakeholder_id} value={c.stakeholder_id}>{c.label}{c.title ? ` (${c.title})` : ''}</option>
                  ))}
                </select>
              ) : (
                <span className={styles.helpText}>New contact — fill in below.</span>
              )}
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="ownership-role">Owner role</label>
              <input id="ownership-role" className={styles.input} value={form.owner_role} onChange={(e) => setForm({ ...form, owner_role: e.target.value })} placeholder="e.g. TECHNOLOGY_OWNER_OR_MANAGER" />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="ownership-status">Status</label>
              <select id="ownership-status" className={styles.select} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as NewOwnershipLinkInput['status'] })}>
                <option value="HYPOTHESIS">Hypothesis</option>
                <option value="CONFIRMED">Confirmed</option>
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="ownership-confidence">Confidence (0-100)</label>
              <input
                id="ownership-confidence"
                type="number"
                min={0}
                max={100}
                className={styles.input}
                value={form.confidence_score}
                onChange={(e) => setForm({ ...form, confidence_score: Number(e.target.value) })}
              />
            </div>
            <div className={[styles.field, styles.fieldWide].join(' ')}>
              <label className={styles.label} htmlFor="ownership-notes">Notes</label>
              <textarea id="ownership-notes" className={styles.textarea} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>

          {!creatingContact ? (
            <button type="button" className={styles.toggleButton} onClick={() => setCreatingContact(true)} data-testid="new-contact-toggle">
              + This is a new contact
            </button>
          ) : (
            <div className={[styles.panel, styles.spacedTop].join(' ')} data-testid="new-contact-panel">
              <p className={styles.helpText}>
                The name is written once and stored, but is never displayed anywhere in this app before authentication exists — this contact will show up everywhere else as a masked label like "Contact 3".
              </p>
              <div className={styles.grid}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="new-contact-name">Full name</label>
                  <input id="new-contact-name" className={styles.input} value={newContactName} onChange={(e) => setNewContactName(e.target.value)} data-testid="new-contact-name-input" />
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="new-contact-title">Title</label>
                  <input id="new-contact-title" className={styles.input} value={newContactTitle} onChange={(e) => setNewContactTitle(e.target.value)} />
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="new-contact-classification">Classification</label>
                  <select
                    id="new-contact-classification"
                    className={styles.select}
                    value={newContactClassification}
                    onChange={(e) => setNewContactClassification(e.target.value as Classification)}
                  >
                    {CLASSIFICATIONS.map((c) => (
                      <option key={c} value={c}>{humanize(c)}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {errors.length > 0 ? (
            <ul className={styles.errorList} data-testid="add-ownership-errors">
              {errors.map((e) => (
                <li key={e} className={styles.errorItem}>{e}</li>
              ))}
            </ul>
          ) : null}
          <div className={styles.actions}>
            <button type="button" className={styles.primaryButton} onClick={submit} data-testid="add-ownership-submit">Save ownership hypothesis</button>
            <button type="button" className={styles.secondaryButton} onClick={() => { setOpen(false); setErrors([]); setCreatingContact(false); }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
