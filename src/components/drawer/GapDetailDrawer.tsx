import { useEffect } from 'react';
import type { ResearchGap } from '@/types/catalogue';
import { getDomain, getTasksForGap, getComponent } from '@/data/fullCatalogue';
import { humanize } from '@/lib/formatting';
import { priorityColor } from '@/lib/catalogueStatusMeta';
import styles from './SystemDetailDrawer.module.css';

interface GapDetailDrawerProps {
  readonly gap: ResearchGap;
  readonly onClose: () => void;
  readonly onSelectComponent: (componentId: string) => void;
}

/**
 * Deliberately does not render `target_stakeholders_or_sources` — that field holds real
 * personal names, and stakeholder identities stay out of the UI until an authenticated
 * phase exists (see docs/IMPLEMENTATION_AUDIT.md-equivalent privacy note for Phase 2).
 */
export function GapDetailDrawer({ gap, onClose, onSelectComponent }: GapDetailDrawerProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const domain = getDomain(gap.domain_id);
  const tasks = getTasksForGap(gap.gap_id);
  // Exclude the gap's own placeholder component — linked_component_ids includes it to mark
  // "which architecture object this gap concerns", which reads as a confusing self-link here.
  const linkedComponents = gap.linked_component_ids
    .filter((id) => id !== gap.gap_component_id)
    .map(getComponent)
    .filter((c) => c !== undefined);
  const resolvedComponent = gap.resolved_component_id ? getComponent(gap.resolved_component_id) : undefined;

  return (
    <>
      <button type="button" className={styles.overlay} aria-label="Close gap detail" onClick={onClose} />
      <aside className={styles.drawer} role="dialog" aria-label={`${gap.gap_title} detail`} data-testid="gap-detail-drawer">
        <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close">
          ×
        </button>
        <div className={styles.header}>
          <div>
            <p className={styles.title}>TO FIND — {gap.gap_title}</p>
            <p className={styles.productName}>{domain?.domain_name ?? humanize(gap.domain_id)}</p>
          </div>
        </div>

        <div className={styles.badgeRow}>
          <span className={styles.badge} style={{ background: priorityColor(gap.priority) }}>
            Priority {gap.priority}
          </span>
          <span className={styles.badge}>{humanize(gap.gap_status)}</span>
          {gap.impact_area ? <span className={styles.badge}>{humanize(gap.impact_area)}</span> : null}
        </div>

        <p className={styles.sectionTitle}>Why essential</p>
        <p className={styles.description}>{gap.why_essential}</p>

        <p className={styles.sectionTitle}>Research question</p>
        <p className={styles.description}>{gap.research_question}</p>

        {gap.current_hypothesis ? (
          <>
            <p className={styles.sectionTitle}>Current hypothesis</p>
            <p className={styles.description}>{gap.current_hypothesis}</p>
          </>
        ) : null}

        <p className={styles.sectionTitle}>Fastest research route</p>
        <div className={styles.factGrid}>
          <div className={styles.fact}>
            <span className={styles.factLabel}>Route</span>
            <span className={styles.factValue}>{gap.research_route || 'Unknown'}</span>
          </div>
          <div className={styles.fact}>
            <span className={styles.factLabel}>Evidence needed</span>
            <span className={styles.factValue}>{gap.evidence_needed || 'Unknown'}</span>
          </div>
        </div>

        {gap.recommended_next_action ? (
          <>
            <p className={styles.sectionTitle}>Recommended next action</p>
            <p className={styles.description}>{gap.recommended_next_action}</p>
          </>
        ) : null}

        {tasks.length > 0 ? (
          <>
            <p className={styles.sectionTitle}>Research tasks</p>
            <ul className={styles.list}>
              {tasks.map((t) => (
                <li key={t.task_id} className={styles.listItem}>
                  <div className={styles.listItemTitle}>{t.task_title}</div>
                  <div className={styles.listItemMeta}>
                    {humanize(t.status)} · {t.priority}
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : null}

        {linkedComponents.length > 0 ? (
          <>
            <p className={styles.sectionTitle}>Linked systems</p>
            <ul className={styles.list}>
              {linkedComponents.map((c) => (
                <li key={c!.component_id} className={styles.listItem}>
                  <button type="button" className={styles.link} onClick={() => onSelectComponent(c!.component_id)}>
                    {c!.display_name}
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : null}

        {gap.gap_status === 'RESOLVED' && gap.resolution_summary ? (
          <>
            <p className={styles.sectionTitle}>Resolution</p>
            <p className={styles.description}>{gap.resolution_summary}</p>
            {resolvedComponent ? (
              <p className={styles.badgeRow}>
                Resolved into{' '}
                <button type="button" className={styles.link} onClick={() => onSelectComponent(resolvedComponent.component_id)}>
                  {resolvedComponent.display_name}
                </button>
              </p>
            ) : null}
          </>
        ) : null}
      </aside>
    </>
  );
}
