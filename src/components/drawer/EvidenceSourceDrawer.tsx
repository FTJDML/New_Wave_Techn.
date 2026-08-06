import { useEffect } from 'react';
import type { EvidenceSource } from '@/types/catalogue';
import { getClaimsCitingSource, getComponent } from '@/data/fullCatalogue';
import { humanize } from '@/lib/formatting';
import styles from './SystemDetailDrawer.module.css';

interface EvidenceSourceDrawerProps {
  readonly source: EvidenceSource;
  readonly onClose: () => void;
  readonly onSelectComponent: (componentId: string) => void;
}

export function EvidenceSourceDrawer({ source, onClose, onSelectComponent }: EvidenceSourceDrawerProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const citingClaims = getClaimsCitingSource(source.source_id);

  return (
    <>
      <button type="button" className={styles.overlay} aria-label="Close evidence source detail" onClick={onClose} />
      <aside className={styles.drawer} role="dialog" aria-label={`${source.source_title} detail`} data-testid="evidence-source-drawer">
        <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close">
          ×
        </button>
        <div className={styles.header}>
          <div>
            <p className={styles.title}>{source.source_title}</p>
            <p className={styles.productName}>{source.publisher}</p>
          </div>
        </div>

        <div className={styles.badgeRow}>
          <span className={styles.badge}>{humanize(source.source_type)}</span>
          {source.reliability_rating_1_5 ? <span className={styles.badge}>Reliability {source.reliability_rating_1_5}/5</span> : null}
        </div>

        <p className={styles.sectionTitle}>Details</p>
        <div className={styles.factGrid}>
          <div className={styles.fact}>
            <span className={styles.factLabel}>Last verified</span>
            <span className={styles.factValue}>{source.last_verified_date || 'Unknown'}</span>
          </div>
          <div className={styles.fact}>
            <span className={styles.factLabel}>Published</span>
            <span className={styles.factValue}>{source.publication_date_or_year || 'Unknown'}</span>
          </div>
        </div>
        {source.evidence_scope ? (
          <>
            <p className={styles.sectionTitle}>Scope</p>
            <p className={styles.description}>{source.evidence_scope}</p>
          </>
        ) : null}
        {source.url_or_reference ? (
          <p className={styles.badgeRow}>
            <a className={styles.link} href={source.url_or_reference} target="_blank" rel="noreferrer">
              {source.url_or_reference} ↗
            </a>
          </p>
        ) : null}

        <p className={styles.sectionTitle}>Claims citing this source</p>
        {citingClaims.length > 0 ? (
          <ul className={styles.list}>
            {citingClaims.map((claim) => {
              const component = claim.subject_type === 'COMPONENT' ? getComponent(claim.subject_id) : undefined;
              return (
                <li key={claim.claim_id} className={styles.listItem}>
                  <div className={styles.listItemTitle}>{claim.value}</div>
                  <div className={styles.listItemMeta}>
                    {humanize(claim.claim_status)} · confidence {claim.confidence_score}
                    {component ? (
                      <>
                        {' · '}
                        <button type="button" className={styles.link} onClick={() => onSelectComponent(component.component_id)}>
                          {component.display_name}
                        </button>
                      </>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className={styles.emptySection}>No claims cite this source yet.</p>
        )}
      </aside>
    </>
  );
}
