import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/shell/PageHeader';
import { supabase } from '@/lib/supabaseClient';
import { buildStakeholderView, type OwnershipLinkRow, type StakeholderDisplay, type StakeholderRow } from '@/lib/stakeholderView';
import styles from './StakeholdersPage.module.css';

type LoadState = { readonly status: 'loading' } | { readonly status: 'error'; readonly message: string } | { readonly status: 'ready'; readonly stakeholders: readonly StakeholderDisplay[] };

export function StakeholdersPage() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    async function load() {
      if (!supabase) {
        setState({ status: 'error', message: 'Supabase client is not initialized.' });
        return;
      }
      const [stakeholdersResult, ownershipResult] = await Promise.all([
        supabase.from('stakeholders').select('*'),
        supabase.from('ownership_links').select('*'),
      ]);
      if (!active) return;
      if (stakeholdersResult.error) {
        setState({ status: 'error', message: stakeholdersResult.error.message });
        return;
      }
      if (ownershipResult.error) {
        setState({ status: 'error', message: ownershipResult.error.message });
        return;
      }
      setState({
        status: 'ready',
        stakeholders: buildStakeholderView(stakeholdersResult.data as StakeholderRow[], ownershipResult.data as OwnershipLinkRow[]),
      });
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className={styles.page}>
      <PageHeader title="Stakeholders" subtitle="Real names, roles and working ownership hypotheses — visible only to signed-in researchers." />

      {state.status === 'loading' ? <p className={styles.notice}>Loading stakeholders…</p> : null}

      {state.status === 'error' ? (
        <div className={styles.notice}>
          <p>Could not load stakeholders: {state.message}</p>
          <p className={styles.noticeSub}>
            If this is a freshly-provisioned project, run the seed script (<code>npx tsx supabase/seed/seed.ts</code>) after applying the
            migrations in <code>supabase/migrations/</code>.
          </p>
        </div>
      ) : null}

      {state.status === 'ready' && state.stakeholders.length === 0 ? (
        <p className={styles.notice}>No stakeholders have been seeded into this Supabase project yet.</p>
      ) : null}

      {state.status === 'ready' ? (
        <div className={styles.list}>
          {state.stakeholders.map((stakeholder) => (
            <article key={stakeholder.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.name}>{stakeholder.fullName}</h2>
                <span className={styles.classification}>{stakeholder.classification}</span>
              </div>
              {stakeholder.jobTitle || stakeholder.functionArea ? (
                <p className={styles.role}>{[stakeholder.jobTitle, stakeholder.functionArea].filter(Boolean).join(' · ')}</p>
              ) : null}
              {stakeholder.linkedinUrl ? (
                <a href={stakeholder.linkedinUrl} target="_blank" rel="noreferrer" className={styles.linkedin}>
                  LinkedIn profile
                </a>
              ) : null}
              {stakeholder.notes ? <p className={styles.notes}>{stakeholder.notes}</p> : null}

              <h3 className={styles.sectionLabel}>Ownership hypotheses</h3>
              {stakeholder.ownershipLinks.length === 0 ? (
                <p className={styles.emptyOwnership}>No ownership links recorded.</p>
              ) : (
                <ul className={styles.ownershipList}>
                  {stakeholder.ownershipLinks.map((link) => (
                    <li key={link.id} className={styles.ownershipItem}>
                      <strong>{link.ownershipRole}</strong> of {link.subjectLabel}
                      <span className={styles.ownershipMeta}>
                        {' '}
                        · {link.status}
                        {link.confidenceScore != null ? ` · ${link.confidenceScore}% confidence` : ''}
                      </span>
                      {link.notes ? <p className={styles.ownershipNotes}>{link.notes}</p> : null}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      ) : null}

      <div className={styles.gapNotice}>
        <h3 className={styles.sectionLabel}>CGI relationships</h3>
        <p className={styles.noticeSub}>
          Not shown here yet. The supplied Postgres schema (<code>supabase/migrations/0001_schema.sql</code>) has no
          table for CGI-relationship intelligence, and this data is materially more sensitive than the stakeholder
          records above — it names specific CGI colleagues and internal warmth/relationship notes. Rendering it from
          the local JSON bundle would not actually be access-controlled (that file ships to every browser regardless
          of sign-in state), so it is intentionally left out until a dedicated, RLS-protected table exists. See
          docs/PHASE5_REVIEW_REPORT.md for the full reasoning.
        </p>
      </div>
    </div>
  );
}
